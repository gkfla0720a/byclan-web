-- ============================================================
-- GLOBAL-ACTIVITY-LOG-MIGRATION.sql
-- 전역 활동/변경 이력 로깅 시스템
-- 대상: 경기기록, CP, MMR, 접속일자, 게시글 작성, 닉네임/등급 변경, 수동 관리자 변경
-- ============================================================

-- 1) profiles 접속일시 컬럼
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 2) 전역 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,                    -- cp | mmr | match | auth | post | profile | role | admin
  action_type text NOT NULL,                 -- 세부 이벤트 타입
  source_type text NOT NULL DEFAULT 'system',-- trigger | auth | app | admin_manual | system
  is_manual boolean NOT NULL DEFAULT false,  -- 수동 변경 특수표시

  actor_id uuid,
  actor_by_id text,
  actor_role text,

  target_user_id uuid,
  target_table text,
  target_id text,

  summary text,
  before_data jsonb,
  after_data jsonb,
  meta jsonb,

  CONSTRAINT activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(category, action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_user ON public.activity_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_manual ON public.activity_logs(is_manual, created_at DESC);

-- 수동 변경 재검토용 뷰
CREATE OR REPLACE VIEW public.v_manual_activity_review AS
SELECT
  id,
  created_at,
  category,
  action_type,
  actor_id,
  actor_by_id,
  actor_role,
  target_user_id,
  target_table,
  target_id,
  summary,
  before_data,
  after_data,
  meta
FROM public.activity_logs
WHERE is_manual = true
ORDER BY created_at DESC;

-- 3) profiles 변경 트리거 함수 (CP/MMR/닉네임/등급/접속)
CREATE OR REPLACE FUNCTION public.fn_log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.clan_point IS DISTINCT FROM NEW.clan_point THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_user_id, target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'cp', 'cp_change', 'trigger',
      NEW.id, 'profiles', NEW.id::text,
      '클랜 포인트 변경',
      jsonb_build_object('clan_point', OLD.clan_point),
      jsonb_build_object('clan_point', NEW.clan_point)
    );
  END IF;

  IF OLD.ladder_mmr IS DISTINCT FROM NEW.ladder_mmr
    OR OLD.team_mmr IS DISTINCT FROM NEW.team_mmr
    OR OLD.total_mmr IS DISTINCT FROM NEW.total_mmr THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_user_id, target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'mmr', 'mmr_change', 'trigger',
      NEW.id, 'profiles', NEW.id::text,
      'MMR 변경',
      jsonb_build_object('ladder_mmr', OLD.ladder_mmr, 'team_mmr', OLD.team_mmr, 'total_mmr', OLD.total_mmr),
      jsonb_build_object('ladder_mmr', NEW.ladder_mmr, 'team_mmr', NEW.team_mmr, 'total_mmr', NEW.total_mmr)
    );
  END IF;

  IF OLD.by_id IS DISTINCT FROM NEW.by_id THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_user_id, target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'profile', 'nickname_change', 'trigger',
      NEW.id, 'profiles', NEW.id::text,
      '닉네임 변경',
      jsonb_build_object('by_id', OLD.by_id),
      jsonb_build_object('by_id', NEW.by_id)
    );
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_user_id, target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'role', 'role_change', 'trigger',
      NEW.id, 'profiles', NEW.id::text,
      '등급 변경',
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;

  IF OLD.last_login_at IS DISTINCT FROM NEW.last_login_at THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_user_id, target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'auth', 'login', 'auth',
      NEW.id, 'profiles', NEW.id::text,
      '접속 기록',
      jsonb_build_object('last_login_at', OLD.last_login_at),
      jsonb_build_object('last_login_at', NEW.last_login_at)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profiles_activity_log ON public.profiles;
CREATE TRIGGER trg_profiles_activity_log
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_log_profile_changes();

-- 4) 경기기록 트리거 함수 (생성/수정/삭제)
CREATE OR REPLACE FUNCTION public.fn_log_ladder_match_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_table, target_id,
      summary, after_data
    ) VALUES (
      'match', 'match_create', 'trigger',
      'ladder_matches', NEW.id::text,
      '경기 기록 생성',
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_table, target_id,
      summary, before_data, after_data
    ) VALUES (
      'match', 'match_update', 'trigger',
      'ladder_matches', NEW.id::text,
      '경기 기록 변경',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (
      category, action_type, source_type,
      target_table, target_id,
      summary, before_data
    ) VALUES (
      'match', 'match_delete', 'trigger',
      'ladder_matches', OLD.id::text,
      '경기 기록 삭제',
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ladder_matches_activity_log ON public.ladder_matches;
CREATE TRIGGER trg_ladder_matches_activity_log
AFTER INSERT OR UPDATE OR DELETE ON public.ladder_matches
FOR EACH ROW EXECUTE FUNCTION public.fn_log_ladder_match_changes();

-- 5) 게시판 작성 트리거 함수 (posts/admin_posts)
CREATE OR REPLACE FUNCTION public.fn_log_post_create()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- posts.user_id / admin_posts.author_id 공통 처리
  v_user_id := COALESCE(NEW.user_id, NEW.author_id);

  INSERT INTO public.activity_logs (
    category, action_type, source_type,
    target_user_id, target_table, target_id,
    summary, after_data
  ) VALUES (
    'post', 'post_create', 'trigger',
    v_user_id, TG_TABLE_NAME, NEW.id::text,
    '게시글 작성',
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_posts_activity_log ON public.posts;
CREATE TRIGGER trg_posts_activity_log
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.fn_log_post_create();

DROP TRIGGER IF EXISTS trg_admin_posts_activity_log ON public.admin_posts;
CREATE TRIGGER trg_admin_posts_activity_log
AFTER INSERT ON public.admin_posts
FOR EACH ROW EXECUTE FUNCTION public.fn_log_post_create();

-- 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('activity_logs', 'admin_audit_logs');
