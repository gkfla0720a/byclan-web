-- ============================================================
-- LADDER-MMR-COLUMN-RENAME.sql
-- profiles 테이블: ladder_points / "Ladder_MMR" → ladder_mmr 컬럼 rename
-- ladders 테이블: "Ladder_MMR" → ladder_mmr 컬럼 rename
-- Supabase SQL Editor에서 1회 실행 (순서대로 실행할 것)
-- ============================================================

begin;

-- 1) profiles 컬럼 이름 변경
do $$
begin
  -- ladder_points -> ladder_mmr
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'ladder_points'
  ) then
    alter table public.profiles rename column ladder_points to ladder_mmr;
  end if;

  -- "Ladder_MMR" -> ladder_mmr
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

-- 2) profiles.ladder_mmr 컬럼 보장 및 기본값 설정
alter table public.profiles
  add column if not exists ladder_mmr integer;

alter table public.profiles
  alter column ladder_mmr set default 1000;

update public.profiles
  set ladder_mmr = 1000
  where ladder_mmr is null;

-- 4) ladders 테이블 컬럼 이름 변경
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ladders'
      and column_name = 'Ladder_MMR'
  ) then
    alter table public.ladders rename column "Ladder_MMR" to ladder_mmr;
  end if;
end
$$;

-- 5) handle_new_user 트리거 함수 재정의 (snake_case 컬럼 사용)
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, by_id, role, clan_point, ladder_mmr, race, intro, is_in_queue, vote_to_start, wins, losses)
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

-- 6) 결과 확인
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'ladder_mmr';

commit;
