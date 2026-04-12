-- profiles 컬럼명을 snake_case 표준으로 정리합니다.
-- 대상: points / "Clan_Point" -> clan_point, "ByID" -> by_id
-- Supabase SQL Editor에서 실행하세요.

begin;

do $$
begin
  -- points -> clan_point
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'points'
  ) then
    alter table public.profiles rename column points to clan_point;
  end if;

  -- "Clan_Point" -> clan_point
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'Clan_Point'
  ) then
    alter table public.profiles rename column "Clan_Point" to clan_point;
  end if;

  -- "ByID" -> by_id
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'ByID'
  ) then
    alter table public.profiles rename column "ByID" to by_id;
  end if;
end
$$;

alter table public.profiles
  add column if not exists clan_point integer;

alter table public.profiles
  add column if not exists by_id text;

alter table public.profiles
  alter column clan_point set default 0;

update public.profiles
set clan_point = 0
where clan_point is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    by_id,
    role,
    clan_point,
    ladder_mmr,
    race,
    intro,
    is_in_queue,
    vote_to_start,
    wins,
    losses
  )
  values (
    new.id,
    'By_' || coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'user'),
    'visitor',
    0,
    1000,
    '미지정',
    '',
    false,
    false,
    0,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

commit;
