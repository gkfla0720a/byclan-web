// 파일명: src/hooks/useLadderData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { getPlayerMmr } from '@/utils/profiles';
import { buildTeams, MATCH_TYPES } from '@/utils/matchMaking';
import type { User } from '@supabase/supabase-js';

const MAX_QUEUE_MINUTES = 20;
const COOLDOWN_STEPS = [0, 10, 30, 180];
const BALANCE_THRESHOLD = 200;

// 타입 정의
interface QueuePlayer {
  id: string;
  by_id: string | null;
  role: string | null;
  race: string | null;
  total_mmr: number;
  queue_joined_at: string | null;
}

export function useLadderData(user: User | null, authLoading: boolean) {
  const [queueMatchType, setQueueMatchType] = useState<'1v1' | '2v2' | '3v3' | '4v4' | '5v5'>('4v4');
  const [sortOption, setSortOption] = useState<'balance' | 'top' | 'bottom'>('balance');

  const [queuePlayers, setQueuePlayers] = useState<QueuePlayer[]>([]);
  const [ongoingMatches, setOngoingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [activeProposal, setActiveProposal] = useState<any | null>(null);
  const [proposalCooldown, setProposalCooldown] = useState(0);
  const [proposalAttempts, setProposalAttempts] = useState(0);
  const [matchProfiles, setMatchProfiles] = useState<Record<string, any>>({});

  const cooldownTimerRef = useRef<number | null>(null);
  const queueTimerRef = useRef<number | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const lastQueueKeyRef = useRef<string>('');

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

      const qPlayers: QueuePlayer[] = (queueRaw || []).filter(r => {
        const meta = Array.isArray(r.profiles?.profile_meta) ? r.profiles.profile_meta[0] : r.profiles?.profile_meta;
        return isTestViewer ? (meta?.is_test_account && meta?.is_test_account_active) : !meta?.is_test_account;
      }).map(r => ({
        id: r.user_id,
        by_id: r.profiles?.by_id ?? null,
        role: r.profiles?.role ?? null,
        race: r.profiles?.race ?? null,
        total_mmr: (Array.isArray(r.profiles?.ladder_rankings) ? r.profiles.ladder_rankings[0] : r.profiles?.ladder_rankings)?.total_mmr ?? 1000,
        queue_joined_at: r.queue_joined_at,
      }));

      setQueuePlayers(qPlayers);

      const newKey = qPlayers.map(p => p.id).sort().join(',');
      if (lastQueueKeyRef.current && lastQueueKeyRef.current !== newKey) {
        setProposalAttempts(0);
        setProposalCooldown(0);
        if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
      }
      lastQueueKeyRef.current = newKey;

      const { data: ongoingRaw } = await supabase.from('ladder_match_sets').select('*, ladder_record!inner(*)').in('status', ['in_progress', 'entry_pending']).order('created_at', { ascending: false }).limit(10);
      setOngoingMatches(ongoingRaw || []);

      const allTeamIds = [...new Set((ongoingRaw || []).flatMap((m: any) => {
        const records = Array.isArray(m.ladder_record) ? m.ladder_record : m.ladder_record ? [m.ladder_record] : [];
        return records.map((r: any) => r.user_id);
      }))];

      if (allTeamIds.length > 0) {
        const { data: teamProfs } = await supabase.from('ladder_rankings').select('user_id, total_mmr, profiles!inner(by_id)').in('user_id', allTeamIds);
        const profMap = Object.fromEntries((teamProfs || []).map((p: any) => [
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
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    if (proposalCooldown <= 0) return;
    cooldownTimerRef.current = window.setTimeout(() => setProposalCooldown(p => Math.max(0, p - 1)), 1000);
    return () => { if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current); };
  }, [proposalCooldown]);

  const joinQueue = async () => {
    if (!currentUserRef.current?.id) {
      alert('로그인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      setJoiningQueue(true);
      const { error } = await supabase.from('ladder_queue').upsert({
        user_id: currentUserRef.current.id,
        is_in_queue: true,
        queue_joined_at: new Date().toISOString()
      });

      if (error) throw error;

      setInQueue(true);
      fetchData();

      if (queueTimerRef.current) window.clearTimeout(queueTimerRef.current);
      queueTimerRef.current = window.setTimeout(() => {
        leaveQueue();
      }, MAX_QUEUE_MINUTES * 60 * 1000);

    } catch (err: any) {
      console.error('대기열 참여 에러:', err);
      alert('대기열 참여 실패: ' + (err.message || '알 수 없는 오류'));
      setInQueue(false);
    } finally {
      setJoiningQueue(false);
    }
  };

  const leaveQueue = async () => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    if (queueTimerRef.current) window.clearTimeout(queueTimerRef.current);
    await supabase.from('ladder_queue').update({ is_in_queue: false }).eq('user_id', uid);
    setInQueue(false);
    fetchData();
  };

  const proposeMatch = async (typeStr: string, teamA: QueuePlayer[], teamB: QueuePlayer[]) => {
    if (!currentUserRef.current || proposalCooldown > 0) return;
    const avgA = teamA.reduce((s, p) => s + getPlayerMmr(p), 0) / teamA.length;
    const avgB = teamB.reduce((s, p) => s + getPlayerMmr(p), 0) / teamB.length;

    if (Math.abs(avgA - avgB) > BALANCE_THRESHOLD) {
      if (!window.confirm('⚠️ 팀 점수 차이가 200점을 초과합니다. 진행하시겠습니까?')) return;
    }

    try {
      const matchId = crypto.randomUUID();

      // 1: 부모 테이블인 ladder_record에 먼저 한 줄(배열 형태)로 넣습니다!
      const { error: recordError } = await supabase.from('ladder_record').insert({
        id: matchId,
        match_type: `${typeStr}v${typeStr}`,
        status: 'proposed',
        team_a_ids: teamA.map(p => p.id),
        team_b_ids: teamB.map(p => p.id),
        // 필요하다면 team_a_races 등 추가
      });
      if (recordError) throw recordError;

      // 2: 이후 자식 테이블인 ladder_match_sets에 넣으며 컬럼/상태값 정상화!
      const { error: setError } = await supabase.from('ladder_match_sets').insert({
        match_id: matchId,
        set_number: 1,
        status: 'entry_pending', // proposed 아님 (DB CHECK 제약)
        match_type: `${typeStr}v${typeStr}`, // race_type 아님
      });
      if (setError) throw setError;

      const newAttempts = proposalAttempts + 1;
      setProposalAttempts(newAttempts);
      setProposalCooldown(COOLDOWN_STEPS[Math.min(newAttempts, COOLDOWN_STEPS.length - 1)]);

      setActiveProposal({ matchId, matchType: `${typeStr}v${typeStr}`, teamA, teamB, avgA, avgB, diff: Math.abs(avgA - avgB), proposedBy: currentUserRef.current.id });
    } catch (err: any) {
      console.error(err);
      alert('제안 실패: ' + err.message);
    }
  };

  const perTeam = MATCH_TYPES[queueMatchType as keyof typeof MATCH_TYPES]?.perTeam || 4;
  const teams = buildTeams(queuePlayers, perTeam, sortOption);

  return {
    queuePlayers, ongoingMatches, loading, inQueue, joiningQueue,
    activeProposal, setActiveProposal, proposalCooldown, matchProfiles,
    queueMatchType, setQueueMatchType,
    sortOption, setSortOption,
    teams, perTeam,
    joinQueue, leaveQueue, proposeMatch, fetchData
  };
}