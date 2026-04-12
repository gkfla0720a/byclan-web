-- ByClan profiles 데이터 보정 SQL (snake_case 기준)
-- 목적:
-- 1) profiles 테이블에 비어 있는 기본 데이터를 채움
-- 2) wins / losses 컬럼이 없으면 생성
-- 3) clan_point가 비어 있으면 자연스러운 구간값으로 채움
-- 4) 승률/전적이 비어 있으면 포인트 구간 기준으로 보정

begin;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clan_point') then
    update public.profiles
    set clan_point = 0
    where clan_point is null;
  end if;

alter table public.profiles alter column clan_point set default 0;
alter table public.profiles alter column ladder_mmr set default 1000;
alter table public.profiles alter column wins set default 0;
alter table public.profiles alter column losses set default 0;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'discord_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'by_id') then
    update public.profiles
    set by_id = 'By_' || regexp_replace(coalesce(nullif(discord_id, ''), 'guest'), '[^A-Za-z0-9_]', '', 'g')
    where by_id is null or btrim(by_id) = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'race') then
    with ranked as (
      select
        id,
        row_number() over (order by coalesce(discord_id, ''), id::text) as rn
      from public.profiles
      where race is null or btrim(race) = ''
    )
    update public.profiles p
    set race = case mod(r.rn - 1, 4)
      when 0 then 'Terran'
      when 1 then 'Protoss'
      when 2 then 'Zerg'
      else 'Random'
    end
    from ranked r
    where p.id = r.id;
  end if;

update public.profiles
set wins = 0
where wins is null;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clan_point') then
    with ranked as (
      select
        id,
        row_number() over (order by coalesce(discord_id, ''), id::text) as rn
      from public.profiles
      where clan_point is null
    )
    update public.profiles p
    set clan_point = case mod(r.rn - 1, 10)
      when 0 then 2480
      when 1 then 2260
      when 2 then 2090
      when 3 then 1910
      when 4 then 1740
      when 5 then 1580
      when 6 then 1420
      when 7 then 1270
      when 8 then 1110
      else 980
    end
    from ranked r
    where p.id = r.id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'wins') then
    update public.profiles
    set wins = case
      when coalesce(clan_point, 1000) >= 2400 then 68
      when coalesce(clan_point, 1000) >= 2200 then 54
      when coalesce(clan_point, 1000) >= 2000 then 43
      when coalesce(clan_point, 1000) >= 1800 then 35
      when coalesce(clan_point, 1000) >= 1600 then 28
      when coalesce(clan_point, 1000) >= 1400 then 21
      when coalesce(clan_point, 1000) >= 1200 then 15
      else 9
    end
    where wins is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'losses') then
    update public.profiles
    set losses = case
      when coalesce(clan_point, 1000) >= 2400 then 18
      when coalesce(clan_point, 1000) >= 2200 then 17
      when coalesce(clan_point, 1000) >= 2000 then 19
      when coalesce(clan_point, 1000) >= 1800 then 20
      when coalesce(clan_point, 1000) >= 1600 then 21
      when coalesce(clan_point, 1000) >= 1400 then 22
      when coalesce(clan_point, 1000) >= 1200 then 23
      else 24
    end
    where losses is null;
  end if;
end
$$;

-- 결과 점검
select
  id,
  discord_id,
  by_id,
  role,
  race,
  clan_point,
  wins,
  losses,
  case
    when coalesce(clan_point, 1000) >= 2400 then 'Challenger'
    when coalesce(clan_point, 1000) >= 2200 then 'Master'
    when coalesce(clan_point, 1000) >= 1900 then 'Diamond'
    when coalesce(clan_point, 1000) >= 1600 then 'Platinum'
    when coalesce(clan_point, 1000) >= 1350 then 'Gold'
    when coalesce(clan_point, 1000) >= 1100 then 'Silver'
    else 'Bronze'
  end as derived_tier
from public.profiles
order by coalesce(clan_point, 1000) desc, coalesce(by_id, '') asc;
