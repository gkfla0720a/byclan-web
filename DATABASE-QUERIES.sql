-- ByClan 웹 프로젝트 SQL 수정 쿼리 모음
-- 필요한 경우 Supabase SQL Editor에서 직접 실행하세요.

-- ===================================================================
-- 1. 프로필 테이블 스키마 확인 및 수정
-- ===================================================================

-- 현재 profiles 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 필요한 컬럼이 없을 경우 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promoted_by UUID REFERENCES profiles(id);

-- ===================================================================
-- 2. 승격 로그 테이블 생성 (없을 경우)
-- ===================================================================

CREATE TABLE IF NOT EXISTS promotion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    old_role TEXT NOT NULL,
    new_role TEXT NOT NULL,
    promoted_by UUID REFERENCES profiles(id),
    promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. ladder_matches 테이블 구조 확인
-- ===================================================================

-- ladder_matches 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ladder_matches' 
ORDER BY ordinal_position;

-- ===================================================================
-- 4. 역할 기본값 설정 (기존 사용자들)
-- ===================================================================

-- visitor 역할을 가진 사용자 확인
SELECT id, discord_name, role FROM profiles WHERE role = 'visitor';

-- applicant 역할을 가진 사용자 확인  
SELECT id, discord_name, role FROM profiles WHERE role = 'applicant';

-- rookie 역할을 가진 사용자 확인
SELECT id, discord_name, role FROM profiles WHERE role = 'rookie';

-- ===================================================================
-- 5. applications 테이블 스키마 확인
-- ===================================================================

-- applications 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

-- 필요한 컬럼이 없을 경우 추가
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS test_result JSONB,
ADD COLUMN IF NOT EXISTS tester_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- ===================================================================
-- 6. 가입 신청 상태 정리
-- ===================================================================

-- 현재 신청 현황 확인
SELECT 
    a.id,
    a.discord_name,
    a.status,
    a.created_at,
    p.role as profile_role
FROM applications a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- ===================================================================
-- 7. 권한 관련 데이터 정리
-- ===================================================================

-- 모든 역할별 사용자 수 확인
SELECT 
    role,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM profiles 
GROUP BY role 
ORDER BY COUNT(*) DESC;

-- ===================================================================
-- 8. Discord 연동 상태 확인
-- ===================================================================

-- Discord 연동된 사용자 확인
SELECT 
    role,
    COUNT(*) as total,
    COUNT(discord_id) FILTER (WHERE discord_id IS NOT NULL) as discord_linked,
    ROUND(
        COUNT(discord_id) FILTER (WHERE discord_id IS NOT NULL) * 100.0 / COUNT(*), 
        2
    ) as link_percentage
FROM profiles 
GROUP BY role 
ORDER BY role;

-- ===================================================================
-- 9. 래더 관련 데이터 확인
-- ===================================================================

-- ladder_matches 테이블 샘플 데이터 확인
SELECT * FROM ladder_matches LIMIT 5;

-- ladders 테이블 샘플 데이터 확인  
SELECT * FROM ladders LIMIT 5;

-- ===================================================================
-- 10. 인덱스 생성 (성능 향상)
-- ===================================================================

-- profiles 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON profiles(discord_id) WHERE discord_id IS NOT NULL;

-- applications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- ladder_matches 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ladder_matches_status ON ladder_matches(status);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_created_at ON ladder_matches(created_at);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_team_a ON ladder_matches USING GIN(team_a_ids);
CREATE INDEX IF NOT EXISTS idx_ladder_matches_team_b ON ladder_matches USING GIN(team_b_ids);

-- ===================================================================
-- 11. 데이터 정리 쿼리 (필요시 사용)
-- ===================================================================

-- 중복된 프로필 정리 (있을 경우)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM profiles
)
DELETE FROM profiles 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 오래된 신청서 정리 (30일 이상 된 대기 신청)
DELETE FROM applications 
WHERE status = '대기' 
AND created_at < NOW() - INTERVAL '30 days';

-- ===================================================================
-- 12. 테스트 데이터 생성 (개발 환경에서만)
-- ===================================================================

-- 테스트용 ladder_matches 데이터 (없을 경우)
INSERT INTO ladder_matches (id, host_id, status, match_type, team_a_ids, team_b_ids, team_a_races, team_b_races, map_name, created_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    '모집중',
    '1v1',
    ARRAY[]::uuid[],
    ARRAY[]::uuid[],
    ARRAY[]::text[],
    ARRAY[]::text[],
    '테스트 맵',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM ladder_matches LIMIT 1);

-- ===================================================================
-- 13. RLS (Row Level Security) 정책 확인
-- ===================================================================

-- 현재 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'applications', 'ladder_matches', 'ladders')
ORDER BY tablename, policyname;

-- ===================================================================
-- 14. 트리거 함수 (자동 승격용 - 추후 구현)
-- ===================================================================

-- 자동 승격 트리거 (향후 구현 예정)
-- 이 부분은 추후 자동 승격 시스템 구현 시 추가 예정

-- ===================================================================
-- 15. 백업 전용 쿼리
-- ===================================================================

-- 중요 데이터 백업 (실행 전 데이터 저장용)
CREATE TABLE profiles_backup AS SELECT * FROM profiles;
CREATE TABLE applications_backup AS SELECT * FROM applications;
CREATE TABLE ladder_matches_backup AS SELECT * FROM ladder_matches;

-- ===================================================================
-- 실행 순서 안내
-- ===================================================================

/*
실행 순서:
1. 먼저 구조 확인 쿼리 실행 (섹션 1, 3, 5)
2. 필요한 경우 테이블/컬럼 추가 (섹션 2, 5)
3. 인덱스 생성 (섹션 10)
4. 데이터 확인 및 정리 (섹션 6, 7, 8, 9)
5. 필요한 경우 테스트 데이터 생성 (섹션 12)
6. 백업 쿼리는 필요시 실행 (섹션 15)

주의사항:
- 모든 쿼리 실행 전에 반드시 데이터 백업하세요
- 프로덕션 환경에서는 신중하게 실행하세요
- RLS 정책이 있는 경우 권한 확인이 필요합니다
*/
