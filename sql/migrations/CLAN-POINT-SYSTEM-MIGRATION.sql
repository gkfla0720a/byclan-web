-- ============================================================
-- CLAN-POINT-SYSTEM-MIGRATION.sql
-- 클랜 포인트 시스템 전체 구축 마이그레이션
-- 포함: 배팅 정산, 출석보상, 매치참여 보상, 직급 승급 보상, 관리자 포인트 관리
-- ============================================================

-- 1. match_bets 테이블 컬럼 추가
ALTER TABLE public.match_bets ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.match_bets ADD COLUMN IF NOT EXISTS payout integer DEFAULT 0;
ALTER TABLE public.match_bets ADD COLUMN IF NOT EXISTS settled_at timestamptz;

-- 2. point_logs 테이블 확장 (유형, 잔액, 연관 ID)
ALTER TABLE public.point_logs ADD COLUMN IF NOT EXISTS type text DEFAULT 'manual';
ALTER TABLE public.point_logs ADD COLUMN IF NOT EXISTS balance_after integer;
ALTER TABLE public.point_logs ADD COLUMN IF NOT EXISTS related_id text;
ALTER TABLE public.point_logs ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;

-- 3. profiles 출석 보상 날짜 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_daily_bonus_at date;

-- 3-1. 관리자 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  actor_by_id text,
  actor_role text,
  action_type text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_test_data boolean DEFAULT false,
  CONSTRAINT admin_audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_table, target_id);

-- 4. 테스트 계정에 50,000 CP 지급
UPDATE public.profiles
SET clan_point = 50000
WHERE is_test_account = true;

-- 기존 포인트 지급 로그 기록
INSERT INTO public.point_logs (user_id, amount, reason, type, balance_after, is_test_data)
SELECT
  id,
  50000,
  '테스트 계정 초기 포인트 지급',
  'admin_grant',
  50000,
  true
FROM public.profiles
WHERE is_test_account = true;

-- ============================================================
-- 5. 배팅 정산 DB 함수 및 트리거
-- ladder_matches.status 가 '완료'로 바뀔 때 자동 실행
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_settle_match_bets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winning_team text;
  v_total_winner_bets bigint;
  v_total_all_bets bigint;
  v_bet RECORD;
  v_player_id uuid;
  v_payout integer;
  v_new_balance integer;
BEGIN
  -- 완료 상태로 변경될 때만 실행 (중복 실행 방지)
  IF NEW.status != '완료' OR OLD.status = '완료' THEN
    RETURN NEW;
  END IF;

  -- 매치 종료 참여 보상 (500 CP): 팀 A/B 모든 참가자에게 1회 지급
  FOREACH v_player_id IN ARRAY COALESCE(NEW.team_a_ids, '{}'::uuid[])
  LOOP
    SELECT COALESCE(clan_point, 0) INTO v_new_balance
    FROM public.profiles WHERE id = v_player_id;

    v_new_balance := v_new_balance + 500;

    UPDATE public.profiles
    SET clan_point = v_new_balance
    WHERE id = v_player_id;

    INSERT INTO public.point_logs (user_id, amount, reason, type, balance_after, related_id)
    VALUES (
      v_player_id,
      500,
      '매치 참여 보상 (종료 정산): ' || NEW.id::text,
      'match_reward',
      v_new_balance,
      NEW.id::text
    );

    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      v_player_id,
      '🎮 매치 참여 보상 지급',
      '매치 종료 정산으로 500CP가 지급되었습니다. 현재 잔액: ' || v_new_balance || 'CP'
    );
  END LOOP;

  FOREACH v_player_id IN ARRAY COALESCE(NEW.team_b_ids, '{}'::uuid[])
  LOOP
    SELECT COALESCE(clan_point, 0) INTO v_new_balance
    FROM public.profiles WHERE id = v_player_id;

    v_new_balance := v_new_balance + 500;

    UPDATE public.profiles
    SET clan_point = v_new_balance
    WHERE id = v_player_id;

    INSERT INTO public.point_logs (user_id, amount, reason, type, balance_after, related_id)
    VALUES (
      v_player_id,
      500,
      '매치 참여 보상 (종료 정산): ' || NEW.id::text,
      'match_reward',
      v_new_balance,
      NEW.id::text
    );

    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      v_player_id,
      '🎮 매치 참여 보상 지급',
      '매치 종료 정산으로 500CP가 지급되었습니다. 현재 잔액: ' || v_new_balance || 'CP'
    );
  END LOOP;

  v_winning_team := NEW.winning_team;

  -- winning_team 이 없으면 베팅 정산은 생략 (참여보상은 이미 지급됨)
  IF v_winning_team IS NULL OR v_winning_team = '' THEN
    RETURN NEW;
  END IF;

  -- 승리팀 베팅 합계
  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_winner_bets
  FROM public.match_bets
  WHERE match_id = NEW.id
    AND team_choice = v_winning_team
    AND status = 'pending';

  -- 전체 베팅 합계
  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_all_bets
  FROM public.match_bets
  WHERE match_id = NEW.id
    AND status = 'pending';

  -- 베팅 없으면 종료
  IF v_total_all_bets = 0 THEN
    RETURN NEW;
  END IF;

  -- 각 베팅 건별 정산
  FOR v_bet IN
    SELECT * FROM public.match_bets
    WHERE match_id = NEW.id AND status = 'pending'
  LOOP
    IF v_bet.team_choice = v_winning_team THEN
      -- 승리팀 베팅: 전체 베팅 풀을 투자 비율대로 분배
      IF v_total_winner_bets > 0 THEN
        v_payout := FLOOR((v_bet.bet_amount::float8 / v_total_winner_bets) * v_total_all_bets);
      ELSE
        v_payout := v_bet.bet_amount;
      END IF;

      -- 포인트 지급
      SELECT COALESCE(clan_point, 0) INTO v_new_balance
      FROM public.profiles WHERE id = v_bet.user_id;

      v_new_balance := v_new_balance + v_payout;

      UPDATE public.profiles
      SET clan_point = v_new_balance
      WHERE id = v_bet.user_id;

      -- 포인트 로그
      INSERT INTO public.point_logs (user_id, amount, reason, type, balance_after, related_id)
      VALUES (
        v_bet.user_id,
        v_payout,
        '베팅 정산 (승리) 매치: ' || NEW.id::text,
        'bet_settle_win',
        v_new_balance,
        NEW.id::text
      );

      -- 알림 (승리)
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        v_bet.user_id,
        '🎉 베팅 정산 완료 — 승리!',
        '배팅하신 팀이 이겼습니다! ' || v_bet.bet_amount || 'CP → ' || v_payout || 'CP 수령. 현재 잔액: ' || v_new_balance || 'CP'
      );

      -- 베팅 상태 업데이트
      UPDATE public.match_bets
      SET status = 'won', payout = v_payout, settled_at = NOW()
      WHERE id = v_bet.id;

    ELSE
      -- 패배팀 베팅: 포인트는 이미 배팅 시 차감됨, 알림만 발송

      SELECT COALESCE(clan_point, 0) INTO v_new_balance
      FROM public.profiles WHERE id = v_bet.user_id;

      -- 포인트 로그 (패배 기록)
      INSERT INTO public.point_logs (user_id, amount, reason, type, balance_after, related_id)
      VALUES (
        v_bet.user_id,
        -v_bet.bet_amount,
        '베팅 정산 (패배) 매치: ' || NEW.id::text,
        'bet_settle_loss',
        v_new_balance,
        NEW.id::text
      );

      -- 알림 (패배)
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        v_bet.user_id,
        '❌ 베팅 정산 완료 — 패배',
        '아쉽게도 배팅하신 팀이 졌습니다. ' || v_bet.bet_amount || 'CP를 잃었습니다. 현재 잔액: ' || v_new_balance || 'CP'
      );

      -- 베팅 상태 업데이트
      UPDATE public.match_bets
      SET status = 'lost', payout = 0, settled_at = NOW()
      WHERE id = v_bet.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_ladder_matches_settle_bets ON public.ladder_matches;
CREATE TRIGGER trg_ladder_matches_settle_bets
  AFTER UPDATE OF status ON public.ladder_matches
  FOR EACH ROW EXECUTE FUNCTION public.fn_settle_match_bets();

-- ============================================================
-- 6. 실시간 배당 계산 함수 (MatchCenter에서 RPC 호출)
-- ============================================================

DROP VIEW IF EXISTS public.v_match_bet_odds;

CREATE OR REPLACE FUNCTION public.fn_get_match_bet_odds(p_match_id uuid)
RETURNS TABLE (
  match_id uuid,
  total_a bigint,
  total_b bigint,
  count_a bigint,
  count_b bigint,
  total_pool bigint,
  odds_a numeric,
  odds_b numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_match_id AS match_id,
    COALESCE(SUM(bet_amount) FILTER (WHERE team_choice = 'A'), 0) AS total_a,
    COALESCE(SUM(bet_amount) FILTER (WHERE team_choice = 'B'), 0) AS total_b,
    COUNT(*) FILTER (WHERE team_choice = 'A') AS count_a,
    COUNT(*) FILTER (WHERE team_choice = 'B') AS count_b,
    COALESCE(SUM(bet_amount), 0) AS total_pool,
    ROUND(
      CASE WHEN COALESCE(SUM(bet_amount) FILTER (WHERE team_choice = 'A'), 0) > 0
      THEN (COALESCE(SUM(bet_amount), 0)::numeric / (SUM(bet_amount) FILTER (WHERE team_choice = 'A'))::numeric)
      ELSE 0 END,
      2
    ) AS odds_a,
    ROUND(
      CASE WHEN COALESCE(SUM(bet_amount) FILTER (WHERE team_choice = 'B'), 0) > 0
      THEN (COALESCE(SUM(bet_amount), 0)::numeric / (SUM(bet_amount) FILTER (WHERE team_choice = 'B'))::numeric)
      ELSE 0 END,
      2
    ) AS odds_b
  FROM public.match_bets
  WHERE status = 'pending'
    AND match_id = p_match_id
$$;

REVOKE ALL ON FUNCTION public.fn_get_match_bet_odds(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_match_bet_odds(uuid) TO authenticated;

-- ============================================================
-- 완료 확인
-- ============================================================
-- 트리거 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trg_ladder_matches_settle_bets';

-- 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('match_bets', 'point_logs', 'profiles')
  AND column_name IN ('status', 'payout', 'settled_at', 'type', 'balance_after', 'related_id', 'last_daily_bonus_at')
ORDER BY table_name, column_name;
