// 파일명: @/hooks/useLadderData.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { getPlayerMmr } from '@/utils/profiles';
import { buildTeams, MATCH_TYPES } from '@/utils/matchMaking';

const MAX_QUEUE_MINUTES = 20;
const COOLDOWN_STEPS = [0, 10, 30, 180];
const BALANCE_THRESHOLD = 200;

export function useLadderData(user, authLoading) {
  const [queueMatchType, setQueueMatchType] = useState('4v4'); 
  const [sortOption, setSortOption] = useState('balance');

  const [queuePlayers, setQueuePlayers] = useState([]);
  const [ongoingMatches, setOngoingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [activeProposal, setActiveProposal] = useState(null);
  const [proposalCooldown, setProposalCooldown] = useState(0);
  const [proposalAttempts, setProposalAttempts] = useState(0);
  const [matchProfiles, setMatchProfiles] = useState({});

  const cooldownTimerRef = useRef(null);
  const queueTimerRef = useRef(null);
  const currentUserRef = useRef(null);
  const lastQueueKeyRef = useRef('');

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user?.id) {
      if (!authLoading) setLoading(false);
      return;
    }

    try {
      const { data: myQueue } = await supabase.from('ladder_queue').select('is_in_queue').eq('user_id', user.id).maybeSingle();
      setInQueue(myQueue?.is_in_queue || false);

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

      const newKey = qPlayers.map(p => p.id).sort().join(',');
      if (lastQueueKeyRef.current && lastQueueKeyRef.current !== newKey) {
        setProposalAttempts(0);
        setProposalCooldown(0);
        clearTimeout(cooldownTimerRef.current);
      }
      lastQueueKeyRef.current = newKey;

      const { data: ongoingRaw } = await supabase.from('ladder_match_sets').select('*, ladder_record!inner(*)').in('status', ['in_progress', 'proposed']).order('created_at', { ascending: false }).limit(10);
      setOngoingMatches(ongoingRaw || []);

      const allTeamIds = [...new Set((ongoingRaw || []).flatMap(m => (m.ladder_record || []).map(r => r.user_id)))];
      if (allTeamIds.length > 0) {
        const { data: teamProfs } = await supabase.from('ladder_rankings').select('user_id, total_mmr, profiles!inner(by_id)').in('user_id', allTeamIds);
        const profMap = Object.fromEntries((teamProfs || []).map(p => [
          p.user_id, { id: p.user_id, by_id: p.profiles?.by_id, total_mmr: p.total_mmr }
        ]));
        setMatchProfiles(profMap);
      }

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
    const channel = supabase.channel('ladder-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_queue' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  useEffect(() => {
    if (proposalCooldown <= 0) return;
    cooldownTimerRef.current = setTimeout(() => setProposalCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(cooldownTimerRef.current);
  }, [proposalCooldown]);

// 💡 [수정됨] 에러를 잡아서 화면에 경고창을 띄워주는 joinQueue
  const joinQueue = async () => {
    // 1. 혹시 유저 정보가 아직 로드되지 않았을 때의 방어막
    if (!currentUserRef.current?.id) {
      alert('로그인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      setJoiningQueue(true);
      
      // 2. Supabase에 데이터 넣기 (에러가 발생하면 error 변수에 담김)
      const { error } = await supabase.from('ladder_queue').upsert({ 
        user_id: currentUserRef.current.id, 
        is_in_queue: true, 
        queue_joined_at: new Date().toISOString() 
      });

      // 3. 에러가 있다면 catch 블록으로 던져서 알림을 띄우게 만듭니다!
      if (error) throw error; 

      setInQueue(true);
      fetchData();
      
      clearTimeout(queueTimerRef.current);
      queueTimerRef.current = setTimeout(() => {
        leaveQueue();
      }, MAX_QUEUE_MINUTES * 60 * 1000);

    } catch (err) {
      // 💡 여기서 어떤 에러인지 정확하게 콘솔과 알림창으로 알려줍니다.
      console.error('대기열 참여 에러:', err);
      alert('대기열 참여 실패: ' + (err.message || '알 수 없는 오류'));
      setInQueue(false); // 실패했으니 상태를 다시 원복합니다.
    } finally {
      setJoiningQueue(false);
    }
  };

  const leaveQueue = async () => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    clearTimeout(queueTimerRef.current);
    await supabase.from('ladder_queue').update({ is_in_queue: false }).eq('user_id', uid);
    setInQueue(false);
    fetchData();
  };

  const proposeMatch = async (typeStr, teamA, teamB) => {
    if (!currentUserRef.current || proposalCooldown > 0) return;
    const avgA = teamA.reduce((s, p) => s + getPlayerMmr(p), 0) / teamA.length;
    const avgB = teamB.reduce((s, p) => s + getPlayerMmr(p), 0) / teamB.length;
    
    if (Math.abs(avgA - avgB) > BALANCE_THRESHOLD) {
      if (!window.confirm('⚠️ 팀 점수 차이가 200점을 초과합니다. 진행하시겠습니까?')) return;
    }

    try {
      const matchId = crypto.randomUUID();
      await supabase.from('ladder_match_sets').insert({ match_id: matchId, set_number: 1, status: 'proposed', race_type: `${typeStr}v${typeStr}` });
      
      const records = [
        ...teamA.map(p => ({ match_id: matchId, user_id: p.id, team: 'A' })),
        ...teamB.map(p => ({ match_id: matchId, user_id: p.id, team: 'B' }))
      ];
      await supabase.from('ladder_record').insert(records);

      const newAttempts = proposalAttempts + 1;
      setProposalAttempts(newAttempts);
      setProposalCooldown(COOLDOWN_STEPS[Math.min(newAttempts, COOLDOWN_STEPS.length - 1)]);

      setActiveProposal({ matchId, matchType: `${typeStr}v${typeStr}`, teamA, teamB, avgA, avgB, diff: Math.abs(avgA - avgB), proposedBy: currentUserRef.current.id });
    } catch (err) {
      alert('제안 실패: ' + err.message);
    }
  };

  // 💡 여기서 팀을 계산해서 요리사에게 넘겨줍니다!
  const perTeam = MATCH_TYPES[queueMatchType]?.perTeam || 4;
  const teams = buildTeams(queuePlayers, perTeam, sortOption);

  return {
    queuePlayers, ongoingMatches, loading, inQueue, joiningQueue,
    activeProposal, setActiveProposal, proposalCooldown, matchProfiles,
    queueMatchType, setQueueMatchType, // 넘겨줌
    sortOption, setSortOption,         // 넘겨줌
    teams, perTeam,                    // 넘겨줌
    joinQueue, leaveQueue, proposeMatch, fetchData
  };
}
