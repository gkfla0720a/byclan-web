-- public.match_bets RLS 활성화 및 기본 정책
-- Supabase SQL Editor에서 실행하세요.

alter table if exists public.match_bets enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'match_bets'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'match_bets'
        and policyname = 'Users can view own match bets'
    ) then
      create policy "Users can view own match bets"
        on public.match_bets
        for select
        to authenticated
        using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'match_bets'
        and policyname = 'Users can insert own match bets'
    ) then
      create policy "Users can insert own match bets"
        on public.match_bets
        for insert
        to authenticated
        with check (auth.uid() = user_id);
    end if;
  end if;
end
$$;
