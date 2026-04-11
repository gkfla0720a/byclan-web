-- profiles 래더 MMR 컬럼명을 snake_case 표준으로 정리합니다.
-- 대상: ladder_points / "Ladder_MMR" -> ladder_mmr

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'ladder_points'
  ) then
    alter table public.profiles rename column ladder_points to ladder_mmr;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'Ladder_MMR'
  ) then
    alter table public.profiles rename column "Ladder_MMR" to ladder_mmr;
  end if;
end
$$;

alter table public.profiles
  add column if not exists ladder_mmr integer;

alter table public.profiles
  alter column ladder_mmr set default 1000;

update public.profiles
set ladder_mmr = 1000
where ladder_mmr is null;

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
    'Terran',
    '클랜 방문자',
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

-- 결과 확인
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'ladder_mmr';
