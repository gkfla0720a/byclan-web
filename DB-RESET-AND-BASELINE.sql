-- ============================================================================
-- DB-RESET-AND-BASELINE.sql
-- 목적:
-- - 서비스 이전 단계용 공격적 초기화
-- - 핵심 public 테이블 데이터 초기화 후 기본 운영 설정 복구
--
-- 주의:
-- - public 데이터가 삭제됩니다.
-- - auth.users는 기본적으로 보존합니다. (옵션 블록 참고)
-- ============================================================================

begin;

-- 1) public 도메인 데이터 초기화
truncate table
  public.match_bets,
  public.match_sets,
  public.ladder_matches,
  public.ladders,
  public.point_logs,
  public.notifications,
  public.posts,
  public.notice_posts,
  public.admin_posts,
  public.applications,
  public.system_settings,
  public.profiles
restart identity cascade;

-- 2) 기본 운영 플래그 복구
insert into public.system_settings(key, value_bool, description)
values
  ('feature_ladder_enabled', true, '래더 기능 활성화 여부'),
  ('feature_betting_enabled', true, '베팅 기능 활성화 여부'),
  ('feature_applications_open', true, '가입 신청 오픈 여부'),
  ('feature_notice_enabled', true, '공지 기능 활성화 여부')
on conflict (key) do update
set value_bool = excluded.value_bool,
    description = excluded.description,
    updated_at = now();

commit;

-- ----------------------------------------------------------------------------
-- 선택 옵션: 인증 계정(auth.users)까지 전부 리셋하고 싶다면 아래를 별도 실행
-- ----------------------------------------------------------------------------
-- delete from auth.identities;
-- delete from auth.sessions;
-- delete from auth.refresh_tokens;
-- delete from auth.users;
