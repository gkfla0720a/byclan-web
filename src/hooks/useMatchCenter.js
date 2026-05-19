// 파일명: src/hooks/useMatchCenter.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';

// ─── 상수 (Constants) ───
export const BET_AMOUNTS = [500, 1000, 5000, 10000];
export const BET_WINDOW_SECONDS = 300;
export const RACE_COMBOS = [
  { id: 'PPP', label: '프프프', races: ['Protoss', 'Protoss', 'Protoss'] },
  { id: 'PPT', label: '프프테', races: ['Protoss', 'Protoss', 'Terran'] },
  { id: 'PPZ', label: '프프저', races: ['Protoss', 'Protoss', 'Zerg'] },
  { id: 'PZT', label: '프저테', races: ['Protoss', 'Zerg', 'Terran'] },
  { id: 'RANDOM', label: '대포 (랜덤)', races: null },
];
export const REQUIRED_RACE_COMBOS = ['PPP', 'PPT', 'PPZ', 'PZT', 'RANDOM'];
export const RACE_ICONS = { Protoss: '프', Terran: '테', Zerg: '저' };

// ─── 헬퍼 함수 (Helper Functions) ───
export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getComboIdFromRaceCards(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) return null;
  const map = { Protoss: 'P', Terran: 'T', Zerg: 'Z' };
  const code = cards.map((race) => map[race] || 'X').sort().join('');
  if (code === 'PTZ') return 'PZT';
  if (REQUIRED_RACE_COMBOS.includes(code)) return code;
  return null;
}

export function getRemainingRequiredCombos(matchSets) {
  const used = new Set();
  (matchSets || []).forEach((setRow) => {
    const comboFromCode = typeof setRow?.combo_code === 'string' ? setRow.combo_code : null;
    const normalized = comboFromCode === 'PTZ' ? 'PZT' : comboFromCode;
    const combo = REQUIRED_RACE_COMBOS.includes(normalized) ? normalized : getComboIdFromRaceCards(setRow?.race_cards);
    if (combo) used.add(combo);
  });
  return REQUIRED_RACE_COMBOS.filter((combo) => !used.has(combo));
}

export function getRaceCards(comboId) {
  const combo = RACE_COMBOS.find(c => c.id === comboId);
  if (!combo || !combo.races) {
    const pool = ['Protoss', 'Terran', 'Zerg'];
    return [0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]);
  }
  return combo.races;
}

// ─── 메인 훅 (Main Hook) ───
export function useMatchCenter(matchId) {
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [betTimer, setBetTimer] = useState(BET_WINDOW_SECONDS);
  const [betTimerActive, setBetTimerActive] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [managementMode, setManagementMode] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState('idle'); 
  const [settlementError, setSettlementError] = useState('');

  const [selectedEntryByTeam, setSelectedEntryByTeam] = useState({
    A: [{ id: '', by_id: '', race: '' }, { id: '', by_id: '', race: '' }, { id: '', by_id: '', race: '' }],
    B: [{ id: '', by_id: '', race: '' }, { id: '', by_id: '', race: '' }, { id: '', by_id: '', race: '' }],
  });
  const [betTeam, setBetTeam] = useState(null);
  const [betAmount, setBetAmount] = useState(null);
  const [bettingDone, setBettingDone] = useState(false);
  const [bettingLoading, setBettingLoading] = useState(false);
  const [betOdds, setBetOdds] = useState({ total_a: 0, total_b: 0, count_a: 0, count_b: 0, odds_a: 0, odds_b: 0 });
  const [myClanPoint, setMyClanPoint] = useState(0);
  const [raceCombo, setRaceCombo] = useState('PPT');
  const [showRaceSelector, setShowRaceSelector] = useState(false);
  
  const setTimerRef = useRef(null);

  const fetchMatchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyUserId(user.id);

    const { data: sets } = await supabase.from('ladder_match_sets').select('*').eq('match_id', matchId).order('set_number', { ascending: true });
    const { data: records } = await supabase.from('ladder_record').select('*, profiles(*)').eq('match_id', matchId);

    if (!sets || sets.length === 0 || !records) return;
    
    const scoreA = sets.filter(s => s.winner_team === 'A').length;
    const scoreB = sets.filter(s => s.winner_team === 'B').length;
    const matchType = records.filter(r => r.team === 'A').length;
    
    const m = {
      ...sets[0], 
      match_sets: sets,
      team_a_ids: records.filter(r => r.team === 'A').map(r => r.user_id),
      team_b_ids: records.filter(r => r.team === 'B').map(r => r.user_id),
      profiles: records.map(r => r.profiles),
      score_a: scoreA,
      score_b: scoreB,
      match_type: matchType
    };
    setMatch(m);

    const [{ data: prof }, { data: profMeta }] = await Promise.all([
      supabase.from('profiles').select('id, role, clan_point').eq('id', user.id).single(),
      supabase.from('profile_meta').select('is_test_account').eq('user_id', user.id).maybeSingle(),
    ]);
    if (prof && profMeta) prof.is_test_account = profMeta.is_test_account;
    if (prof) {
      setMyClanPoint(prof.clan_point ?? 0);
      setMyRole(prof.role || null);
    }

    const inTeamA = (m.team_a_ids || []).includes(user.id);
    const inTeamB = (m.team_b_ids || []).includes(user.id);
    const teamLetter = inTeamA ? 'A' : inTeamB ? 'B' : null;
    setMyTeam(teamLetter);

    const activeSet = m.match_sets?.find(s => s.status !== 'completed') || m.match_sets?.[m.match_sets.length - 1];
    setCurrentSet(activeSet);
    setIsRevealed(Boolean(activeSet?.team_a_ready && activeSet?.team_b_ready));

    if (activeSet?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(activeSet.started_at).getTime()) / 1000);
      const remaining = Math.max(0, BET_WINDOW_SECONDS - elapsed);
      setBetTimer(remaining);
      setBetTimerActive(remaining > 0);
    }

    try {
      const { data: oddsData } = await supabase.rpc('fn_get_match_bet_odds', { p_match_id: matchId });
      if (oddsData) setBetOdds(oddsData);
    } catch {}
  }, [matchId]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchMatchData();
    });
    const channel = supabase.channel(`m-${matchId}`).on('postgres_changes', { event: '*', schema: 'public' }, fetchMatchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, fetchMatchData]);

  useEffect(() => {
    const loadManagementMode = async () => {
      const { data } = await supabase.from('developer_settings').select('value_bool').eq('key', 'match_admin_live_mode').maybeSingle();
      setManagementMode(Boolean(data?.value_bool));
    };
    queueMicrotask(() => {
      loadManagementMode().catch(() => setManagementMode(false));
    });
  }, []);

  useEffect(() => {
    if (!betTimerActive || betTimer <= 0) return;
    setTimerRef.current = setTimeout(() => setBetTimer(p => {
      if (p <= 1) { setBetTimerActive(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearTimeout(setTimerRef.current);
  }, [betTimer, betTimerActive]);

// ─── 파생 변수들 ───
  
  // 💡 [수정] 엄격한 문자열 검사 (오염된 데이터는 얄짤없이 권한 거부)
  const isManagementRole = ['admin', 'master', 'developer'].includes(myRole);

  // 💡 [혁신] 최고 MMR 유저를 팀장으로 자동 선출하는 헬퍼 함수
  const getCaptainId = (teamIds) => {
    if (!teamIds || teamIds.length === 0) return null;
    const profilesArray = Array.isArray(match?.profiles) ? match.profiles : (match?.profiles ? [match.profiles] : []);
    
    const teamMembers = profilesArray.filter(p => teamIds.includes(p.id));
    
    // 🚨 [안전장치] 프로필 데이터가 없거나 덜 불러와졌다면 치명적 오류 발생
    if (teamMembers.length !== teamIds.length) {
      console.error('🚨 [Critical Error] 매치 참여자의 프로필 데이터를 완벽히 불러오지 못했습니다.');
      return null; 
    }
    
    const captain = [...teamMembers].sort((a, b) => {
      // 🚨 [안전장치] total_mmr 데이터가 아예 없다면 게임 진행 불가 처리
      if (a.total_mmr === undefined || a.total_mmr === null || b.total_mmr === undefined || b.total_mmr === null) {
        console.error(`🚨 [Critical Error] MMR 데이터 누락! (${a.by_id} 또는 ${b.by_id}) - 비정상적인 매치입니다.`);
      }
      return b.total_mmr - a.total_mmr; // 순수 total_mmr만 깐깐하게 비교
    })[0];
    
    return captain?.id || null;
  };

  const teamACaptainId = getCaptainId(match?.team_a_ids);
  const teamBCaptainId = getCaptainId(match?.team_b_ids);
  
  const isTeamCaptain = (myUserId && (myUserId === teamACaptainId || myUserId === teamBCaptainId)) || false;
  const canReportSetResult = Boolean(isManagementRole || isTeamCaptain);
  const perspectiveTeam = (managementMode && isManagementRole) ? 'D' : (myTeam || 'C');
  const editingTeam = perspectiveTeam === 'A' || perspectiveTeam === 'B' ? perspectiveTeam : null;
  const selectedEntry = editingTeam ? selectedEntryByTeam[editingTeam] : [];
  const remainingRequiredCombos = getRemainingRequiredCombos(match?.match_sets);
  
  useEffect(() => {
    if (remainingRequiredCombos.length > 0 && !remainingRequiredCombos.includes(raceCombo)) {
      queueMicrotask(() => {
        setRaceCombo(remainingRequiredCombos[0]);
      });
    }
  }, [remainingRequiredCombos, raceCombo]);

  const needWins = Number(match?.match_type) >= 5 ? 4 : 3;
  const matchEnded = match && (match.score_a >= needWins || match.score_b >= needWins);
  const isLadderMatch = match?.match_type >= 3;
  const matchFormat = match?.match_type >= 5 ? 'BO7 (4선승)' : 'BO5 (3선승)';
  const canBetOnA = myTeam !== 'A';
  const canBetOnB = myTeam !== 'B';

  // ─── 헬퍼 함수들 (내부 상태 참조용) ───
  const getProfilesArray = () => (Array.isArray(match?.profiles) ? match.profiles : (match?.profiles ? [match.profiles] : []));
  const getTeamMembersByLetter = (teamLetter) => {
    const profilesArray = getProfilesArray();
    const teamIds = teamLetter === 'A' ? (match?.team_a_ids || []) : (match?.team_b_ids || []);
    return profilesArray.filter((p) => teamIds.includes(p.id));
  };
  const currentTeamEntry = (teamLetter) => currentSet?.[`team_${teamLetter}_entry`] || [];
  const currentTeamReady = (teamLetter) => Boolean(currentSet?.[`team_${teamLetter}_ready`]);

  const getRestStatus = (playerId, teamLetter) => {
    if (!match?.match_sets || !teamLetter) return { count: 0, canRest: true };
    const completedSets = match.match_sets.filter(s => s.status === 'completed');
    const restCount = completedSets.filter(s => {
      const entry = teamLetter === 'A' ? s.team_a_entry : s.team_b_entry;
      return !entry?.some(e => e.id === playerId);
    }).length;
    let maxRest = 1;
    if (match.match_type >= 5) maxRest = completedSets.length < 5 ? 2 : 3;
    return { count: restCount, canRest: restCount < maxRest };
  };

  // ─── 액션 함수들 ───
  const toggleManagementMode = async () => {
    const nextMode = !managementMode;
    const { error } = await supabase.from('developer_settings').upsert(
      { key: 'match_admin_live_mode', value_bool: nextMode, description: '운영진/개발자 매치 실시간 관리모드', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) { alert('관리모드 전환 실패: ' + error.message); return; }
    setManagementMode(nextMode);
  };

  const handleSelect = (teamLetter, idx, playerId, race) => {
    const player = getTeamMembersByLetter(teamLetter).find((m) => m.id === playerId);
    if (player && player.race && player.race !== 'Random' && player.race !== race) {
      const raceLabel = { Terran: '테란', Protoss: '프로토스', Zerg: '저그' };
      alert(`종족전 규칙: 이 슬롯은 ${raceLabel[race] || race} 선수만 배치할 수 있습니다.\n${player.by_id}님의 주종은 ${raceLabel[player.race] || player.race}입니다.`);
      return;
    }
    setSelectedEntryByTeam((prev) => {
      const nextEntry = [...prev[teamLetter]];
      nextEntry[idx] = { id: playerId, by_id: player?.by_id || '', race };
      return { ...prev, [teamLetter]: nextEntry };
    });
  };

  const submitEntry = async (teamLetter) => {
    const team = teamLetter || editingTeam;
    if (!currentSet || !team) return;
    const column = team === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = team === 'A' ? 'team_a_entry' : 'team_b_entry';
    const reqCol = team === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    
    const { error } = await supabase.from('ladder_match_sets').update({
      [column]: true, [entryCol]: selectedEntryByTeam[team], [reqCol]: false,
    }).eq('id', currentSet.id);
    
    if (error) { alert('엔트리 제출 실패: ' + error.message); return; }
    alert(managementMode && isManagementRole ? `${team}팀 엔트리를 관리모드로 제출했습니다.` : '엔트리 제출 완료! 상대방을 기다립니다.');
  };

  const requestWithdraw = async (teamLetter) => {
    if (!currentSet || currentSet.winner_team) return;
    const col = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [col]: true }).eq('id', currentSet.id);
  };

  const approveWithdraw = async (teamLetter) => {
    if (!currentSet || currentSet.winner_team) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [readyCol]: false, [reqCol]: false }).eq('id', currentSet.id);
  };

  const forceRetract = async (teamLetter) => {
    if (!currentSet || !isManagementRole || !managementMode) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    await supabase.from('ladder_match_sets').update({ [readyCol]: false, [reqCol]: false }).eq('id', currentSet.id);
  };

  const [vetoTimeLeft, setVetoTimeLeft] = useState(0);

// 💡 [변경] 즉시 확정 짓지 않고, '결재(Pending)'를 올립니다.
const handleSetWin = async (winnerTeam) => {
    if (!currentSet || !canReportSetResult) return;
    try {
      const { error } = await supabase.rpc('fn_claim_set_win', { p_set_id: currentSet.id, p_winner_team: winnerTeam });
      if (error) throw error;
      await fetchMatchData();
    } catch (err) { 
      alert('승리 요청 실패: ' + (err.message || '알 수 없는 오류')); 
    }
  };

// 💡 [수정/추가] 수정 요청(Veto) 함수
  const handleVeto = async () => {
    if (!currentSet) return;
    try {
      const { error } = await supabase.rpc('fn_veto_set_win', { p_set_id: currentSet.id });
      if (error) throw error;
      await fetchMatchData();
    } catch (err) {
      alert('수정 요청 실패: ' + err.message);
    }
  };

  // 💡 [추가] 30초가 지나면 백엔드에 '최종 승인'을 내리는 함수 (기존 handleSetWin의 2단계 로직)
  const finalizeSetWin = useCallback(async (winnerTeam) => {
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

      // 여러 캡틴이 동시에 호출해도 DB 자물쇠 덕분에 1번만 성공하고 나머지는 무시됩니다.
      if (error && !error.message.includes('이미 결과가 반영된 세트입니다')) throw error;
      
      await fetchMatchData();
    } catch (err) {
      console.error('자동 승인 실패:', err);
    }
  }, [match, currentSet, matchId, raceCombo, needWins, remainingRequiredCombos, fetchMatchData]);

  // 💡 [추가] 결재 대기 상태(pending_review) 감지 및 30초 타이머 & 사운드 이펙트
  useEffect(() => {
    let intervalId;

    if (currentSet?.status === 'pending_review' && currentSet?.claim_time) {
      // 1. Pending 시작 알람 소리 (public 폴더에 짧은 mp3 파일 필요)
      try { new Audio('/sounds/pending-start.mp3').play().catch(() => {}); } catch(e){}

      const endTime = new Date(currentSet.claim_time).getTime() + (30 * 1000);
      
      intervalId = setInterval(() => {
        const left = Math.ceil((endTime - Date.now()) / 1000);
        
        if (left <= 0) {
          clearInterval(intervalId);
          setVetoTimeLeft(0);
          
          // 타이머가 0이 되면 Pending 종료 알람 소리 재생
          try { new Audio('/sounds/pending-end.mp3').play().catch(() => {}); } catch(e){}
          
          // 캡틴 중 한 명이 대표로 자동 결재 API 호출 (DB 무결성 덕분에 중복 호출 안전함)
          if (isTeamCaptain && currentSet.claimed_winner) {
            finalizeSetWin(currentSet.claimed_winner);
          }
        } else {
          setVetoTimeLeft(left);
        }
      }, 1000);
    } else {
      queueMicrotask(() => {
        setVetoTimeLeft(0);
      });
    }

    return () => clearInterval(intervalId);
  }, [currentSet?.status, currentSet?.claim_time, currentSet?.claimed_winner, isTeamCaptain, finalizeSetWin]);

  const handleBet = async () => {
    // UI 단의 기본적인 방어막
    if (!betTeam || !betAmount || bettingDone || !betTimerActive) return;
    if (betTeam === myTeam) { alert('자신의 팀에는 베팅할 수 없습니다.'); return; }
    
    setBettingLoading(true);
    try {
      // 💡 [혁신] 프론트엔드의 수학 계산과 3단 DB 통신이 단 한 줄의 RPC 호출로 끝납니다!
      const { error } = await supabase.rpc('fn_place_bet', {
        p_match_id: matchId,
        p_user_id: myUserId,
        p_team_choice: betTeam,
        p_bet_amount: betAmount
      });

      // 백엔드에서 잔액 부족 등으로 에러를 던지면 여기서 캐치됩니다.
      if (error) throw error;
      
      // 베팅 성공 시 UI 업데이트
      setBettingDone(true);
      await fetchMatchData(); // 내 포인트와 배당률을 DB에서 다시 최신화
      alert(`✅ ${betTeam}팀에 ${betAmount.toLocaleString()} CP 베팅 완료!`);

    } catch (err) { 
      // Supabase 에러 메시지 정리해서 보여주기
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
    } catch (err) {
      setSettlementError(err.message || '알 수 없는 오류가 발생했습니다.');
      setSettlementStatus('error');
    }
  };

  return {
    match, currentSet, betTimer, betTimerActive, myTeam, myUserId, isRevealed, myRole, managementMode, 
    settlementStatus, settlementError, selectedEntryByTeam, betTeam, betAmount, bettingDone, bettingLoading, 
    betOdds, myClanPoint, raceCombo, showRaceSelector, isManagementRole, canReportSetResult, perspectiveTeam, 
    editingTeam, selectedEntry, remainingRequiredCombos, needWins, matchEnded, isLadderMatch, matchFormat, 
    canBetOnA, canBetOnB, teamACaptainId, teamBCaptainId, vetoTimeLeft, handleVetosetBetTeam, setBetAmount,
    setRaceCombo, toggleManagementMode, handleSelect, submitEntry, requestWithdraw, approveWithdraw, 
    forceRetract, handleSetWin, handleBet, handleSettlement, getTeamMembersByLetter, currentTeamEntry, 
    currentTeamReady, getRestStatus, handleVeto, setShowRaceSelector, setBetTeam
  };
}
