-- ============================================================
-- PROFILE-SCHEMA-UNIFIED-MIGRATION.sql
-- 목적: profiles 스키마를 UUID(id) 단일 기준 + snake_case 컬럼으로 통합
-- 적용 대상:
--   - legacy 컬럼명 정리: points/"Clan_Point" -> clan_point
--                         ladder_points/"Ladder_MMR" -> ladder_mmr
--                         "ByID" -> by_id
--   - 기본값/NULL 보정: clan_point, ladder_mmr, wins, losses, by_id
--   - 신규 유저 트리거(handle_new_user) 최신화
--
-- 실행 위치: Supabase SQL Editor
-- 실행 횟수: 재실행 가능(idempotent) 설계
-- ============================================================

begin;

-- 1) legacy 컬럼명을 snake_case 표준으로 정리
DO $$
BEGIN
  -- points -> clan_point
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'points'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN points TO clan_point;
  END IF;

  -- "Clan_Point" -> clan_point
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'Clan_Point'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN "Clan_Point" TO clan_point;
  END IF;

  -- ladder_points -> ladder_mmr
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'ladder_points'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN ladder_points TO ladder_mmr;
  END IF;

  -- "Ladder_MMR" -> ladder_mmr
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'Ladder_MMR'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN "Ladder_MMR" TO ladder_mmr;
  END IF;

  -- "ByID" -> by_id
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'ByID'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN "ByID" TO by_id;
  END IF;
END
$$;

-- 2) 필수 컬럼이 없으면 생성
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS by_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clan_point integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ladder_mmr integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS losses integer;

-- 3) 기본값 설정
ALTER TABLE public.profiles ALTER COLUMN clan_point SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN ladder_mmr SET DEFAULT 1000;
ALTER TABLE public.profiles ALTER COLUMN wins SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN losses SET DEFAULT 0;

-- 4) NULL 데이터 보정
UPDATE public.profiles SET clan_point = 0 WHERE clan_point IS NULL;
UPDATE public.profiles SET ladder_mmr = 1000 WHERE ladder_mmr IS NULL;
UPDATE public.profiles SET wins = 0 WHERE wins IS NULL;
UPDATE public.profiles SET losses = 0 WHERE losses IS NULL;

-- by_id 누락 보정 (UUID 기반 고정 생성)
UPDATE public.profiles
SET by_id = 'By_' || substring(replace(id::text, '-', '') from 1 for 10)
WHERE by_id IS NULL OR btrim(by_id) = '';

-- 선택 보정값
UPDATE public.profiles SET role = 'visitor' WHERE role IS NULL OR btrim(role) = '';
UPDATE public.profiles SET race = 'Terran' WHERE race IS NULL OR btrim(race) = '';
UPDATE public.profiles
SET intro = '클랜 방문자'
WHERE intro IS NULL OR btrim(intro) = '';

-- 5) 신규 유저 프로필 자동 생성 함수 최신화
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
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
  VALUES (
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
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- 6) auth.users -> profiles 트리거가 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

commit;

-- ============================================================
-- 실행 후 검증
-- ============================================================

-- 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'by_id', 'clan_point', 'ladder_mmr', 'wins', 'losses')
ORDER BY column_name;

-- 데이터 샘플 확인 (MMR 기준 상위)
SELECT
  id,
  by_id,
  role,
  ladder_mmr,
  clan_point,
  wins,
  losses,
  CASE
    WHEN coalesce(ladder_mmr, 1000) >= 2400 THEN 'Challenger'
    WHEN coalesce(ladder_mmr, 1000) >= 2200 THEN 'Master'
    WHEN coalesce(ladder_mmr, 1000) >= 1900 THEN 'Diamond'
    WHEN coalesce(ladder_mmr, 1000) >= 1600 THEN 'Platinum'
    WHEN coalesce(ladder_mmr, 1000) >= 1350 THEN 'Gold'
    WHEN coalesce(ladder_mmr, 1000) >= 1100 THEN 'Silver'
    ELSE 'Bronze'
  END AS tier
FROM public.profiles
ORDER BY coalesce(ladder_mmr, 1000) DESC, by_id ASC
LIMIT 30;
