-- ============================================================
-- Supabase Performance Advisor 경고 해결 패치
-- 적용일: 2025-07
-- 대상: Auth RLS Init Plan, Multiple Permissive Policies,
--       Unindexed FK, Unused Index
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: Auth RLS Initialization Plan
-- auth.uid() 를 직접 호출하면 각 행마다 재평가됨
-- (SELECT auth.uid()) 로 감싸서 쿼리당 1회만 평가되도록 수정
-- ============================================================

-- ── notice_posts ──────────────────────────────────────────────
-- ALL 정책을 INSERT / UPDATE / DELETE 로 분리
-- → SELECT 정책과 겹치는 Multiple Permissive 경고도 함께 해소
DROP POLICY IF EXISTS notice_posts_admin_write ON public.notice_posts;

CREATE POLICY notice_posts_admin_insert ON public.notice_posts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = ANY(ARRAY['admin','master','developer'])
  ));

CREATE POLICY notice_posts_admin_update ON public.notice_posts
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = ANY(ARRAY['admin','master','developer'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = ANY(ARRAY['admin','master','developer'])
  ));

CREATE POLICY notice_posts_admin_delete ON public.notice_posts
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = ANY(ARRAY['admin','master','developer'])
  ));

-- ── admin_audit_logs ──────────────────────────────────────────
DROP POLICY IF EXISTS "Management can read admin audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Management can insert admin audit logs" ON public.admin_audit_logs;

CREATE POLICY "Management can read admin audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = ANY(ARRAY['admin','master','developer'])
  ));

CREATE POLICY "Management can insert admin audit logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = ANY(ARRAY['admin','master','developer'])
  ));

-- ── activity_logs ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Management can read activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Management can insert activity logs" ON public.activity_logs;

CREATE POLICY "Management can read activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = ANY(ARRAY['admin','master','developer'])
  ));

CREATE POLICY "Management can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = ANY(ARRAY['admin','master','developer'])
  ));

-- ============================================================
-- SECTION 2: Multiple Permissive Policies
-- 같은 테이블·CMD 에 PERMISSIVE 정책이 2개 이상이면
-- 모든 행에서 OR-chain 으로 평가되어 성능 저하
-- ============================================================

-- ── applications (SELECT) ─────────────────────────────────────
-- '신청서 메뉴 조회 가능' (qual=true) 이 이미 전 사용자 허용
-- '심사관 읽기 권한' (fn_is_reviewer()) 은 true 에 포함되어 중복
DROP POLICY IF EXISTS "심사관 읽기 권한" ON public.applications;

-- ── match_sets (SELECT) ───────────────────────────────────────
DROP POLICY IF EXISTS "Match participants can view match sets" ON public.match_sets;
DROP POLICY IF EXISTS "Management can view match sets in live mode" ON public.match_sets;

CREATE POLICY match_sets_select ON public.match_sets
  FOR SELECT TO authenticated
  USING (
    ((SELECT fn_is_management()) AND (SELECT fn_is_match_live_mode_enabled()))
    OR EXISTS (
      SELECT 1 FROM public.ladder_matches lm
      WHERE lm.id = match_sets.match_id
        AND (
          (SELECT auth.uid()) = ANY(COALESCE(lm.team_a_ids, ARRAY[]::uuid[]))
          OR (SELECT auth.uid()) = ANY(COALESCE(lm.team_b_ids, ARRAY[]::uuid[]))
        )
    )
  );

-- ── match_sets (UPDATE) ───────────────────────────────────────
DROP POLICY IF EXISTS "Match participants can update match sets" ON public.match_sets;
DROP POLICY IF EXISTS "Management can update match sets in live mode" ON public.match_sets;

CREATE POLICY match_sets_update ON public.match_sets
  FOR UPDATE TO authenticated
  USING (
    ((SELECT fn_is_management()) AND (SELECT fn_is_match_live_mode_enabled()))
    OR EXISTS (
      SELECT 1 FROM public.ladder_matches lm
      WHERE lm.id = match_sets.match_id
        AND (
          (SELECT auth.uid()) = ANY(COALESCE(lm.team_a_ids, ARRAY[]::uuid[]))
          OR (SELECT auth.uid()) = ANY(COALESCE(lm.team_b_ids, ARRAY[]::uuid[]))
        )
    )
  )
  WITH CHECK (
    ((SELECT fn_is_management()) AND (SELECT fn_is_match_live_mode_enabled()))
    OR EXISTS (
      SELECT 1 FROM public.ladder_matches lm
      WHERE lm.id = match_sets.match_id
        AND (
          (SELECT auth.uid()) = ANY(COALESCE(lm.team_a_ids, ARRAY[]::uuid[]))
          OR (SELECT auth.uid()) = ANY(COALESCE(lm.team_b_ids, ARRAY[]::uuid[]))
        )
    )
  );

-- ── profiles (UPDATE) ─────────────────────────────────────────
-- 3개 정책 (관리자 / 본인 / 심사관) → 1개로 병합
DROP POLICY IF EXISTS "관리자는 모든 프로필 수정 가능" ON public.profiles;
DROP POLICY IF EXISTS "본인 프로필 수정 허용" ON public.profiles;
DROP POLICY IF EXISTS "심사관이 신입으로 승급 허용" ON public.profiles;

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin())
    OR (SELECT auth.uid()) = id
    OR (SELECT fn_is_reviewer())
  )
  WITH CHECK (
    (SELECT is_admin())
    OR (SELECT auth.uid()) = id
    OR (SELECT fn_is_reviewer())
  );

-- ============================================================
-- SECTION 3: Unindexed Foreign Keys
-- FK 컬럼에 인덱스가 없으면 JOIN·참조 무결성 검사 시 Seq Scan
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id
  ON public.activity_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_id
  ON public.admin_audit_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_applications_reviewed_by
  ON public.applications(reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ladder_matches_created_by
  ON public.ladder_matches(created_by)
  WHERE created_by IS NOT NULL;

-- ============================================================
-- SECTION 4: Unused Indexes (중복 / 상위 복합 인덱스에 포함)
-- ============================================================

-- idx_notifications_user_id (user_id 단일)
--   → idx_notifications_user_read_created(user_id, is_read, created_at) 에 포함
DROP INDEX IF EXISTS public.idx_notifications_user_id;

-- idx_notifications_type_created (type, created_at)
--   → 앱 쿼리에서 type 필터링 없음; 불필요
DROP INDEX IF EXISTS public.idx_notifications_type_created;

-- idx_match_bets_match_id (match_id 단일)
--   → idx_match_bets_match_user(match_id, user_id) 에 포함
DROP INDEX IF EXISTS public.idx_match_bets_match_id;

COMMIT;
