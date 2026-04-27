-- 0. 안 쓰는 레거시 및 외부 자료 테이블 삭제 (CASCADE 권고 반영)
DROP TABLE IF EXISTS public.ladder_matches CASCADE;
DROP TABLE IF EXISTS public.latest_rankings CASCADE;
DROP TABLE IF EXISTS public.legacy_matches CASCADE;
DROP TABLE IF EXISTS public.player_analytics CASCADE;
DROP TABLE IF EXISTS public.synergy_scores CASCADE;
-- 기존 ladders 테이블 삭제 (ladder_rankings로 교체)
DROP TABLE IF EXISTS public.ladders CASCADE;

-- 1. 기존 테이블 명칭 일괄 변경 (구조 유지)
ALTER TABLE IF EXISTS public.match_sets RENAME TO ladder_match_sets;
ALTER TABLE IF EXISTS public.point_logs RENAME TO clanpoint_logs;

-- 2. ladder_rankings 테이블 생성 (새로운 형식)
CREATE TABLE IF NOT EXISTS public.ladder_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) UNIQUE,
    by_id TEXT,
    ladder_mmr INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_rate DOUBLE PRECISION DEFAULT 0.0,
    favorite_race TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. mmr_logs 테이블 생성 및 트리거 부착
CREATE TABLE IF NOT EXISTS public.mmr_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    previous_mmr INTEGER,
    new_mmr INTEGER,
    change_amount INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.log_mmr_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.ladder_mmr IS DISTINCT FROM NEW.ladder_mmr THEN
        INSERT INTO public.mmr_logs (user_id, previous_mmr, new_mmr, change_amount, reason)
        VALUES (NEW.id, OLD.ladder_mmr, NEW.ladder_mmr, NEW.ladder_mmr - OLD.ladder_mmr, 'Profile MMR Update');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mmr_change ON public.profiles;
CREATE TRIGGER trigger_mmr_change
    AFTER UPDATE OF ladder_mmr ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_mmr_change();

-- 4. 신설되어야 할 부가 게시판 및 로깅 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notice_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL, 
    user_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. ladder_record 테이블 (개인 기준)
-- 기존 ladder_matches 구조를 쪼개 유저별로 기록하도록 설계
CREATE TABLE IF NOT EXISTS public.ladder_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL, -- 다수의 개인이 참여한 원래 경기(그룹)의 묶음 ID
    user_id UUID REFERENCES public.profiles(id),
    team TEXT CHECK (team IN ('A', 'B')),
    is_winner BOOLEAN,
    mmr_change INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- (참고) 기존 ladder_matches 데이터가 보존되어야 한다면, 이 단계 이후에 배열을 전개(Unnest)하여 ladder_record로 INSERT하는 추가 데이터 이관 작업이 필요합니다.