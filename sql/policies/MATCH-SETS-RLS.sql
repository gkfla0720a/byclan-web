-- public.match_sets RLS 활성화 + 최소 권한 정책
-- 목적: anon 노출 위험 제거, 인증 사용자 중 '해당 경기 참여자(UUID)'만 조회/수정 허용
-- 실행 위치: Supabase SQL Editor

-- 1) RLS 활성화
alter table if exists public.match_sets enable row level security;

-- 테이블 소유자/고권한 세션까지 RLS를 강제하려면 주석 해제하세요.
-- alter table if exists public.match_sets force row level security;

-- 2) 정책 생성 (idempotent)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'match_sets'
  ) then
    -- SELECT: 경기 참여자만 허용
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'match_sets'
        and policyname = 'Match participants can view match sets'
    ) then
      create policy "Match participants can view match sets"
        on public.match_sets
        for select
        to authenticated
        using (
          exists (
            select 1
            from public.ladder_matches lm
            where lm.id = public.match_sets.match_id
              and (
                auth.uid() = any(coalesce(lm.team_a_ids, array[]::uuid[]))
                or auth.uid() = any(coalesce(lm.team_b_ids, array[]::uuid[]))
              )
          )
        );
    end if;

    -- UPDATE: 경기 참여자만 허용
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'match_sets'
        and policyname = 'Match participants can update match sets'
    ) then
      create policy "Match participants can update match sets"
        on public.match_sets
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.ladder_matches lm
            where lm.id = public.match_sets.match_id
              and (
                auth.uid() = any(coalesce(lm.team_a_ids, array[]::uuid[]))
                or auth.uid() = any(coalesce(lm.team_b_ids, array[]::uuid[]))
              )
          )
        )
        with check (
          exists (
            select 1
            from public.ladder_matches lm
            where lm.id = public.match_sets.match_id
              and (
                auth.uid() = any(coalesce(lm.team_a_ids, array[]::uuid[]))
                or auth.uid() = any(coalesce(lm.team_b_ids, array[]::uuid[]))
              )
          )
        );
    end if;
  end if;
end
$$;

-- 3) 명시적 GRANT 하드닝
-- Supabase 기본 권한 설정과 무관하게 의도를 분명히 고정합니다.
revoke all on table public.match_sets from anon;
revoke all on table public.match_sets from authenticated;
grant select, update on table public.match_sets to authenticated;

-- 4) 운영진/개발자 실시간 관리모드 정책 (옵션)
-- developer_settings.key='match_admin_live_mode'가 true일 때만 관리 권한을 엽니다.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'match_sets'
  ) then
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'match_sets'
        and policyname = 'Management can view match sets in live mode'
    ) then
      create policy "Management can view match sets in live mode"
        on public.match_sets
        for select
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
          and exists (
            select 1
            from public.developer_settings s
            where s.key = 'match_admin_live_mode'
              and coalesce(s.value_bool, false) = true
          )
        );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'match_sets'
        and policyname = 'Management can update match sets in live mode'
    ) then
      create policy "Management can update match sets in live mode"
        on public.match_sets
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
          and exists (
            select 1
            from public.developer_settings s
            where s.key = 'match_admin_live_mode'
              and coalesce(s.value_bool, false) = true
          )
        )
        with check (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
          and exists (
            select 1
            from public.developer_settings s
            where s.key = 'match_admin_live_mode'
              and coalesce(s.value_bool, false) = true
          )
        );
    end if;
  end if;
end
$$;

-- 5) 점검 쿼리
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='match_sets';
-- select policyname, permissive, cmd, roles, qual, with_check from pg_policies where schemaname='public' and tablename='match_sets';
