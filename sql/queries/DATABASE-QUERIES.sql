-- ByClan 웹 프로젝트 관리 SQL (2026 현재 스키마 기준)
-- 실행 위치: Supabase SQL Editor
-- 기준 스키마: profiles(id, by_id, clan_point, ladder_mmr, wins, losses)

-- ===================================================================
-- 0. 핵심 테이블/컬럼 점검
-- ===================================================================

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'applications', 'ladder_matches', 'notifications', 'developer_settings')
ORDER BY table_name, ordinal_position;

-- profiles 레거시 컬럼 확인(있으면 PROFILE-SCHEMA-UNIFIED-MIGRATION.sql 선실행 권장)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN ('ByID', 'Clan_Point', 'Ladder_MMR', 'points', 'ladder_points');

-- ===================================================================
-- 1. profiles 보강(누락 컬럼/기본값/NULL 데이터)
-- ===================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS by_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clan_point integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ladder_mmr integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS losses integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promoted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promoted_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.profiles ALTER COLUMN clan_point SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN ladder_mmr SET DEFAULT 1000;
ALTER TABLE public.profiles ALTER COLUMN wins SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN losses SET DEFAULT 0;

UPDATE public.profiles SET clan_point = 0 WHERE clan_point IS NULL;
UPDATE public.profiles SET ladder_mmr = 1000 WHERE ladder_mmr IS NULL;
UPDATE public.profiles SET wins = 0 WHERE wins IS NULL;
UPDATE public.profiles SET losses = 0 WHERE losses IS NULL;
UPDATE public.profiles
SET by_id = 'By_' || substring(replace(id::text, '-', '') from 1 for 10)
WHERE by_id IS NULL OR btrim(by_id) = '';

-- ===================================================================
-- 2. 승격 로그 테이블
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.promotion_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_role text NOT NULL,
    new_role text NOT NULL,
    promoted_by uuid REFERENCES public.profiles(id),
    promoted_at timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- ===================================================================
-- 3. applications 보강(현재 타입: test_result text)
-- ===================================================================

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS tester_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_result text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- ===================================================================
-- 4. 운영 통계/상태 조회
-- ===================================================================

-- 역할 분포
SELECT
    role,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS percentage
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- Discord 연동 상태
SELECT
    role,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE discord_id IS NOT NULL AND btrim(discord_id) <> '') AS discord_linked,
    ROUND(
        COUNT(*) FILTER (WHERE discord_id IS NOT NULL AND btrim(discord_id) <> '') * 100.0 / NULLIF(COUNT(*), 0),
        2
    ) AS link_percentage
FROM public.profiles
GROUP BY role
ORDER BY role;

-- 신청서 현황
SELECT
    a.id,
    a.user_id,
    a.discord_name,
    a.status,
    a.created_at,
    p.role AS profile_role,
    p.by_id
FROM public.applications a
LEFT JOIN public.profiles p ON p.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 100;

-- 래더 매치 최근 20건
SELECT id, host_id, status, match_type, created_at
FROM public.ladder_matches
ORDER BY created_at DESC
LIMIT 20;

-- legacy ladders 테이블은 존재 시에만 확인
DO $$
DECLARE
    ladders_preview jsonb;
BEGIN
    IF to_regclass('public.ladders') IS NOT NULL THEN
        EXECUTE $sql$
            SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
            FROM (
                SELECT *
                FROM public.ladders
                LIMIT 20
            ) AS t
        $sql$
        INTO ladders_preview;

        RAISE NOTICE 'public.ladders preview: %', ladders_preview;
    ELSE
        RAISE NOTICE 'public.ladders does not exist.';
    END IF;
END
$$;

-- ===================================================================
-- 5. 인덱스 최적화
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles(discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_by_id ON public.profiles(by_id);

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

CREATE INDEX IF NOT EXISTS idx_ladder_matches_status ON public.ladder_matches(status);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_created_at ON public.ladder_matches(created_at);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_team_a ON public.ladder_matches USING gin(team_a_ids);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_team_b ON public.ladder_matches USING gin(team_b_ids);

-- ===================================================================
-- 6. 안전 정리 쿼리
-- ===================================================================

-- 30일 이상 지난 신청서 정리
-- 참고: status 값은 현재 '대기'로 표준화하는 것이 바람직하나,
-- 레거시 데이터에 '대기중'이 남아 있을 수 있어 동일한 pending 상태로 함께 정리한다.
DELETE FROM public.applications
WHERE status IN ('대기', '대기중') -- legacy 동의어 상태를 함께 정리
    AND created_at < now() - INTERVAL '30 days';

-- ===================================================================
-- 7. RLS 정책 점검
-- ===================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'applications', 'ladder_matches', 'match_bets', 'match_sets', 'developer_settings')
ORDER BY tablename, policyname;

-- ===================================================================
-- 8. 백업 쿼리
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.profiles_backup (LIKE public.profiles INCLUDING ALL);
INSERT INTO public.profiles_backup
SELECT *
FROM public.profiles
WHERE NOT EXISTS (SELECT 1 FROM public.profiles_backup);

CREATE TABLE IF NOT EXISTS public.applications_backup (LIKE public.applications INCLUDING ALL);
INSERT INTO public.applications_backup
SELECT *
FROM public.applications
WHERE NOT EXISTS (SELECT 1 FROM public.applications_backup);

CREATE TABLE IF NOT EXISTS public.ladder_matches_backup (LIKE public.ladder_matches INCLUDING ALL);
INSERT INTO public.ladder_matches_backup
SELECT *
FROM public.ladder_matches
WHERE NOT EXISTS (SELECT 1 FROM public.ladder_matches_backup);

-- ===================================================================
-- 권장 실행 순서
-- ===================================================================
/*
1) 섹션 0으로 구조 점검
2) profiles에 레거시 컬럼이 있으면 PROFILE-SCHEMA-UNIFIED-MIGRATION.sql 먼저 실행
3) 섹션 1, 2, 3으로 스키마 보강
4) 섹션 5 인덱스 적용
5) 섹션 4/7 운영 점검
6) 섹션 6/8은 필요할 때만 실행
*/
