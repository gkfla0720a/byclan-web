-- ============================================================
-- LADDER-MMR-COLUMN-RENAME.sql
-- profiles 테이블: ladder_points → "Ladder_MMR" 컬럼 rename
-- Supabase SQL Editor에서 1회 실행 (순서대로 실행할 것)
-- ============================================================

-- 1) 컬럼 이름 변경
alter table public.profiles
  rename column ladder_points to "Ladder_MMR";

-- 2) 기본값 및 NOT NULL 확인 (이미 integer DEFAULT 1000이면 유지됨)
alter table public.profiles
  alter column "Ladder_MMR" set default 1000;

-- 3) 기존 NULL 값 보정
update public.profiles
  set "Ladder_MMR" = 1000
  where "Ladder_MMR" is null;

-- 4) handle_new_user 트리거 함수 재정의 (Ladder_MMR 컬럼 사용 + search_path 보안)
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, role, "Clan_Point", "Ladder_MMR", is_in_queue, vote_to_start)
  values (new.id, 'visitor', 0, 1000, false, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5) 결과 확인
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'Ladder_MMR';
