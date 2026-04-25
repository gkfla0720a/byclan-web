-- ============================================================================
-- DB-LINKAGE-HARDENING-PROPOSAL.sql
-- 목적:
-- 1) 유저 기록/매치 연결 강도 강화
-- 2) 관리자/프론트 조회 성능 개선
-- 3) 데이터 미충전 환경에서 운영 가능한 컬럼/기본값 보강
--
-- 주의:
-- - 비파괴적 제안 위주이며, 가능한 IF NOT EXISTS/조건부 블록 사용
-- - 운영 적용 전 스테이징에서 실행 검증 권장
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- A. 인덱스 보강 (FK + 운영 조회)
-- ----------------------------------------------------------------------------

create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_tester_id on public.applications(tester_id);

create index if not exists idx_ladders_user_id on public.ladders(user_id);

create index if not exists idx_ladder_matches_host_id on public.ladder_matches(host_id);
create index if not exists idx_ladder_matches_status_created_at on public.ladder_matches(status, created_at desc);

create index if not exists idx_match_sets_match_id on public.match_sets(match_id);
create index if not exists idx_match_sets_match_id_set_number on public.match_sets(match_id, set_number);

create index if not exists idx_match_bets_match_id on public.match_bets(match_id);
create index if not exists idx_match_bets_user_id on public.match_bets(user_id);
create index if not exists idx_match_bets_match_user on public.match_bets(match_id, user_id);

create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

create index if not exists idx_notice_posts_author_id on public.notice_posts(author_id);
create index if not exists idx_notice_posts_created_at on public.notice_posts(created_at desc);

create index if not exists idx_admin_posts_author_id on public.admin_posts(author_id);
create index if not exists idx_admin_posts_created_at on public.admin_posts(created_at desc);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read_created on public.notifications(user_id, is_read, created_at desc);

create index if not exists idx_point_logs_user_id on public.point_logs(user_id);
create index if not exists idx_point_logs_user_created on public.point_logs(user_id, created_at desc);

-- by_id 충돌 방지 (NULL 제외)
create unique index if not exists uq_profiles_by_id_not_null on public.profiles(by_id) where by_id is not null;

-- ----------------------------------------------------------------------------
-- B. 도메인 제약 강화 (현재 데이터 호환형)
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_profiles_role_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint chk_profiles_role_allowed
      check (role is null or role in (
        'developer','master','admin','elite','member','rookie','applicant','associate','visitor','guest','expelled'
      ));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_applications_status_allowed'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint chk_applications_status_allowed
      check (status is null or status in ('대기중','합격','불합격'));
  end if;
end $$;

do $$
begin
  -- 기존 데이터 정규화: 제약 추가 전에 상태값을 앱 표준 상태로 수렴시킵니다.
  -- 앱 표준 상태: 모집중, 제안중, 진행중, 완료, 거절됨
  update public.ladder_matches
  set status = case
    when status is null then null
    when status in ('모집중','제안중','진행중','완료','거절됨') then status
    when status = '종료' then '완료'
    when status = '취소' then '거절됨'
    else '완료'
  end
  where status is distinct from case
    when status is null then null
    when status in ('모집중','제안중','진행중','완료','거절됨') then status
    when status = '종료' then '완료'
    when status = '취소' then '거절됨'
    else '완료'
  end;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_ladder_matches_status_allowed'
      and conrelid = 'public.ladder_matches'::regclass
  ) then
    alter table public.ladder_matches
      add constraint chk_ladder_matches_status_allowed
      check (status is null or status in ('모집중','제안중','진행중','완료','거절됨'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- C. 연결/이력 보조 컬럼 추가
-- ----------------------------------------------------------------------------

alter table public.applications
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists review_note_summary text;

alter table public.notifications
  add column if not exists type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists read_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_notifications_type_allowed'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint chk_notifications_type_allowed
      check (type is null or type in (
        'application','match','match_set','bet','point','system','notice','admin'
      ));
  end if;
end $$;

create index if not exists idx_notifications_type_created on public.notifications(type, created_at desc);

alter table public.point_logs
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists balance_after integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_point_logs_source_type_allowed'
      and conrelid = 'public.point_logs'::regclass
  ) then
    alter table public.point_logs
      add constraint chk_point_logs_source_type_allowed
      check (source_type is null or source_type in (
        'manual','match','bet','application','system','event'
      ));
  end if;
end $$;

create index if not exists idx_point_logs_source on public.point_logs(source_type, source_id);

alter table public.ladder_matches
  add column if not exists finalized_at timestamptz;

-- ----------------------------------------------------------------------------
-- D. 데이터 미충전 환경 대응용 시드/백필
-- ----------------------------------------------------------------------------

insert into public.developer_settings(key, value_bool, description)
values
  ('feature_ladder_enabled', true, '래더 기능 활성화 여부'),
  ('feature_betting_enabled', true, '베팅 기능 활성화 여부'),
  ('feature_applications_open', true, '가입 신청 오픈 여부'),
  ('feature_notice_enabled', true, '공지 기능 활성화 여부')
on conflict (key) do nothing;

-- ladders.user_id 백필 시도: nickname == profiles.by_id 인 경우 연결
update public.ladders l
set user_id = p.id
from public.profiles p
where l.user_id is null
  and l.nickname is not null
  and p.by_id = l.nickname;

-- 읽음 상태와 read_at 동기화
update public.notifications
set read_at = coalesce(read_at, created_at)
where is_read = true
  and read_at is null;

-- ----------------------------------------------------------------------------
-- E. 단계적 강제 전환을 위한 검증 뷰
-- ----------------------------------------------------------------------------

create or replace view public.v_integrity_gaps
with (security_invoker = true) as
select 'ladders.user_id_missing' as check_name, count(*)::bigint as issue_count
from public.ladders where user_id is null
union all
select 'notifications.type_missing', count(*)::bigint
from public.notifications where type is null
union all
select 'point_logs.source_type_missing', count(*)::bigint
from public.point_logs where source_type is null;

commit;

-- 후속 권장(수동):
-- 1) v_integrity_gaps 값이 0에 수렴한 뒤 NOT NULL 전환 검토
-- 2) match player 정규화 테이블(public.match_players) 분리 검토
