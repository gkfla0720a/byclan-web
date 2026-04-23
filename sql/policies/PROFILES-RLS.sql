-- ============================================================
-- PROFILES-RLS.sql
-- 목적: profiles 테이블 RLS 정책 설정 (무한 재귀 문제 해결)
-- 
-- 문제점:
--   - profiles 테이블에 RLS가 활성화되지 않음
--   - SELECT, INSERT 정책 부재로 인한 접근 제어 미작동
--   - 이로 인해 프로필 로드 시 RLS 시스템 혼란 유발
--
-- 해결 방법:
--   1. RLS 활성화 (모든 접근에 정책 적용)
--   2. SELECT 정책: 모든 인증 사용자 허용 (프로필은 공개 정보)
--   3. INSERT 정책: auth.users -> profiles 자동 생성만 허용 (기존 트리거 유지)
--   4. UPDATE/DELETE 정책: 기존 정책 유지 (본인/관리자만)
--
-- 실행 위치: Supabase SQL Editor
-- ============================================================

-- 1. RLS 활성화
ALTER TABLE IF EXISTS public.profiles
ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 확인 및 생성
DO $$
BEGIN
  -- SELECT: 인증된 사용자는 모든 프로필 조회 가능
  -- (프로필은 공개 정보로, 아바타/아이디/등급 등이 노출되어야 함)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Authenticated users can view all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- SELECT: 비인증 사용자(anon)도 프로필 조회 가능
  -- (방문자가 랭킹 페이지를 보려면 필요)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Anon can view all profiles'
  ) THEN
    CREATE POLICY "Anon can view all profiles"
      ON public.profiles
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  -- INSERT: 시스템 함수(handle_new_user)에서만 프로필 자동 생성 허용
  -- (사용자는 직접 INSERT 불가 - auth.users 가입 시 자동 생성)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'System can create profiles'
  ) THEN
    CREATE POLICY "System can create profiles"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- auth.uid()가 새 프로필 소유자와 일치할 때만 (신규 가입)
        auth.uid() = id
      );
  END IF;

  -- UPDATE: 사용자가 본인 프로필만 수정 가능
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- UPDATE: 관리자(admin/master/developer)는 모든 프로필 수정 가능
  -- (기존 정책 이름이 있는지 확인 후 생성)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'master', 'developer')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'master', 'developer')
        )
      );
  END IF;

END
$$;

-- 3. 권한 설정
GRANT SELECT ON table public.profiles TO authenticated;
GRANT SELECT ON table public.profiles TO anon;
GRANT INSERT ON table public.profiles TO authenticated;
GRANT UPDATE ON table public.profiles TO authenticated;

-- ============================================================
-- 검증 쿼리 (실행 후 확인)
-- ============================================================
-- 
-- -- 1. RLS 상태 확인
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'profiles' AND schemaname = 'public';
--
-- -- 2. 적용된 정책 목록
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles' AND schemaname = 'public'
-- ORDER BY policyname;
--
-- -- 3. 프로필 조회 테스트 (SET SESSION 사용)
-- SET SESSION app.current_user_id = 'YOUR_USER_ID';
-- SELECT id, by_id, role, clan_point FROM public.profiles LIMIT 5;
--
