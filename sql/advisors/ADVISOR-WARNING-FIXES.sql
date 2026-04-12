-- Remaining Supabase Advisor warning fixes
-- 1) Pin mutable function search_path
-- 2) Simplify RLS policies to stable helper-function checks
-- 3) Remove duplicate policies that cause extra planner work

begin;

-- ---------------------------------------------------------------------------
-- 1. Helper functions for RLS init-plan friendly checks
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (array['admin', 'master'])
  )
$$;

create or replace function public.fn_has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any (allowed_roles)
  )
$$;

create or replace function public.fn_is_management()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_has_any_role(array['admin', 'master', 'developer'])
$$;

create or replace function public.fn_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_has_any_role(array['master', 'admin', 'elite'])
$$;

create or replace function public.fn_is_associate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_has_any_role(array['associate'])
$$;

create or replace function public.fn_is_match_live_mode_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.system_settings s
    where s.key = 'match_admin_live_mode'
      and coalesce(s.value_bool, false) = true
  )
$$;

-- ---------------------------------------------------------------------------
-- 2. Pin mutable search_path on existing trigger functions
-- ---------------------------------------------------------------------------
alter function public.fn_settle_match_bets() set search_path = public;
alter function public.fn_sync_total_mmr() set search_path = public;
alter function public.fn_log_post_create() set search_path = public;
alter function public.fn_apply_set_mmr_and_progress_match() set search_path = public;
alter function public.fn_log_profile_changes() set search_path = public;
alter function public.fn_apply_match_team_mmr() set search_path = public;
alter function public.fn_log_ladder_match_changes() set search_path = public;

-- ---------------------------------------------------------------------------
-- 3. applications
-- ---------------------------------------------------------------------------
drop policy if exists "심사관 수정 권한" on public.applications;
create policy "심사관 수정 권한"
  on public.applications
  for update
  to authenticated
  using ((select public.fn_is_reviewer()));

drop policy if exists "심사관 읽기 권한" on public.applications;
create policy "심사관 읽기 권한"
  on public.applications
  for select
  to authenticated
  using ((select public.fn_is_reviewer()));

drop policy if exists "준회원만 가입신청 가능" on public.applications;
create policy "준회원만 가입신청 가능"
  on public.applications
  for insert
  to authenticated
  with check (((select auth.uid()) = user_id) and (select public.fn_is_associate()));

-- ---------------------------------------------------------------------------
-- 4. notifications
-- ---------------------------------------------------------------------------
drop policy if exists "본인 알림 수정 가능" on public.notifications;
create policy "본인 알림 수정 가능"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "본인 알림 조회 가능" on public.notifications;
create policy "본인 알림 조회 가능"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "심사관 알림 생성 가능" on public.notifications;
create policy "심사관 알림 생성 가능"
  on public.notifications
  for insert
  to authenticated
  with check ((select public.fn_is_reviewer()));

-- ---------------------------------------------------------------------------
-- 5. posts
-- ---------------------------------------------------------------------------
drop policy if exists "로그인한 유저만 글 작성 가능" on public.posts;
create policy "로그인한 유저만 글 작성 가능"
  on public.posts
  for insert
  to authenticated
  with check (((select auth.uid()) = user_id));

drop policy if exists "로그인한 유저만 수정할 수 있음" on public.posts;
create policy "로그인한 유저만 수정할 수 있음"
  on public.posts
  for update
  to authenticated
  using (((select auth.uid()) = user_id));

-- ---------------------------------------------------------------------------
-- 6. profiles
-- ---------------------------------------------------------------------------
drop policy if exists "로그인한 유저는 프로필을 볼 수 있음" on public.profiles;
drop policy if exists "관리자 프로필 수정 허용" on public.profiles;

drop policy if exists "본인 프로필 수정 허용" on public.profiles;
create policy "본인 프로필 수정 허용"
  on public.profiles
  for update
  to authenticated
  using (((select auth.uid()) = id))
  with check (((select auth.uid()) = id));

drop policy if exists "관리자는 모든 프로필 수정 가능" on public.profiles;
create policy "관리자는 모든 프로필 수정 가능"
  on public.profiles
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "심사관이 신입으로 승급 허용" on public.profiles;
create policy "심사관이 신입으로 승급 허용"
  on public.profiles
  for update
  to authenticated
  using ((select public.fn_is_reviewer()));

-- ---------------------------------------------------------------------------
-- 7. ladder_matches
-- ---------------------------------------------------------------------------
drop policy if exists "로그인한 유저는 경기 기록을 볼 수 있음" on public.ladder_matches;

drop policy if exists "회원만 경기 생성 가능" on public.ladder_matches;
create policy "회원만 경기 생성 가능"
  on public.ladder_matches
  for insert
  to authenticated
  with check (((select auth.role()) = 'authenticated'));

drop policy if exists "방장만 경기 정보 수정 가능" on public.ladder_matches;
create policy "방장만 경기 정보 수정 가능"
  on public.ladder_matches
  for update
  to authenticated
  using (((select auth.uid()) = host_id));

-- ---------------------------------------------------------------------------
-- 8. match_bets
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert own match bets" on public.match_bets;
create policy "Users can insert own match bets"
  on public.match_bets
  for insert
  to authenticated
  with check (((select auth.uid()) = user_id));

drop policy if exists "Users can view own match bets" on public.match_bets;
create policy "Users can view own match bets"
  on public.match_bets
  for select
  to authenticated
  using (((select auth.uid()) = user_id));

-- ---------------------------------------------------------------------------
-- 9. match_sets
-- ---------------------------------------------------------------------------
drop policy if exists "Match participants can view match sets" on public.match_sets;
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
          (select auth.uid()) = any (coalesce(lm.team_a_ids, array[]::uuid[]))
          or (select auth.uid()) = any (coalesce(lm.team_b_ids, array[]::uuid[]))
        )
    )
  );

drop policy if exists "Match participants can update match sets" on public.match_sets;
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
          (select auth.uid()) = any (coalesce(lm.team_a_ids, array[]::uuid[]))
          or (select auth.uid()) = any (coalesce(lm.team_b_ids, array[]::uuid[]))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.ladder_matches lm
      where lm.id = public.match_sets.match_id
        and (
          (select auth.uid()) = any (coalesce(lm.team_a_ids, array[]::uuid[]))
          or (select auth.uid()) = any (coalesce(lm.team_b_ids, array[]::uuid[]))
        )
    )
  );

drop policy if exists "Management can view match sets in live mode" on public.match_sets;
create policy "Management can view match sets in live mode"
  on public.match_sets
  for select
  to authenticated
  using (((select public.fn_is_management())) and ((select public.fn_is_match_live_mode_enabled())));

drop policy if exists "Management can update match sets in live mode" on public.match_sets;
create policy "Management can update match sets in live mode"
  on public.match_sets
  for update
  to authenticated
  using (((select public.fn_is_management())) and ((select public.fn_is_match_live_mode_enabled())))
  with check (((select public.fn_is_management())) and ((select public.fn_is_match_live_mode_enabled())));

drop policy if exists "Participants or management can update match sets" on public.match_sets;
drop policy if exists "Participants or management can view match sets" on public.match_sets;

-- ---------------------------------------------------------------------------
-- 10. system_settings
-- ---------------------------------------------------------------------------
drop policy if exists "Management can insert system settings" on public.system_settings;
create policy "Management can insert system settings"
  on public.system_settings
  for insert
  to authenticated
  with check ((select public.fn_is_management()));

drop policy if exists "Management can read system settings" on public.system_settings;
create policy "Management can read system settings"
  on public.system_settings
  for select
  to authenticated
  using ((select public.fn_is_management()));

drop policy if exists "Management can update system settings" on public.system_settings;
create policy "Management can update system settings"
  on public.system_settings
  for update
  to authenticated
  using ((select public.fn_is_management()))
  with check ((select public.fn_is_management()));

commit;