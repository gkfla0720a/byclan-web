-- profiles.points -> profiles."Clan_Point" 컬럼명 변경
-- Supabase SQL Editor에서 실행하세요.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'points'
  ) then
    alter table public.profiles rename column points to "Clan_Point";
  end if;
end
$$;

alter table public.profiles
  alter column "Clan_Point" set default 0;

update public.profiles
set "Clan_Point" = 0
where "Clan_Point" is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    discord_name,
    "ByID",
    role,
    "Clan_Point",
    race,
    intro,
    "Ladder_MMR",
    is_in_queue,
    vote_to_start
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'user'),
    'By_' || coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'user'),
    'visitor',
    0,
    'Terran',
    '클랜 방문자',
    1000,
    false,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

commit;
