-- ============================================================================
-- DB-STATUS-STANDARDIZATION.sql
-- 목적:
-- - 코드/DB 상태값을 단일 체계로 표준화
-- - 제약 추가 전에 기존 데이터를 자동 정규화
-- ============================================================================

begin;

-- ladder_matches.status 표준화
-- 표준: 모집중, 제안중, 진행중, 완료, 거절됨
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

do $$
begin
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

-- match_sets.status 표준화
-- 표준: 엔트리제출중, 진행중, 완료
update public.match_sets
set status = case
  when status is null then null
  when status in ('엔트리제출중','진행중','완료') then status
  when status in ('종료','취소') then '완료'
  else '완료'
end
where status is distinct from case
  when status is null then null
  when status in ('엔트리제출중','진행중','완료') then status
  when status in ('종료','취소') then '완료'
  else '완료'
end;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_match_sets_status_allowed'
      and conrelid = 'public.match_sets'::regclass
  ) then
    alter table public.match_sets
      add constraint chk_match_sets_status_allowed
      check (status is null or status in ('엔트리제출중','진행중','완료'));
  end if;
end $$;

commit;
