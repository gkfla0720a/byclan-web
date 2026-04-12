/**
 * 파일명: MatchCenter.js
 *
 * 역할:
 *   진행 중인 래더 매치의 세부 화면 컴포넌트입니다.
 *   경기 스코어보드, 포인트 베팅, 세트별 엔트리(출전 선수) 제출 기능을 제공합니다.
 *
 * 주요 기능:
 *   - 실시간 매치 데이터 표시 (Supabase Realtime 구독)
 *   - 세트 시작 후 5분간 포인트 베팅 창 운영 (타이머 카운트다운)
 *   - 각 세트마다 팀별 출전 선수(엔트리) 비공개 제출 후 동시 공개
 *   - 휴식 규칙 적용: 선수별 최대 휴식 횟수 제한 (4v4: 1회, 5v5: 2~3회)
 *   - 패배팀이 다음 세트 종족 조합 선택권 보유 (프프프/프프테/프프저/프저테/대포)
 *
 * 사용 방법:
 *   <MatchCenter
 *     matchId="uuid-string"
 *     onExit={() => { ... }}
 *   />
 *
 *   - matchId: 조회할 래더 매치의 UUID
 *   - onExit: "래더 로비로 돌아가기" 버튼 클릭 시 호출되는 콜백
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';

/** 베팅 가능한 포인트 단위 목록 (1,000/5,000/10,000 CP 세 가지 선택지) */
const BET_AMOUNTS = [1000, 5000, 10000];
/** 세트 시작 후 베팅 가능한 시간(초). 5분 = 300초. */
const BET_WINDOW_SECONDS = 300; // 5분

/**
 * 종족 조합 선택지 목록입니다.
 * 패배팀이 다음 세트의 종족 카드를 선택할 때 사용합니다.
 * RANDOM(대포)의 경우 races가 null이며, getRaceCards에서 랜덤 생성합니다.
 */
const RACE_COMBOS = [
  { id: 'PPP', label: '프프프', races: ['Protoss', 'Protoss', 'Protoss'] },
  { id: 'PPT', label: '프프테', races: ['Protoss', 'Protoss', 'Terran'] },
  { id: 'PPZ', label: '프프저', races: ['Protoss', 'Protoss', 'Zerg'] },
  { id: 'PZT', label: '프저테', races: ['Protoss', 'Zerg', 'Terran'] },
  { id: 'RANDOM', label: '대포 (랜덤)', races: null },
];

/** 종족 영문명을 한글 아이콘으로 변환하는 매핑 객체 */
const RACE_ICONS = { Protoss: '프', Terran: '테', Zerg: '저' };

/**
 * 선택된 종족 조합 ID로 해당 세트의 종족 카드 배열을 반환합니다.
 * RANDOM(대포) 선택 시 프프프를 제외한 무작위 3종족 조합을 생성합니다.
 *
 * @param {string} comboId - 종족 조합 ID (예: 'PPT', 'RANDOM')
 * @returns {string[]} 종족 이름 배열 (예: ['Protoss', 'Protoss', 'Terran'])
 */
function getRaceCards(comboId) {
  const combo = RACE_COMBOS.find(c => c.id === comboId);
  if (!combo || !combo.races) {
    // 대포: 랜덤 3종족 (프프프 제외)
    const pool = ['Protoss', 'Terran', 'Zerg'];
    let result;
    do {
      // Shuffle pool and pick 3 (allows duplicates except all-Protoss)
      result = [0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]);
    } while (result.every(r => r === 'Protoss'));
    return result;
  }
  return combo.races;
}

/**
 * 초(seconds)를 'MM:SS' 형식의 문자열로 변환합니다.
 * 베팅 타이머 표시에 사용됩니다.
 * @param {number} secs - 초 단위 시간
 * @returns {string} 예: 274초 → '4:34'
 */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 매치 센터 컴포넌트입니다.
 * 진행 중인 래더 매치의 스코어, 베팅, 엔트리 제출을 한 화면에서 관리합니다.
 *
 * @param {string} matchId - 조회할 래더 매치의 UUID
 * @param {function} onExit - 뒤로가기 버튼 클릭 시 호출되는 콜백
 * @returns {JSX.Element} 매치 센터 UI
 */
export default function MatchCenter({ matchId, onExit }) {
  /** 현재 매치의 전체 데이터 (ladder_matches 테이블 레코드 + profiles 조인) */
  const [match, setMatch] = useState(null);
  /** 현재 진행 중인 세트 정보 (match_sets 중 미완료 세트) */
  const [currentSet, setCurrentSet] = useState(null);
  /** 베팅 창 남은 시간(초). 0이 되면 베팅 불가. */
  const [betTimer, setBetTimer] = useState(BET_WINDOW_SECONDS);
  /** 베팅 타이머가 활성화 상태인지 여부 */
  const [betTimerActive, setBetTimerActive] = useState(false);
  /** 현재 유저가 속한 팀 ('A' | 'B' | null). null이면 관전자. */
  const [myTeam, setMyTeam] = useState(null);
  /** 현재 로그인 유저의 ID */
  const [myUserId, setMyUserId] = useState(null);
  /** 양 팀 엔트리가 모두 제출되어 공개된 상태인지 여부 */
  const [isRevealed, setIsRevealed] = useState(false);
  /** 현재 로그인 유저의 역할 (admin/master/developer 등) */
  const [myRole, setMyRole] = useState(null);
  /** 운영진/개발자 실시간 관리모드 활성 여부 (system_settings.match_admin_live_mode) */
  const [managementMode, setManagementMode] = useState(false);
  /**
   * 팀별 작성 중 엔트리 배열 (최대 3명).
   * A/B 팀 각각 독립적으로 관리하여 시야 전환 시에도 입력 상태를 보존합니다.
   */
  const [selectedEntryByTeam, setSelectedEntryByTeam] = useState({
    A: [
      { id: '', by_id: '', race: '' },
      { id: '', by_id: '', race: '' },
      { id: '', by_id: '', race: '' },
    ],
    B: [
      { id: '', by_id: '', race: '' },
      { id: '', by_id: '', race: '' },
      { id: '', by_id: '', race: '' },
    ],
  });
  /** 베팅할 팀 ('A' | 'B' | null). null이면 미선택. */
  const [betTeam, setBetTeam] = useState(null);
  /** 베팅할 포인트 금액. null이면 미선택. */
  const [betAmount, setBetAmount] = useState(null);
  /** 이미 베팅 완료했는지 여부. true이면 베팅 UI 숨김. */
  const [bettingDone, setBettingDone] = useState(false);
  /** 베팅 API 요청 처리 중 여부 */
  const [bettingLoading, setBettingLoading] = useState(false);
  /** 현재 매치의 팀별 실시간 배팅 현황 { total_a, total_b, count_a, count_b, odds_a, odds_b } */
  const [betOdds, setBetOdds] = useState({ total_a: 0, total_b: 0, count_a: 0, count_b: 0, odds_a: 0, odds_b: 0 });
  /** 현재 유저의 보유 클랜 포인트. 베팅 가능 금액 표시 및 제한에 사용. */
  const [myClanPoint, setMyClanPoint] = useState(0);
  /** 선택된 종족 조합 ID (기본값: 프프테) */
  const [raceCombo, setRaceCombo] = useState('PPT');
  /** 종족 선택 패널 표시 여부 */
  const [showRaceSelector, setShowRaceSelector] = useState(false);
  /** 베팅 타이머 setTimeout 참조 (cleanup에 사용) */
  const setTimerRef = useRef(null);

  /**
   * 매치 데이터를 Supabase에서 불러오는 함수입니다.
   * 현재 유저의 팀 배정, 팀 멤버, 활성 세트, 베팅 타이머 잔여 시간을 계산하여 상태에 저장합니다.
   * useCallback으로 감싸 matchId 변경 시에만 재생성됩니다.
   */
  const fetchMatchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyUserId(user.id);

    const { data: m } = await supabase
      .from('ladder_matches').select('*, profiles(*)').eq('id', matchId).single();
    if (!m) return;
    setMatch(m);

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (prof) {
      setMyClanPoint(prof.clan_point ?? 0);
      setMyRole(prof.role || null);
    }

    const inTeamA = (m.team_a_ids || []).includes(user.id);
    const inTeamB = (m.team_b_ids || []).includes(user.id);
    const teamLetter = inTeamA ? 'A' : inTeamB ? 'B' : null;
    setMyTeam(teamLetter);

    const activeSet = m.match_sets?.find(s => s.status !== '완료') || m.match_sets?.[m.match_sets.length - 1];
    setCurrentSet(activeSet);

    setIsRevealed(Boolean(activeSet?.team_a_ready && activeSet?.team_b_ready));

    // 배팅 윈도우: 세트 시작 후 5분
    if (activeSet?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(activeSet.started_at).getTime()) / 1000);
      const remaining = Math.max(0, BET_WINDOW_SECONDS - elapsed);
      setBetTimer(remaining);
      setBetTimerActive(remaining > 0);
    }

    // 실시간 배당 현황 조회 (v_match_bet_odds 뷰)
    try {
      const { data: oddsData } = await supabase
        .from('v_match_bet_odds')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();
      if (oddsData) setBetOdds(oddsData);
    } catch {
      // 뷰가 아직 없는 환경에서는 무시
    }
  }, [matchId]);

  /**
   * 컴포넌트 마운트 시 매치 데이터를 불러오고 Realtime 채널을 구독합니다.
   * 해당 매치(m-{matchId})의 DB 변경이 감지될 때마다 fetchMatchData가 자동 호출됩니다.
   * 언마운트 시 채널 구독을 해제합니다.
   */
  useEffect(() => {
    void fetchMatchData();
    const channel = supabase.channel(`m-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchMatchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, fetchMatchData]);

  // 운영진/개발자 실시간 관리모드 스위치를 로드합니다.
  useEffect(() => {
    const loadManagementMode = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value_bool')
        .eq('key', 'match_admin_live_mode')
        .maybeSingle();
      setManagementMode(Boolean(data?.value_bool));
    };

    loadManagementMode().catch(() => {
      // 권한이 없거나 설정이 없는 경우 기본값(false) 유지
      setManagementMode(false);
    });
  }, []);

  const toggleManagementMode = async () => {
    const nextMode = !managementMode;

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: 'match_admin_live_mode',
          value_bool: nextMode,
          description: '운영진/개발자 매치 실시간 관리모드',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );

    if (error) {
      alert('관리모드 전환 실패: ' + error.message);
      return;
    }

    setManagementMode(nextMode);
  };

  /**
   * 베팅 타이머 카운트다운 이펙트입니다.
   * betTimerActive가 true이고 betTimer가 0보다 클 때 1초마다 1씩 감소시킵니다.
   * betTimer가 0에 도달하면 betTimerActive를 false로 설정하여 베팅 창을 닫습니다.
   */
  // 배팅 타이머 카운트다운
  useEffect(() => {
    if (!betTimerActive || betTimer <= 0) return;
    setTimerRef.current = setTimeout(() => setBetTimer(p => {
      if (p <= 1) { setBetTimerActive(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearTimeout(setTimerRef.current);
  }, [betTimer, betTimerActive]);

  const isManagementRole = ['admin', 'master', 'developer'].includes((myRole || '').trim().toLowerCase());
  const teamACaptainId = match?.team_a_ids?.[0] || null;
  const teamBCaptainId = match?.team_b_ids?.[0] || null;
  const isTeamCaptain = (myUserId && (myUserId === teamACaptainId || myUserId === teamBCaptainId)) || false;
  const canReportSetResult = Boolean(isManagementRole || isTeamCaptain);
  // 관리모드 ON → 'D팀' (양 팀 동시 시야/수정), 아니면 내 팀 또는 관전자(C)
  const perspectiveTeam = (managementMode && isManagementRole) ? 'D' : (myTeam || 'C');

  const getProfilesArray = () => (Array.isArray(match?.profiles) ? match.profiles : (match?.profiles ? [match.profiles] : []));

  const getTeamMembersByLetter = (teamLetter) => {
    const profilesArray = getProfilesArray();
    const teamIds = teamLetter === 'A' ? (match?.team_a_ids || []) : (match?.team_b_ids || []);
    return profilesArray.filter((p) => teamIds.includes(p.id));
  };

  const editingTeam = perspectiveTeam === 'A' || perspectiveTeam === 'B' ? perspectiveTeam : null;
  const selectedEntry = editingTeam ? selectedEntryByTeam[editingTeam] : [];

  const currentTeamEntry = (teamLetter) => currentSet?.[`team_${teamLetter.toLowerCase()}_entry`] || [];
  const currentTeamReady = (teamLetter) => Boolean(currentSet?.[`team_${teamLetter.toLowerCase()}_ready`]);

  /**
   * 특정 선수의 해당 매치에서의 휴식 횟수와 추가 휴식 가능 여부를 반환합니다.
   * 완료된 세트 중 해당 선수가 엔트리에 없는 세트를 휴식으로 간주합니다.
   *
   * 휴식 허용 횟수:
   *   - 4v4 이하: 매치 전체 1회
   *   - 5v5: 5세트 이전 2회, 5세트 이후 3회
   *
   * @param {string} playerId - 확인할 플레이어의 유저 ID
   * @param {'A'|'B'|null} teamLetter - 계산 기준 팀
   * @returns {{ count: number, canRest: boolean }} 휴식 횟수와 추가 휴식 가능 여부
   */
  // 휴식 횟수 계산
  const getRestStatus = (playerId, teamLetter) => {
    if (!match?.match_sets || !teamLetter) return { count: 0, canRest: true };
    const completedSets = match.match_sets.filter(s => s.status === '완료');
    const restCount = completedSets.filter(s => {
      const entry = teamLetter === 'A' ? s.team_a_entry : s.team_b_entry;
      return !entry?.some(e => e.id === playerId);
    }).length;
    const totalSets = completedSets.length;
    // 4v4: 매치 전체 1회, 5v5: 5세트까지 2회, 7세트까지 3회
    const matchType = match.match_type;
    let maxRest = 1;
    if (matchType >= 5) {
      maxRest = totalSets < 5 ? 2 : 3;
    }
    return { count: restCount, canRest: restCount < maxRest };
  };

  /**
   * 엔트리 슬롯의 선수를 선택합니다.
   * @param {number} idx - 슬롯 인덱스 (0, 1, 2)
   * @param {string} playerId - 선택한 선수의 유저 ID
   * @param {string} race - 해당 슬롯에 배정된 종족
   */
  const handleSelect = (teamLetter, idx, playerId, race) => {
    const members = getTeamMembersByLetter(teamLetter);
    const player = members.find((m) => m.id === playerId);

    setSelectedEntryByTeam((prev) => {
      const nextEntry = [...prev[teamLetter]];
      nextEntry[idx] = { id: playerId, by_id: player?.by_id || '', race };
      return { ...prev, [teamLetter]: nextEntry };
    });
  };

  /**
   * 작성한 엔트리를 match_sets 테이블에 제출합니다.
   * 상대팀도 제출하면 양 팀 엔트리가 동시에 공개됩니다(isRevealed).
   * 내 팀에 따라 team_a_ready/team_b_ready 컬럼을 true로 업데이트합니다.
   */
  const submitEntry = async (teamLetter) => {
    const team = teamLetter || editingTeam;
    if (!currentSet || !team) return;

    const column = team === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = team === 'A' ? 'team_a_entry' : 'team_b_entry';
    const reqCol = team === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    const entry = selectedEntryByTeam[team];

    const { error } = await supabase.from('match_sets').update({
      [column]: true,
      [entryCol]: entry,
      [reqCol]: false,
    }).eq('id', currentSet.id);

    if (error) {
      alert('엔트리 제출 실패: ' + error.message);
      return;
    }

    alert(managementMode && isManagementRole
      ? `${team}팀 엔트리를 관리모드로 제출했습니다.`
      : '엔트리 제출 완료! 상대방을 기다립니다.');
  };

  /** 엔트리 철회 요청 (team_X_withdraw_req = true). 세트 결과 확정 전에만 허용. */
  const requestWithdraw = async (teamLetter) => {
    if (!currentSet || currentSet.winner_team) return;
    const col = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    const { error } = await supabase.from('match_sets').update({ [col]: true }).eq('id', currentSet.id);
    if (error) alert('철회 요청 실패: ' + error.message);
  };

  /** 상대방의 철회 요청을 승인 (ready → false, withdraw_req 초기화). 승인 후 상대방이 재작성 가능. */
  const approveWithdraw = async (teamLetter) => {
    if (!currentSet || currentSet.winner_team) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    const { error } = await supabase.from('match_sets').update({
      [readyCol]: false,
      [reqCol]: false,
    }).eq('id', currentSet.id);
    if (error) alert('철회 승인 실패: ' + error.message);
  };

  /** 관리모드(D팀) 전용 강제 철회. 상대방 동의 없이 즉시 ready 초기화. */
  const forceRetract = async (teamLetter) => {
    if (!currentSet || !isManagementRole || !managementMode) return;
    const readyCol = teamLetter === 'A' ? 'team_a_ready' : 'team_b_ready';
    const reqCol = teamLetter === 'A' ? 'team_a_withdraw_req' : 'team_b_withdraw_req';
    const { error } = await supabase.from('match_sets').update({
      [readyCol]: false,
      [reqCol]: false,
    }).eq('id', currentSet.id);
    if (error) alert('강제 철회 실패: ' + error.message);
  };

  const handleSetWin = async (winnerTeam) => {
    if (!currentSet || !canReportSetResult) return;
    try {
      const { error } = await supabase
        .from('match_sets')
        .update({
          winner_team: winnerTeam,
          status: '완료',
          team_a_ready: false,
          team_b_ready: false,
          team_a_withdraw_req: false,
          team_b_withdraw_req: false,
        })
        .eq('id', currentSet.id);

      if (error) throw error;

      const needWins = Number(match?.match_type) >= 5 ? 4 : 3;
      const nextA = (match?.score_a || 0) + (winnerTeam === 'A' ? 1 : 0);
      const nextB = (match?.score_b || 0) + (winnerTeam === 'B' ? 1 : 0);
      const matchEnded = nextA >= needWins || nextB >= needWins;

      if (!matchEnded) {
        const nextSetNo = (match?.match_sets?.length || 0) + 1;
        const { error: insertErr } = await supabase
          .from('match_sets')
          .insert({
            match_id: matchId,
            set_number: nextSetNo,
            race_type: match?.match_type || '4v4',
            status: '엔트리제출중',
            race_cards: getRaceCards(raceCombo),
            team_a_ready: false,
            team_b_ready: false,
          });
        if (insertErr && !String(insertErr.message || '').includes('duplicate')) {
          throw insertErr;
        }
      }

      await fetchMatchData();
      alert(`세트 결과 반영 완료: TEAM ${winnerTeam} 승리`);
    } catch (err) {
      alert('세트 결과 반영 실패: ' + err.message);
    }
  };

  /**
   * 포인트 베팅을 처리합니다.
   * - 자신의 팀에는 베팅할 수 없습니다.
   * - match_bets 테이블에 베팅 기록을 저장합니다 (테이블 없으면 생략).
   * - profiles 테이블에서 포인트를 차감합니다.
   * - 베팅 완료 후 bettingDone을 true로 설정하여 UI를 변경합니다.
   */
  const handleBet = async () => {
    if (!betTeam || !betAmount || bettingDone || !betTimerActive) return;
    if (betTeam === myTeam) {
      alert('자신의 팀에는 베팅할 수 없습니다. 상대편에 베팅하세요.');
      return;
    }
    if (betAmount > myClanPoint) {
      alert('보유 클랜 포인트가 부족합니다.');
      return;
    }
    setBettingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 포인트 선차감 (정산 시 승리팀 배팅자에게 비율 지급, 패배팀은 몰수)
      const newBalance = myClanPoint - betAmount;
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ clan_point: newBalance })
        .eq('id', user.id);
      if (deductError) throw deductError;

      // point_logs 기록
      await supabase.from('point_logs').insert({
        user_id: user.id,
        amount: -betAmount,
        reason: `배팅 차감 (${betTeam}팀) — 매치 ${matchId}`,
        type: 'bet_deduct',
        balance_after: newBalance,
        related_id: matchId,
      }).catch(() => {});

      // match_bets 기록 (DB 컬럼: team_choice, bet_amount)
      const { error: betError } = await supabase.from('match_bets').insert({
        match_id: matchId,
        user_id: user.id,
        team_choice: betTeam,
        bet_amount: betAmount,
        status: 'pending',
      });
      if (betError) {
        // match_bets 저장 실패 시 포인트 원복
        await supabase.from('profiles').update({ clan_point: myClanPoint }).eq('id', user.id);
        throw betError;
      }

      setMyClanPoint(newBalance);
      setBettingDone(true);
      // 배당 현황 갱신
      await fetchMatchData();
      alert(`✅ ${betTeam}팀에 ${betAmount.toLocaleString()} CP 배팅 완료!\n매치 종료 후 결과에 따라 자동 정산됩니다.`);
    } catch (err) {
      alert('베팅 실패: ' + err.message);
    } finally {
      setBettingLoading(false);
    }
  };

  /** match 데이터가 아직 로드되지 않았으면 로딩 메시지를 표시합니다. */
  if (!match) {
    return <div className="py-20 text-center text-gray-500 font-mono animate-pulse">전장 진입 중...</div>;
  }

  /** 3v3 이상인 경우 래더 매치로 분류됩니다 (1v1, 2v2는 일반 게임). */
  const isLadderMatch = match.match_type >= 3;
  /** 매치 포맷 문자열. 5v5 이상은 BO7(4선승), 나머지는 BO5(3선승). */
  const matchFormat = match.match_type >= 5 ? 'BO7 (4선승)' : 'BO5 (3선승)';
  /** A팀에 베팅 가능 여부. 내가 A팀이면 베팅 불가. */
  const canBetOnA = myTeam !== 'A';
  /** B팀에 베팅 가능 여부. 내가 B팀이면 베팅 불가. */
  const canBetOnB = myTeam !== 'B';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5 font-mono">

      {/* 스코어보드 */}
      <div className="bg-[#07091a] rounded-2xl p-4 sm:p-6 flex justify-around items-center border border-yellow-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)] gap-3 sm:gap-0">
        <div className="text-center">
          <p className="text-blue-400 font-black text-xs mb-2 tracking-widest">TEAM A</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">{match.score_a}</h2>
        </div>
        <div className="text-center">
          <div className="bg-gray-900/80 px-3 sm:px-4 py-1 rounded-full border border-gray-700 text-[9px] sm:text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-widest whitespace-nowrap">
            {match.match_type}v{match.match_type} {isLadderMatch ? 'LADDER' : 'NORMAL'} — {matchFormat}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-700 italic">VS</p>
          <div className="mt-2 text-[10px] text-gray-600 uppercase tracking-wider">
            세트 {(match.match_sets?.length || 0) + 1}
          </div>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-xs mb-2 tracking-widest">TEAM B</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">{match.score_b}</h2>
        </div>
      </div>

      {/* 배팅 구역 */}
      <div className={`rounded-2xl border p-5 transition-all ${
        betTimerActive
          ? 'bg-[#0d0a00] border-yellow-600/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          : 'bg-gray-900/40 border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {betTimerActive && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping flex-shrink-0"></div>}
            <span className={`font-bold text-xs uppercase tracking-widest ${betTimerActive ? 'text-yellow-500' : 'text-gray-600'}`}>
              {betTimerActive ? '💰 베팅 창 열림' : bettingDone ? '✓ 베팅 완료' : '베팅 창 종료'}
            </span>
          </div>
          {betTimerActive && (
            <span className="text-white font-mono bg-red-700/70 px-4 py-1 rounded-full text-sm font-bold border border-red-600/40">
              {formatTime(betTimer)}
            </span>
          )}
        </div>

        {/* 실시간 배당 현황 */}
        {(betOdds.total_a > 0 || betOdds.total_b > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-center">
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3">
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">TEAM A 배팅 현황</p>
              <p className="text-white font-black text-sm">{Number(betOdds.total_a).toLocaleString()} CP</p>
              <p className="text-gray-500 text-[10px]">{betOdds.count_a}명 · 배당 <span className="text-blue-300 font-bold">{Number(betOdds.odds_a || 0).toFixed(2)}x</span></p>
            </div>
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3">
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1">TEAM B 배팅 현황</p>
              <p className="text-white font-black text-sm">{Number(betOdds.total_b).toLocaleString()} CP</p>
              <p className="text-gray-500 text-[10px]">{betOdds.count_b}명 · 배당 <span className="text-red-300 font-bold">{Number(betOdds.odds_b || 0).toFixed(2)}x</span></p>
            </div>
          </div>
        )}

        {betTimerActive && !bettingDone && (
          <>
            <p className="text-gray-500 text-xs mb-3 font-sans">
              내 포인트: <span className="text-purple-400 font-bold">{myClanPoint.toLocaleString()} CP</span>
              {myTeam && <span className="ml-3 text-gray-600">※ 자신의 팀({myTeam})에는 베팅 불가</span>}
            </p>

            {/* 팀 선택 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['A', 'B'].map(team => {
                const canBet = team === 'A' ? canBetOnA : canBetOnB;
                const selected = betTeam === team;
                const teamOdds = team === 'A' ? Number(betOdds.odds_a || 0) : Number(betOdds.odds_b || 0);
                return (
                  <button
                    key={team}
                    onClick={() => canBet && setBetTeam(team)}
                    disabled={!canBet}
                    className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${
                      selected
                        ? team === 'A'
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : 'border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                        : canBet
                          ? team === 'A'
                            ? 'border-blue-800/40 bg-blue-950/10 text-blue-600 hover:border-blue-600 hover:text-blue-400'
                            : 'border-red-800/40 bg-red-950/10 text-red-600 hover:border-red-600 hover:text-red-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-700 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {team === 'A' ? '🔵 TEAM A' : '🔴 TEAM B'}
                    {teamOdds > 0 && <div className="text-[10px] font-normal mt-0.5 opacity-70">{teamOdds.toFixed(2)}x 배당</div>}
                    {!canBet && <div className="text-[10px] font-normal mt-0.5">내 팀</div>}
                  </button>
                );
              })}
            </div>

            {/* 금액 선택 — 1,000 / 5,000 / 10,000 CP */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(betAmount === amt ? null : amt)}
                  disabled={amt > myClanPoint}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-yellow-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : amt > myClanPoint
                        ? 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed opacity-40'
                        : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400'
                  }`}
                >
                  {amt.toLocaleString()}P
                </button>
              ))}
            </div>

            <button
              onClick={handleBet}
              disabled={!betTeam || !betAmount || bettingLoading || !betTimerActive}
              className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-30 bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              {bettingLoading
                ? '처리 중...'
                : betTeam && betAmount
                  ? `${betTeam}팀에 ${betAmount.toLocaleString()}P 베팅`
                  : '팀과 금액을 선택하세요'}
            </button>
          </>
        )}

        {bettingDone && (
          <p className="text-center text-green-400 text-sm font-bold">
            ✓ {betTeam}팀에 {betAmount?.toLocaleString()}P 베팅 완료
          </p>
        )}

        {!betTimerActive && !bettingDone && (
          <p className="text-center text-gray-600 text-sm">베팅 창이 닫혔습니다 (세트 시작 5분 이내)</p>
        )}
      </div>

      {/* 엔트리 제출 구역 */}
      <div className="bg-[#0a0e1e] p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex flex-col gap-3 mb-6 border-b border-gray-700/50 pb-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h4 className="text-white font-black text-base tracking-wider">
              ROUND {match.match_sets?.length || 1} ENTRY
            </h4>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {currentSet?.race_cards?.map((r, i) => (
                <span key={i} className="w-8 h-8 bg-gray-900 border border-cyan-600/40 rounded-lg flex items-center justify-center text-cyan-400 font-black text-xs">
                  {RACE_ICONS[r] || r}
                </span>
              ))}
              {myTeam && match.score_a !== undefined && (
                <button
                  onClick={() => setShowRaceSelector(!showRaceSelector)}
                  className="ml-2 text-xs text-gray-500 hover:text-cyan-400 border border-gray-700 px-2 py-1 rounded transition-colors"
                >
                  종족 선택
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-gray-500">
            현재 시야:{' '}
            {perspectiveTeam === 'D'
              ? '운영진(D팀) — 양 팀 동시 열람·수정'
              : perspectiveTeam === 'A' ? 'A팀 엔트리 화면'
              : perspectiveTeam === 'B' ? 'B팀 엔트리 화면'
              : '관전자(C팀) 화면'}
            {!isRevealed && perspectiveTeam !== 'D' && <span className="ml-2 text-gray-600">(공개 전 상대 엔트리는 보이지 않습니다)</span>}
          </div>

          {isManagementRole && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={toggleManagementMode}
                className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-colors ${managementMode ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                실시간 관리모드 (D팀) {managementMode ? 'ON' : 'OFF'}
              </button>

              {managementMode && (
                <span className="text-[10px] text-emerald-400/70 font-sans">↔ 양 팀 엔트리 동시 열람·수정. 상대방 동의 없이 수정 가능.</span>
              )}
            </div>
          )}
        </div>

        {/* 종족 선택 패널 */}
        {showRaceSelector && (
          <div className="mb-5 p-4 rounded-xl bg-gray-900/60 border border-gray-700">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">다음 세트 종족 선택 (패배팀 선택권)</p>
            <div className="flex flex-wrap gap-2">
              {RACE_COMBOS.map(combo => (
                <button
                  key={combo.id}
                  onClick={() => { setRaceCombo(combo.id); setShowRaceSelector(false); }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                    raceCombo === combo.id
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {combo.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 팀 현황 (A/B 시야 분리 + 관전자 C 시야 + 운영진 D팀 동시 시야) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
          {['A', 'B'].map((t) => {
            // D팀(관리모드)은 공개 전에도 양 팀 엔트리 모두 열람 가능
            const canSeeEntryBeforeReveal = !isRevealed && (perspectiveTeam === t || perspectiveTeam === 'D');
            const teamEntry = currentTeamEntry(t);
            const ready = currentTeamReady(t);
            const withdrawReq = t === 'A'
              ? Boolean(currentSet?.team_a_withdraw_req)
              : Boolean(currentSet?.team_b_withdraw_req);
            const isMyTeam = myTeam === t;
            const isOpponentTeam = myTeam === (t === 'A' ? 'B' : 'A');
            const canWithdraw = ready && !currentSet?.winner_team;

            return (
              <div key={t} className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                t === 'A' ? 'border-blue-900/60 bg-blue-900/5' : 'border-red-900/60 bg-red-900/5'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <p className={`font-black text-xs tracking-widest ${t === 'A' ? 'text-blue-500' : 'text-red-500'}`}>
                    TEAM {t}
                  </p>
                  {ready && !currentSet?.winner_team && (
                    <span className="text-[9px] text-emerald-500 font-bold">✓ 제출</span>
                  )}
                </div>

                {isRevealed || canSeeEntryBeforeReveal ? (
                  <div className="space-y-2">
                    {teamEntry.length > 0 ? teamEntry.map((p, i) => (
                      <div key={i} className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-xs text-center text-white font-bold">
                        {p.by_id}
                        <span className="text-cyan-400 ml-2">({RACE_ICONS[p.race] || p.race})</span>
                      </div>
                    )) : (
                      <p className="text-center text-gray-600 text-[10px] italic">아직 제출된 엔트리가 없습니다.</p>
                    )}
                  </div>
                ) : (
                  <div className="h-20 flex flex-col items-center justify-center gap-2">
                    {ready ? (
                      <p className="text-emerald-500 font-bold text-[10px] tracking-wider">제출 완료 (비공개)</p>
                    ) : (
                      <p className="text-gray-700 italic text-[10px] animate-pulse">엔트리 작성 중...</p>
                    )}
                  </div>
                )}

                {/* 철회 요청/승인/강제 철회 버튼 (세트 결과 확정 전에만 노출) */}
                {!currentSet?.winner_team && (
                  <div className="mt-3 space-y-1.5">
                    {/* 내 팀이 제출 완료 & 철회 요청 없음 → 수정 요청 버튼 */}
                    {isMyTeam && canWithdraw && !withdrawReq && (
                      <button
                        onClick={() => requestWithdraw(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-yellow-700/60 text-yellow-500 hover:border-yellow-500 hover:text-yellow-300 transition-colors font-bold"
                      >
                        엔트리 수정 요청
                      </button>
                    )}
                    {/* 내 팀 철회 요청 대기 중 */}
                    {isMyTeam && canWithdraw && withdrawReq && (
                      <p className="text-center text-yellow-500/70 text-[10px] font-bold py-1">수정 요청 중… 상대방 승인 대기</p>
                    )}
                    {/* 상대방 철회 요청 → 승인 버튼 */}
                    {isOpponentTeam && withdrawReq && (
                      <button
                        onClick={() => approveWithdraw(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-cyan-600/60 text-cyan-400 hover:border-cyan-400 transition-colors font-bold"
                      >
                        {t}팀 수정 요청 승인
                      </button>
                    )}
                    {/* 운영진(D팀) 강제 철회 */}
                    {perspectiveTeam === 'D' && ready && (
                      <button
                        onClick={() => forceRetract(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-orange-700/50 text-orange-400 hover:border-orange-500 transition-colors font-bold"
                      >
                        강제 철회 (관리)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 엔트리 작성/수정 */}
        {/* 관리모드(D팀) — A·B 양 팀 폼 동시 표시, isRevealed 무관하게 항상 편집 가능 */}
        {managementMode && isManagementRole && !currentSet?.winner_team && (
          <div className="pt-4 border-t border-gray-700/50 space-y-4">
            <p className="text-orange-400/80 text-[10px] uppercase tracking-wider font-bold">↕ D팀 관리 — 양 팀 엔트리 직접 수정</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {['A', 'B'].map((t) => {
                const tEntry = selectedEntryByTeam[t];
                const tReady = currentTeamReady(t);
                return (
                  <div key={t} className={`space-y-2 p-3 rounded-xl border ${t === 'A' ? 'border-blue-800/40' : 'border-red-800/40'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${t === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                      {t}팀 엔트리 {tReady ? '(제출됨 — 강제 수정)' : '관리'}
                    </p>
                    {(currentSet?.race_cards || getRaceCards(raceCombo)).map((race, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                        <div className="w-7 h-6 bg-gray-900 rounded flex items-center justify-center text-yellow-500 font-black border border-yellow-600/30 text-[10px] shrink-0">
                          {RACE_ICONS[race] || race}
                        </div>
                        <select
                          className="flex-1 bg-transparent text-white text-xs outline-none cursor-pointer font-bold"
                          value={tEntry[idx]?.id || ''}
                          onChange={(e) => handleSelect(t, idx, e.target.value, race)}
                        >
                          <option value="" className="bg-gray-900">선수 선택</option>
                          {getTeamMembersByLetter(t).map((member) => {
                            const { count, canRest } = getRestStatus(member.id, t);
                            const isAlreadySelected = tEntry.some((se, i) => i !== idx && se.id === member.id);
                            return (
                              <option key={member.id} value={member.id} disabled={isAlreadySelected || !canRest} className="bg-gray-900">
                                {member.by_id} ({count}회){isAlreadySelected ? ' [이미선택]' : ''}{!canRest ? ' [한도]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                    <button
                      onClick={() => submitEntry(t)}
                      disabled={tEntry.some((e) => !e.id)}
                      className={`w-full py-2 rounded-lg font-black text-xs disabled:opacity-25 transition-all ${t === 'A' ? 'bg-blue-800 hover:bg-blue-700 text-white' : 'bg-red-800 hover:bg-red-700 text-white'}`}
                    >
                      {tEntry.every((e) => e.id) ? `${t}팀 제출 →` : '선수 배치 필요'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 일반 플레이어 — 내 팀 엔트리 작성 (미제출 또는 철회 승인 후 재작성) */}
        {!managementMode && !isRevealed && editingTeam && !currentTeamReady(editingTeam) && (
          <div className="space-y-3 pt-4 border-t border-gray-700/50">
            <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">내 팀 엔트리 작성</p>
            {(currentSet?.race_cards || getRaceCards(raceCombo)).map((race, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="w-10 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-yellow-500 font-black border border-yellow-600/30 text-sm shrink-0">
                  {RACE_ICONS[race] || race}
                </div>
                <select
                  className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer font-bold"
                  value={selectedEntry[idx]?.id || ''}
                  onChange={(e) => handleSelect(editingTeam, idx, e.target.value, race)}
                >
                  <option value="" className="bg-gray-900">선수 선택</option>
                  {getTeamMembersByLetter(editingTeam).map((member) => {
                    const { count, canRest } = getRestStatus(member.id, editingTeam);
                    const isAlreadySelected = selectedEntry.some((se, i) => i !== idx && se.id === member.id);
                    return (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={isAlreadySelected || !canRest}
                        className="bg-gray-900"
                      >
                        {member.by_id} (휴식: {count}회)
                        {isAlreadySelected ? ' [선택됨]' : ''}
                        {!canRest ? ' [휴식 한도]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
            <button
              onClick={() => submitEntry(editingTeam)}
              disabled={selectedEntry.some((e) => !e.id)}
              className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-xl shadow-xl disabled:opacity-25 active:scale-98 transition-all text-sm tracking-wider"
            >
              {selectedEntry.every((e) => e.id) ? '엔트리 최종 제출 →' : '모든 슬롯에 선수를 배치하세요'}
            </button>
          </div>
        )}

        {canReportSetResult && (
          <div className="mt-5 pt-4 border-t border-gray-700/50">
            <p className="text-[10px] text-orange-400 font-bold mb-2 uppercase tracking-wider">
              {isManagementRole ? '운영진 세트 결과 처리' : '팀 캡틴 세트 결과 처리'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleSetWin('A')}
                disabled={!currentSet || currentSet?.status === '완료'}
                className="py-2 rounded-lg bg-blue-900/50 border border-blue-700 text-blue-300 font-bold text-xs disabled:opacity-30"
              >
                TEAM A 세트 승리 확정
              </button>
              <button
                onClick={() => handleSetWin('B')}
                disabled={!currentSet || currentSet?.status === '완료'}
                className="py-2 rounded-lg bg-red-900/50 border border-red-700 text-red-300 font-bold text-xs disabled:opacity-30"
              >
                TEAM B 세트 승리 확정
              </button>
            </div>
            {!isManagementRole && (
              <p className="text-[10px] text-gray-500 mt-2">
                팀 캡틴만 세트 결과를 확정할 수 있습니다. (A팀 캡틴: 첫 번째 A팀 인원, B팀 캡틴: 첫 번째 B팀 인원)
              </p>
            )}
          </div>
        )}
      </div>

      {/* 뒤로 버튼 */}
      <button
        onClick={onExit}
        className="w-full py-4 bg-gray-900/60 text-gray-600 text-xs font-bold rounded-xl hover:text-gray-400 hover:bg-gray-900 transition-colors uppercase tracking-widest border border-gray-800"
      >
        ← 래더 로비로 돌아가기
      </button>
    </div>
  );
}
