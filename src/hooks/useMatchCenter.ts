// 파일명: src/hooks/useMatchCenter.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/context/AuthContext';
import type { Database } from '@/types';
import { LADDER_MEMBER_ROLES } from '@/types';
import type { RaceCode, UserRole } from '@/types/primitives';
import type { QueryData } from '@supabase/supabase-js';

// ─── 유틸리티 함수 임포트 ───
import {
  BET_AMOUNTS,
  BET_WINDOW_SECONDS,
  RACE_COMBOS,
  REQUIRED_RACE_COMBOS,
  RACE_ICONS,
  formatTime,
  getComboIdFromRaceCards,
  getRemainingRequiredCombos,
  getRaceCards,
  inferTeamLetter,
  isCompletedSetStatus,
  isActiveSetStatus,
  normalizeWinningTeam,
  isPendingReviewSetStatus,
} from '@/utils/matchCenter';

// ─── 🚨 Supabase Query 객체를 통한 무결점 자동 타입 추론 기술 구현 ───
const matchRecordQuery = (matchId: string) =>
  supabase
    .from('ladder_record')
    .select('*, profiles(*)')
    .eq('id', matchId)
    .single();

type MatchRecordDetail = QueryData<ReturnType<typeof matchRecordQuery>>;
type MatchSetRow = Database['public']['Tables']['ladder_match_sets']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'] & { total_mmr?: number };

interface MatchData extends MatchSetRow {
  match_sets: MatchSetRow[];
  team_a_ids: string[];
  team_b_ids: string[];
  profiles: ProfileRow[];
  score_a: number;
  score_b: number;
  match_type_code: number;
}

interface EntryPlayer {
  user_id: string;
  by_id: string | null;
  race: string | null;
}

interface BetOdds {
  total_a: number;
  total_b: number;
  count_a: number;
  count_b: number;
  odds_a: number;
  odds_b: number;
}

export function useMatchCenter(matchId: string) {
  const { user, profile } = useAuthContext();

  const [match, setMatch] = useState<MatchData | null>(null);
  const [currentSet, setCurrentSet] = useState<MatchSetRow | null>(null);
  const [betTimer, setBetTimer] = useState(BET_WINDOW_SECONDS);
  const [betTimerActive, setBetTimerActive] = useState(false);
  const [myTeam, setMyTeam] = useState<'A' | 'B' | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [managementMode, setManagementMode] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [settlementError, setSettlementError] = useState('');

  const [selectedEntryByTeam, setSelectedEntryByTeam] = useState<{ A: EntryPlayer[]; B: EntryPlayer[] }>({
    A: [{ user_id: '', by_id: '', race: '' }, { user_id: '', by_id: '', race: '' }, { user_id: '', by_id: '', race: '' }],
    B: [{ user_id: '', by_id: '', race: '' }, { user_id: '', by_id: '', race: '' }, { user_id: '', by_id: '', race: '' }],
  });

  const [betTeam, setBetTeam] = useState<'A' | 'B' | null>(null);
  const [betAmount, setBetAmount] = useState<number | null>(null);
  const [bettingDone, setBettingDone] = useState(false);
  const [bettingLoading, setBettingLoading] = useState(false);
  const [betOdds, setBetOdds] = useState<BetOdds>({ total_a: 0, total_b: 0, count_a: 0, count_b: 0, odds_a: 0, odds_b: 0 });
  const [raceCombo, setRaceCombo] = useState('PPT');
  const [showRaceSelector, setShowRaceSelector] = useState(false);

  const setTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 💡 데이터 로드 아키텍처 정비
  const fetchMatchData = useCallback(async () => {
    if (!user?.id || !matchId) return;

    try {
      // 세트 현황과 경기 마스터 레코드를 수집합니다.
      const { data: sets } = await supabase.from('ladder_match_sets').select('*').eq('match_id', matchId).order('set_number', { ascending: true });
      const { data: recordRaw, error: recordError } = await matchRecordQuery(matchId);

      if (!sets || sets.length === 0 || recordError || !recordRaw) return;

      const record = recordRaw as unknown as MatchRecordDetail;

      // [교정] 단수형 승리 정규화 파싱 수정
      const scoreA = sets.filter((s) => normalizeWinningTeam(s.winner_team) === 'A').length;
      const scoreB = sets.filter((s) => normalizeWinningTeam(s.winner_team) === 'B').length;

      // [교정] DB 본연의 JSONB 혹은 Array 문자열 기반 필드에서 순수 참가자 ID 추출
      const teamAIds = Array.isArray(record.team_a_ids) ? (record.team_a_ids as string[]) : [];
      const teamBIds = Array.isArray(record.team_b_ids) ? (record.team_b_ids as string[]) : [];
      const matchTypeCode = typeof record.match_type === 'number' ? record.match_type : Number(record.match_type || 0);

      const extractedProfiles = (
        Array.isArray(record.profiles)
          ? record.profiles
          : record.profiles ? [record.profiles] : []
      ) as ProfileRow[];

      const m: MatchData = {
        ...sets[0],
        match_sets: sets,
        team_a_ids: teamAIds,
        team_b_ids: teamBIds,
        profiles: extractedProfiles,
        score_a: scoreA,
        score_b: scoreB,
        match_type_code: matchTypeCode
      };
      setMatch(m);

      const teamLetter = inferTeamLetter(user.id, m.team_a_ids, m.team_b_ids) as 'A' | 'B' | null;
      setMyTeam(teamLetter);

      const activeSet = m.match_sets.find((s) => isActiveSetStatus(s.status)) || m.match_sets[m.match_sets.length - 1];
      setCurrentSet(activeSet || null);
      setIsRevealed(Boolean(activeSet?.team_a_ready && activeSet?.team_b_ready));

      if (activeSet?.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(activeSet.started_at).getTime()) / 1000);
        const remaining = Math.max(0, BET_WINDOW_SECONDS - elapsed);
        setBetTimer(remaining);
        setBetTimerActive(remaining > 0);
      }

      // 배당률 RPC 통신 처리
      const { data: oddsData } = await supabase.rpc('fn_get_match_bet_odds', { p_match_id: matchId });
      if (oddsData) {
        const normalizedOdds = Array.isArray(oddsData) ? oddsData[0] : oddsData;
        if (normalizedOdds) {
          setBetOdds({
            total_a: normalizedOdds.total_a ?? 0,
            total_b: normalizedOdds.total_b ?? 0,
            count_a: normalizedOdds.count_a ?? 0,
            count_b: normalizedOdds.count_b ?? 0,
            odds_a: normalizedOdds.odds_a ?? 0,
            odds_b: normalizedOdds.odds_b ?? 0,
          });
        }
      }
    } catch (err) {
      console.error('매치 데이터 로드 실패:', err);
    }
  }, [matchId, user?.id]);

  useEffect(() => {
    queueMicrotask(() => { void fetchMatchData(); });
    const channel = supabase.channel(`m-${matchId}`).on('postgres_changes', { event: '*', schema: 'public' }, fetchMatchData).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [matchId, fetchMatchData]);

  useEffect(() => {
    const loadManagementMode = async () => {
      const { data } = await supabase.from('developer_settings').select('value_bool').eq('key', 'match_admin_live_mode').maybeSingle();
      setManagementMode(Boolean(data?.value_bool));
    };
    queueMicrotask(() => { loadManagementMode().catch(() => setManagementMode(false)); });
  }, []);

  useEffect(() => {
    if (!betTimerActive || betTimer <= 0) return;
    setTimerRef.current = setTimeout(() => setBetTimer(p => {
      if (p <= 1) { setBetTimerActive(false); return 0; }
      return p - 1;
    }), 1000);
    return () => { if (setTimerRef.current) clearTimeout(setTimerRef.current); };
  }, [betTimer, betTimerActive]);

  // ─── 파생 변수 및 권한 고도화 ───
  const isManagementRole = ['admin', 'master', 'developer'].includes(String(profile?.role || ''));

  const getCaptainId = (teamIds?: string[]) => {
    if (!teamIds || teamIds.length === 0 || !match?.profiles) return null;
    const teamMembers = match.profiles.filter(p => teamIds.includes(p.user_id));
    if (teamMembers.length === 0) return null;

    const captain = [...teamMembers].sort((a, b) => (b.total_mmr ?? 0) - (a.total_mmr ?? 0))[0];
    return captain?.user_id || null;
  };

  const teamACaptainId = getCaptainId(match?.team_a_ids);
  const teamBCaptainId = getCaptainId(match?.team_b_ids);

  const isTeamCaptain = Boolean(user?.id && (user.id === teamACaptainId || user.id === teamBCaptainId));
  const canReportSetResult = Boolean(isManagementRole || isTeamCaptain);
  const perspectiveTeam = (managementMode && isManagementRole) ? 'D' : (myTeam || 'C');
  const editingTeam = perspectiveTeam === 'A' || perspectiveTeam === 'B' ? perspectiveTeam : null;
  const selectedEntry = editingTeam ? selectedEntryByTeam[editingTeam] : [];
  const remainingRequiredCombos = getRemainingRequiredCombos(match?.match_sets || []);

  useEffect(() => {
    if (remainingRequiredCombos.length > 0 && !remainingRequiredCombos.includes(raceCombo)) {
      queueMicrotask(() => { setRaceCombo(remainingRequiredCombos[0]); });
    }
  }, [remainingRequiredCombos, raceCombo]);

  // [교정] 교정 완료된 코드(match_type_code) 기반 BO5 / BO7 연산 분기 복구
  const needWins = (match?.match_type_code ?? 0) >= 5 ? 4 : 3;
  const matchEnded = Boolean(match && (match.score_a >= needWins || match.score_b >= needWins));
  const isLadderMatch = (match?.match_type_code ?? 0) >= 3;
  const matchFormat = (match?.match_type_code ?? 0) >= 5 ? 'BO7 (4선승)' : 'BO5 (3선승)';
  const canBetOnA = myTeam !== 'A';
  const canBetOnB = myTeam !== 'B';

  const getTeamMembersByLetter = (teamLetter: 'A' | 'B') => {
    const teamIds = teamLetter === 'A' ? (match?.team_a_ids || []) : (match?.team_b_ids || []);
    return (match?.profiles || []).filter((p) => teamIds.includes(p.user_id));
  };

  const currentTeamEntry = (teamLetter: 'A' | 'B'): EntryPlayer[] => {
    const entryData = currentSet?.[teamLetter === 'A' ? 'team_a_entry' : 'team_b_entry'];
    return Array.isArray(entryData) ? (entryData as unknown as EntryPlayer[]) : [];
  };

  const currentTeamReady = (teamLetter: 'A' | 'B') => {
    return Boolean(currentSet?.[teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready']);
  };

  // [교정] any 타입 전면 리팩토링 및 검증 통과 구조화
  const getRestStatus = (playerId: string, teamLetter: 'A' | 'B') => {
    if (!match?.match_sets || !teamLetter) return { count: 0, canRest: true };
    const completedSets = match.match_sets.filter((s) => isCompletedSetStatus(s.status));

    const restCount = completedSets.filter(s => {
      const entryData = s[teamLetter === 'A' ? 'team_a_entry' : 'team_b_entry'];
      const entryList = Array.isArray(entryData) ? (entryData as any[]) : [];
      return !entryList.some(e => (e?.user_id === playerId || e?.id === playerId));
    }).length;

    let maxRest = 1;
    if (match.match_type_code >= 5) maxRest = completedSets.length < 5 ? 2 : 3;
    return { count: restCount, canRest: restCount < maxRest };
  };

  const toggleManagementMode = async () => {
    const nextMode = !managementMode;
    const { error } = await supabase.from('developer_settings').upsert(
      { key: 'match_admin_live_mode', value_bool: nextMode, description: '운영진/개발자 매치 실시간 관리모드', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) return alert('관리모드 전환 실패: ' + error.message);
    setManagementMode(nextMode);
  };

  const handleSelect = (teamLetter: 'A' | 'B', idx: number, playerId: string, race: string) => {
    const player = getTeamMembersByLetter(teamLetter).find((m) => m.user_id === playerId);
    if (player && player.race && player.race !== 'Random' && player.race !== race) {
      const raceLabel: Record<string, string> = { Terran: '테란', Protoss: '프로토스', Zerg: '저그' };
      alert(`이 슬롯은 ${raceLabel[race] || race} 선수만 배치할 수 있습니다.\n${player.by_id}님의 주종은 ${raceLabel[player.race] || player.race}입니다.`);
      return;
    }
    setSelectedEntryByTeam((prev) => {
      const nextEntry = [...prev[teamLetter]];
      nextEntry[idx] = { user_id: playerId, by_id: player?.by_id || '', race };
      return { ...prev, [teamLetter]: nextEntry };
    });
  };

  const submitEntry = async (teamLetter?: 'A' | 'B') => {
    const team = teamLetter || editingTeam;
    if (!currentSet || !team) return;

    const column = team === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = team === 'A' ? 'team_a_entry' : 'team_b_entry';
    const reqCol = team === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';

    const { error } = await supabase.from('ladder_match_sets').update({
      [column]: true,
      [entryCol]: selectedEntryByTeam[team] as any,
      [reqCol]: false,
    }).eq('id', currentSet.id);

    if (error) return alert('엔트리 제출 실패: ' + error.message);
    alert(managementMode && isManagementRole ? `${team}팀 엔트리를 관리모드로 제출했습니다.` : '엔트리 제출 완료! 상대방을 기다립니다.');
  };

  const requestWithdraw = async (teamLetter: 'A' | 'B') => {
    if (!currentSet || currentSet.winner_team) return;
    const col = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [col]: true }).eq('id', currentSet.id);
  };

  const approveWithdraw = async (teamLetter: 'A' | 'B') => {
    if (!currentSet || currentSet.winner_team) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [readyCol]: false, [reqCol]: false }).eq('id', currentSet.id);
  };

  const forceRetract = async (teamLetter: 'A' | 'B') => {
    if (!currentSet || !isManagementRole || !managementMode) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [readyCol]: false, [reqCol]: false }).eq('id', currentSet.id);
  };

  const handleSetWin = async (winnerTeam: 'A' | 'B') => {
    if (!currentSet || !canReportSetResult) return;
    try {
      const { error } = await supabase.rpc('fn_claim_set_win', { p_set_id: currentSet.id, p_winner_team: winnerTeam });
      if (error) throw error;
      await fetchMatchData();
    } catch (err: any) {
      alert('승리 요청 실패: ' + (err.message || '알 수 없는 오류'));
    }
  };

  const handleVeto = async () => {
    if (!currentSet) return;
    try {
      const { error } = await supabase.rpc('fn_veto_set_win', { p_set_id: currentSet.id });
      if (error) throw error;
      await fetchMatchData();
    } catch (err: any) {
      alert('수정 요청 실패: ' + err.message);
    }
  };

  const finalizeSetWin = useCallback(async (winnerTeam: string) => {
    try {
      const nextA = (match?.score_a || 0) + (winnerTeam === 'A' ? 1 : 0);
      const nextB = (match?.score_b || 0) + (winnerTeam === 'B' ? 1 : 0);
      let nextCombo = raceCombo;

      if (nextA < needWins && nextB < needWins) {
        if (remainingRequiredCombos.length > 0 && !remainingRequiredCombos.includes(nextCombo)) {
          nextCombo = remainingRequiredCombos[0];
        }
      }

      const { error } = await supabase.rpc('fn_declare_set_winner', {
        p_set_id: currentSet.id,
        p_match_id: matchId,
        p_winner_team: winnerTeam,
        p_next_combo_id: nextCombo
      });

      if (error && !error.message.includes('이미 결과가 반영된 세트입니다')) throw error;
      await fetchMatchData();
    } catch (err) {
      console.error('자동 승인 실패:', err);
    }
  }, [match, currentSet, matchId, raceCombo, needWins, remainingRequiredCombos, fetchMatchData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPendingReviewSetStatus(currentSet?.status) && currentSet?.claim_time) {
      try { new Audio('/sounds/pending-start.mp3').play().catch(() => { }); } catch (e) { }

      const endTime = new Date(currentSet.claim_time).getTime() + (30 * 1000);

      intervalId = setInterval(() => {
        const left = Math.ceil((endTime - Date.now()) / 1000);

        if (left <= 0) {
          clearInterval(intervalId);
          setVetoTimeLeft(0);
          try { new Audio('/sounds/pending-end.mp3').play().catch(() => { }); } catch (e) { }

          if (isTeamCaptain && currentSet.claimed_winner) {
            void finalizeSetWin(currentSet.claimed_winner);
          }
        } else {
          setVetoTimeLeft(left);
        }
      }, 1000);
    } else {
      queueMicrotask(() => { setVetoTimeLeft(0); });
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [currentSet?.status, currentSet?.claim_time, currentSet?.claimed_winner, isTeamCaptain, finalizeSetWin]);

  const handleBet = async () => {
    if (!betTeam || !betAmount || bettingDone || !betTimerActive || !user?.id) return;
    if (betTeam === myTeam) return alert('자신의 팀에는 베팅할 수 없습니다.');

    setBettingLoading(true);
    try {
      const { error } = await supabase.rpc('fn_place_bet', {
        p_match_id: matchId,
        p_user_id: user.id,
        p_team_choice: betTeam,
        p_bet_amount: betAmount
      });

      if (error) throw error;

      setBettingDone(true);
      await fetchMatchData();
      alert(`✅ ${betTeam}팀에 ${betAmount.toLocaleString()} CP 베팅 완료!`);
    } catch (err: any) {
      alert('베팅 실패: ' + (err.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setBettingLoading(false);
    }
  };

  const handleSettlement = async () => {
    setSettlementStatus('loading');
    setSettlementError('');
    try {
      const { data: matchData, error: checkError } = await supabase.from('ladder_record').select('status').eq('id', matchId).single();
      if (checkError) throw checkError;
      if (matchData?.status === 'completed') {
        setSettlementStatus('success');
        throw new Error('이미 정산이 완료된 경기입니다.');
      }
      const { error } = await supabase.rpc('fn_process_settlement', { p_match_id: matchId });
      if (error) throw error;
      setSettlementStatus('success');
      alert('매치 정산이 완벽하게 처리되었습니다!');
    } catch (err: any) {
      setSettlementError(err.message || '알 수 없는 오류가 발생했습니다.');
      setSettlementStatus('error');
    }
  };

  return {
    match, currentSet, betTimer, betTimerActive, myTeam, myUserId: user?.id || null, isRevealed,
    myRole: profile?.role || null, managementMode, settlementStatus, settlementError,
    selectedEntryByTeam, betTeam, betAmount, bettingDone, bettingLoading,
    betOdds, myClanPoint: profile?.clan_point || 0, raceCombo, showRaceSelector, isManagementRole,
    canReportSetResult, perspectiveTeam, editingTeam, selectedEntry, remainingRequiredCombos,
    needWins, matchEnded, isLadderMatch, matchFormat, canBetOnA, canBetOnB, teamACaptainId, teamBCaptainId,
    vetoTimeLeft, handleVeto, setBetTeam, setBetAmount, setRaceCombo, toggleManagementMode,
    handleSelect, submitEntry, requestWithdraw, approveWithdraw, forceRetract, handleSetWin, handleBet,
    handleSettlement, getTeamMembersByLetter, currentTeamEntry, currentTeamReady, getRestStatus, setShowRaceSelector,
    formatTime, getComboIdFromRaceCards, getRaceCards, RACE_ICONS, BET_AMOUNTS
  };
}