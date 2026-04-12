-- ============================================================
--  match_sets 엔트리 철회 요청 컬럼 추가 마이그레이션
--  실행 위치: Supabase SQL Editor
--  실행 순서: sql/policies/MATCH-SETS-RLS.sql 이후 실행 권장
-- ============================================================

-- 1. 철회 요청 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE public.match_sets
  ADD COLUMN IF NOT EXISTS team_a_withdraw_req boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_b_withdraw_req boolean DEFAULT false;

-- 2. 기존 행 기본값 보정 (NULL → false)
UPDATE public.match_sets
SET
  team_a_withdraw_req = COALESCE(team_a_withdraw_req, false),
  team_b_withdraw_req = COALESCE(team_b_withdraw_req, false)
WHERE team_a_withdraw_req IS NULL
   OR team_b_withdraw_req IS NULL;

-- 3. NOT NULL 제약 설정 (선택 사항 — 운영 중 적용 시 주의)
-- ALTER TABLE public.match_sets
--   ALTER COLUMN team_a_withdraw_req SET NOT NULL,
--   ALTER COLUMN team_b_withdraw_req SET NOT NULL;

-- ============================================================
--  RLS 정책 업데이트: withdraw_req 컬럼을 UPDATE 범위에 포함
-- ============================================================
--  기존 MATCH-SETS-RLS.sql의 UPDATE 정책이 WITH CHECK 없이
--  USING만 사용하면 withdraw_req 업데이트가 차단될 수 있습니다.
--  아래는 기존 정책을 철회 요청 컬럼도 허용하도록 재확인용 쿼리입니다.

-- 점검 쿼리 (Supabase 대시보드 Authentication > Policies 에서 확인 가능)
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'match_sets';

-- ============================================================
--  적용 확인
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'match_sets'
--   AND column_name IN ('team_a_withdraw_req', 'team_b_withdraw_req');
