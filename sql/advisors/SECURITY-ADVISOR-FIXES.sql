-- Security Advisor 경고 해소용 SQL
-- 대상:
-- 1) public.admin_audit_logs / public.activity_logs 의 RLS 미설정
-- 2) security definer view 경고 (v_manual_activity_review, v_integrity_gaps, v_match_bet_odds)
--
-- 적용 방식:
-- - 로그 테이블에는 management 역할 전용 RLS 적용
-- - v_match_bet_odds 는 뷰를 제거하고 SECURITY DEFINER RPC 함수로 대체
-- - v_manual_activity_review / v_integrity_gaps 는 security_invoker 로 전환

-- ---------------------------------------------------------------------------
-- 1. admin_audit_logs RLS
-- ---------------------------------------------------------------------------
alter table if exists public.admin_audit_logs enable row level security;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_audit_logs'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'admin_audit_logs'
        and policyname = 'Management can read admin audit logs'
    ) then
      create policy "Management can read admin audit logs"
        on public.admin_audit_logs
        for select
        to authenticated
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'admin_audit_logs'
        and policyname = 'Management can insert admin audit logs'
    ) then
      create policy "Management can insert admin audit logs"
        on public.admin_audit_logs
        for insert
        to authenticated
        with check (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;
  end if;
end
$$;

revoke all on table public.admin_audit_logs from anon;
revoke all on table public.admin_audit_logs from authenticated;
grant select, insert on table public.admin_audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- 2. activity_logs RLS
-- ---------------------------------------------------------------------------
alter table if exists public.activity_logs enable row level security;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'activity_logs'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'activity_logs'
        and policyname = 'Management can read activity logs'
    ) then
      create policy "Management can read activity logs"
        on public.activity_logs
        for select
        to authenticated
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'activity_logs'
        and policyname = 'Management can insert activity logs'
    ) then
      create policy "Management can insert activity logs"
        on public.activity_logs
        for insert
        to authenticated
        with check (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;
  end if;
end
$$;

revoke all on table public.activity_logs from anon;
revoke all on table public.activity_logs from authenticated;
grant select, insert on table public.activity_logs to authenticated;

-- ---------------------------------------------------------------------------
-- 3. security definer view 제거/전환
-- ---------------------------------------------------------------------------
-- 3-1. manual review view -> security invoker
create or replace view public.v_manual_activity_review
with (security_invoker = true) as
select
  id,
  created_at,
  category,
  action_type,
  actor_id,
  actor_by_id,
  actor_role,
  target_user_id,
  target_table,
  target_id,
  summary,
  before_data,
  after_data,
  meta
from public.activity_logs
where is_manual = true
order by created_at desc;

-- 3-2. integrity gaps view -> security invoker
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

-- 3-3. match odds view 제거, RPC 함수로 대체
DROP VIEW IF EXISTS public.v_match_bet_odds;

create or replace function public.fn_get_match_bet_odds(p_match_id uuid)
returns table (
  match_id uuid,
  total_a bigint,
  total_b bigint,
  count_a bigint,
  count_b bigint,
  total_pool bigint,
  odds_a numeric,
  odds_b numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p_match_id as match_id,
    coalesce(sum(bet_amount) filter (where team_choice = 'A'), 0) as total_a,
    coalesce(sum(bet_amount) filter (where team_choice = 'B'), 0) as total_b,
    count(*) filter (where team_choice = 'A') as count_a,
    count(*) filter (where team_choice = 'B') as count_b,
    coalesce(sum(bet_amount), 0) as total_pool,
    round(
      case when coalesce(sum(bet_amount) filter (where team_choice = 'A'), 0) > 0
      then (coalesce(sum(bet_amount), 0)::numeric / (sum(bet_amount) filter (where team_choice = 'A'))::numeric)
      else 0 end,
      2
    ) as odds_a,
    round(
      case when coalesce(sum(bet_amount) filter (where team_choice = 'B'), 0) > 0
      then (coalesce(sum(bet_amount), 0)::numeric / (sum(bet_amount) filter (where team_choice = 'B'))::numeric)
      else 0 end,
      2
    ) as odds_b
  from public.match_bets
  where status = 'pending'
    and match_id = p_match_id
$$;

revoke all on function public.fn_get_match_bet_odds(uuid) from public;
grant execute on function public.fn_get_match_bet_odds(uuid) to authenticated;
