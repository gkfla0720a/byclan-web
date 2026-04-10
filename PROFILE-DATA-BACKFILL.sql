-- ByClan 프로필 데이터 보정 SQL
-- Supabase SQL Editor에서 그대로 실행할 수 있습니다.
-- 목적:
-- 1) profiles 테이블에 비어 있는 기본 데이터를 채움
-- 2) wins / losses 컬럼이 없으면 생성
-- 3) Clan_point가 비어 있으면 자연스러운 구간값으로 채움
-- 4) 승률/전적이 비어 있으면 포인트 구간 기준으로 보정

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    alter table public.profiles add column if not exists wins integer;
    alter table public.profiles add column if not exists losses integer;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'points') then
    update public.profiles
    set points = 0
    where points is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    update public.profiles
    set role = 'member'
    where role is null or btrim(role) = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'discord_name')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'ByID') then
    update public.profiles
    set "ByID" = 'By_' || regexp_replace(coalesce(nullif(discord_name, ''), 'guest'), '[^A-Za-z0-9_]', '', 'g')
    where "ByID" is null or btrim("ByID") = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'race') then
    with ranked as (
      select
        id,
        row_number() over (order by coalesce(discord_name, ''), id::text) as rn
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

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'intro') then
    update public.profiles
    set intro = '최근 래더와 클랜 활동을 시작한 멤버입니다. 같이 편하게 게임해요.'
    where intro is null or btrim(intro) = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'Clan_point') then
    with ranked as (
      select
        id,
        row_number() over (order by coalesce(discord_name, ''), id::text) as rn
      from public.profiles
      where Clan_point is null
    )
    update public.profiles p
    set Clan_point = case mod(r.rn - 1, 10)
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
      when coalesce(Clan_point, 1000) >= 2400 then 68
      when coalesce(Clan_point, 1000) >= 2200 then 54
      when coalesce(Clan_point, 1000) >= 2000 then 43
      when coalesce(Clan_point, 1000) >= 1800 then 35
      when coalesce(Clan_point, 1000) >= 1600 then 28
      when coalesce(Clan_point, 1000) >= 1400 then 21
      when coalesce(Clan_point, 1000) >= 1200 then 15
      else 9
    end
    where wins is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'losses') then
    update public.profiles
    set losses = case
      when coalesce(Clan_point, 1000) >= 2400 then 18
      when coalesce(Clan_point, 1000) >= 2200 then 17
      when coalesce(Clan_point, 1000) >= 2000 then 19
      when coalesce(Clan_point, 1000) >= 1800 then 20
      when coalesce(Clan_point, 1000) >= 1600 then 21
      when coalesce(Clan_point, 1000) >= 1400 then 22
      when coalesce(Clan_point, 1000) >= 1200 then 23
      else 24
    end
    where losses is null;
  end if;
end
$$;

-- 결과 점검
select
  id,
  discord_name,
  "ByID",
  role,
  race,
  Clan_point,
  wins,
  losses,
  case
    when coalesce(Clan_point, 1000) >= 2400 then 'Challenger'
    when coalesce(Clan_point, 1000) >= 2200 then 'Master'
    when coalesce(Clan_point, 1000) >= 1900 then 'Diamond'
    when coalesce(Clan_point, 1000) >= 1600 then 'Platinum'
    when coalesce(Clan_point, 1000) >= 1350 then 'Gold'
    when coalesce(Clan_point, 1000) >= 1100 then 'Silver'
    else 'Bronze'
  end as derived_tier
from public.profiles
order by coalesce(Clan_point, 1000) desc, coalesce(discord_name, '') asc;