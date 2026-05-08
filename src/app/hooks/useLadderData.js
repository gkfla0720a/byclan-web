// 파일명: src/hooks/useLadderData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { getPlayerMmr } from '@/utils/profiles';
import { buildTeams, MATCH_TYPES } from '@/utils/matchmaking';

const MAX_QUEUE_MINUTES = 20;
const COOLDOWN_STEPS = [0, 10, 30, 180];

export function useLadderData(user, authLoading) {
  // 1. 모든 상태(기억)는 이제 비서가 관리합니다.
  const [queuePlayers, setQueuePlayers] = useState([]);
  const [ongoingMatches, setOngoingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [activeProposal, setActiveProposal] = useState(null);
  const [proposalCooldown, setProposalCooldown] = useState(0);
  const [proposalAttempts, setProposalAttempts] = useState(0);
  const [matchProfiles, setMatchProfiles] = useState({});

  // 2. 티타늄 금고(Ref)들도 비서의 주머니로 들어갑니다.
  const cooldownTimerRef = useRef(null);
  const queueTimerRef = useRef(null);
  const currentUserRef = useRef(null);
  const lastQueueKeyRef = useRef('');

  // 유저 정보 최신화
  currentUserRef.current = user;

  // 3. 데이터 가져오기 로직 (fetchData)
  const fetchData = useCallback(async () => {
    if (authLoading || !user?.id) {
      if (!authLoading) setLoading(false);
      return;
    }

    try {
      // 내 대기열 상태
      const { data: myQueue } = await supabase.from('ladder_queue').select('is_in_queue').eq('user_id', user.id).maybeSingle();
      setInQueue(myQueue?.is_in_queue || false);

      // 대기열 전체 목록 (테스트 계정 필터링 포함)
      const isTestViewer = typeof window !== 'undefined' && window.localStorage.getItem('byclan_current_is_test_account') === 'true';
      const { data: queueRaw } = await supabase
        .from('ladder_queue')
        .select(`user_id, queue_joined_at, profiles!inner (id, by_id, race, role, profile_meta(is_test_account, is_test_account_active), ladder_rankings(total_mmr))`)
        .eq('is_in_queue', true)
        .order('queue_joined_at', { ascending: true });

      const qPlayers = (queueRaw || []).filter(r => {
        const meta = Array.isArray(r.profiles?.profile_meta) ? r.profiles.profile_meta[0] : r.profiles?.profile_meta;
        return isTestViewer ? (meta?.is_test_account && meta?.is_test_account_active) : !meta?.is_test_account;
      }).map(r => ({
        id: r.user_id,
        by_id: r.profiles?.by_id,
        race: r.profiles?.race,
        total_mmr: (Array.isArray(r.profiles?.ladder_rankings) ? r.profiles.ladder_rankings[0] : r.profiles?.ladder_rankings)?.total_mmr,
        queue_joined_at: r.queue_joined_at,
      }));
      setQueuePlayers(qPlayers);

      // 진행 중인 매치 조회 로직 (기존 복잡한 로직을 비서가 묵묵히 수행)
      const { data: ongoingRaw } = await supabase.from('ladder_match_sets').select('*, ladder_record!inner(*)').in('status', ['in_progress', 'proposed']).order('created_at', { ascending: false }).limit(10);
      setOngoingMatches(ongoingRaw || []);

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // 4. 실시간 구독 설정 (비서가 하루 종일 DB를 감시합니다)
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('ladder-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_queue' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  // 5. 액션 함수들 (참가, 취소, 제안 등)
  const joinQueue = async () => {
    await supabase.from('ladder_queue').upsert({ user_id: user.id, is_in_queue: true, queue_joined_at: new Date().toISOString() });
    setInQueue(true);
    fetchData();
  };

  const leaveQueue = async () => {
    await supabase.from('ladder_queue').update({ is_in_queue: false }).eq('user_id', user.id);
    setInQueue(false);
    fetchData();
  };

  // 6. 컴포넌트가 화면을 그리는 데 필요한 것들만 쏙 빼서 돌려줍니다.
  return {
    queuePlayers, ongoingMatches, loading, inQueue, joiningQueue,
    activeProposal, setActiveProposal, proposalCooldown, matchProfiles,
    joinQueue, leaveQueue, fetchData
  };
}