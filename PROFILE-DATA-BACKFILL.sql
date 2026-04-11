-- ByClan profiles 데이터 보정 SQL (snake_case 기준)
-- 목적:
-- 1) profiles 핵심 컬럼 기본값 보정
-- 2) by_id / role / race / intro 누락값 보정
-- 3) ladder_mmr, wins, losses 누락값 보정

begin;

alter table public.profiles add column if not exists by_id text;
alter table public.profiles add column if not exists clan_point integer;
alter table public.profiles add column if not exists ladder_mmr integer;
alter table public.profiles add column if not exists wins integer;
alter table public.profiles add column if not exists losses integer;

alter table public.profiles alter column clan_point set default 0;
alter table public.profiles alter column ladder_mmr set default 1000;
alter table public.profiles alter column wins set default 0;
alter table public.profiles alter column losses set default 0;

update public.profiles
set clan_point = 0
where clan_point is null;

update public.profiles
set ladder_mmr = 1000
where ladder_mmr is null;

update public.profiles
set wins = 0
where wins is null;

update public.profiles
set losses = 0
where losses is null;

update public.profiles
set role = 'member'
where role is null or btrim(role) = '';

update public.profiles
set by_id = 'By_' || substring(replace(id::text, '-', '') from 1 for 10)
where by_id is null or btrim(by_id) = '';

update public.profiles
set race = 'Terran'
where race is null or btrim(race) = '';

update public.profiles
set intro = '최근 래더와 클랜 활동을 시작한 멤버입니다. 같이 편하게 게임해요.'
where intro is null or btrim(intro) = '';

commit;

-- 결과 점검
select
  id,
  by_id,
  role,
  race,
  ladder_mmr,
  clan_point,
  wins,
  losses,
  case
    when coalesce(ladder_mmr, 1000) >= 2400 then 'Challenger'
    when coalesce(ladder_mmr, 1000) >= 2200 then 'Master'
    when coalesce(ladder_mmr, 1000) >= 1900 then 'Diamond'
    when coalesce(ladder_mmr, 1000) >= 1600 then 'Platinum'
    when coalesce(ladder_mmr, 1000) >= 1350 then 'Gold'
    when coalesce(ladder_mmr, 1000) >= 1100 then 'Silver'
    else 'Bronze'
  end as derived_tier
from public.profiles
order by coalesce(ladder_mmr, 1000) desc, coalesce(by_id, '') asc;