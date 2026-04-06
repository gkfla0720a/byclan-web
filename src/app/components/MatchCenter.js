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

/** 베팅 가능한 포인트 단위 목록 (가장 작은 단위부터 큰 단위 순) */
const BET_AMOUNTS = [100, 500, 1000, 5000, 10000];
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
  /** 내 팀 멤버 목록 (엔트리 선택 드롭다운에 사용) */
  const [teamMembers, setTeamMembers] = useState([]);
  /**
   * 내가 작성 중인 엔트리 배열 (최대 3명).
   * 각 슬롯: { id: 유저ID, ByID: 닉네임, race: 종족 }
   */
  const [selectedEntry, setSelectedEntry] = useState([
    { id: '', ByID: '', race: '' },
    { id: '', ByID: '', race: '' },
    { id: '', ByID: '', race: '' }
  ]);
  /** 베팅할 팀 ('A' | 'B' | null). null이면 미선택. */
  const [betTeam, setBetTeam] = useState(null);
  /** 베팅할 포인트 금액. null이면 미선택. */
  const [betAmount, setBetAmount] = useState(null);
  /** 이미 베팅 완료했는지 여부. true이면 베팅 UI 숨김. */
  const [bettingDone, setBettingDone] = useState(false);
  /** 베팅 API 요청 처리 중 여부 */
  const [bettingLoading, setBettingLoading] = useState(false);
  /** 현재 유저의 보유 포인트. 베팅 가능 금액 표시 및 제한에 사용. */
  const [myPoints, setMyPoints] = useState(0);
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
      .from('profiles').select('points').eq('id', user.id).single();
    if (prof) setMyPoints(prof.points || 0);

    const inTeamA = (m.team_a_ids || []).includes(user.id);
    const inTeamB = (m.team_b_ids || []).includes(user.id);
    const teamLetter = inTeamA ? 'A' : inTeamB ? 'B' : null;
    setMyTeam(teamLetter);

    const myTeamIds = teamLetter === 'A' ? (m.team_a_ids || []) : (m.team_b_ids || []);
    setTeamMembers((m.profiles || []).filter(p => myTeamIds.includes(p.id)));

    const activeSet = m.match_sets?.find(s => s.status !== '완료') || m.match_sets?.[m.match_sets.length - 1];
    setCurrentSet(activeSet);

    if (activeSet?.team_a_ready && activeSet?.team_b_ready) setIsRevealed(true);

    // 배팅 윈도우: 세트 시작 후 5분
    if (activeSet?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(activeSet.started_at).getTime()) / 1000);
      const remaining = Math.max(0, BET_WINDOW_SECONDS - elapsed);
      setBetTimer(remaining);
      setBetTimerActive(remaining > 0);
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

  /**
   * 특정 선수의 해당 매치에서의 휴식 횟수와 추가 휴식 가능 여부를 반환합니다.
   * 완료된 세트 중 해당 선수가 엔트리에 없는 세트를 휴식으로 간주합니다.
   *
   * 휴식 허용 횟수:
   *   - 4v4 이하: 매치 전체 1회
   *   - 5v5: 5세트 이전 2회, 5세트 이후 3회
   *
   * @param {string} playerId - 확인할 플레이어의 유저 ID
   * @returns {{ count: number, canRest: boolean }} 휴식 횟수와 추가 휴식 가능 여부
   */
  // 휴식 횟수 계산
  const getRestStatus = (playerId) => {
    if (!match?.match_sets || !myTeam) return { count: 0, canRest: true };
    const completedSets = match.match_sets.filter(s => s.status === '완료');
    const restCount = completedSets.filter(s => {
      const entry = myTeam === 'A' ? s.team_a_entry : s.team_b_entry;
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
  const handleSelect = (idx, playerId, race) => {
    const player = teamMembers.find(m => m.id === playerId);
    const newEntry = [...selectedEntry];
    newEntry[idx] = { id: playerId, ByID: player?.ByID || '', race };
    setSelectedEntry(newEntry);
  };

  /**
   * 작성한 엔트리를 match_sets 테이블에 제출합니다.
   * 상대팀도 제출하면 양 팀 엔트리가 동시에 공개됩니다(isRevealed).
   * 내 팀에 따라 team_a_ready/team_b_ready 컬럼을 true로 업데이트합니다.
   */
  const submitEntry = async () => {
    if (!currentSet || !myTeam) return;
    const column = myTeam === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = myTeam === 'A' ? 'team_a_entry' : 'team_b_entry';
    const { error } = await supabase.from('match_sets').update({
      [column]: true,
      [entryCol]: selectedEntry,
    }).eq('id', currentSet.id);
    if (error) alert('엔트리 제출 실패: ' + error.message);
    else alert('엔트리 제출 완료! 상대방을 기다립니다.');
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
    setBettingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 베팅 기록 먼저 시도 (match_bets 테이블이 없으면 skip하고 포인트만 차감)
      const { error: betError } = await supabase.from('match_bets').insert({
        match_id: matchId,
        user_id: user.id,
        bet_team: betTeam,
        amount: betAmount,
      });
      // 테이블이 없어도 포인트 차감은 진행 (베타 환경 대응)
      if (betError && !betError.message?.includes('does not exist') && !betError.code?.startsWith('42')) {
        throw betError;
      }

      // 포인트 차감
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ points: myPoints - betAmount })
        .eq('id', user.id);
      if (deductError) throw deductError;

      setMyPoints(p => p - betAmount);
      setBettingDone(true);
      alert(`${betTeam}팀에 ${betAmount.toLocaleString()}P 베팅 완료!`);
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
      <div className="bg-[#07091a] rounded-2xl p-6 flex justify-around items-center border border-yellow-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
        <div className="text-center">
          <p className="text-blue-400 font-black text-xs mb-2 tracking-widest">TEAM A</p>
          <h2 className="text-6xl font-black text-white drop-shadow-lg">{match.score_a}</h2>
        </div>
        <div className="text-center">
          <div className="bg-gray-900/80 px-4 py-1 rounded-full border border-gray-700 text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-widest">
            {match.match_type}v{match.match_type} {isLadderMatch ? 'LADDER' : 'NORMAL'} — {matchFormat}
          </div>
          <p className="text-3xl font-black text-gray-700 italic">VS</p>
          <div className="mt-2 text-[10px] text-gray-600 uppercase tracking-wider">
            세트 {(match.match_sets?.length || 0) + 1}
          </div>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-xs mb-2 tracking-widest">TEAM B</p>
          <h2 className="text-6xl font-black text-white drop-shadow-lg">{match.score_b}</h2>
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

        {betTimerActive && !bettingDone && (
          <>
            <p className="text-gray-500 text-xs mb-3 font-sans">
              내 포인트: <span className="text-purple-400 font-bold">{myPoints.toLocaleString()} CP</span>
              {myTeam && <span className="ml-3 text-gray-600">※ 자신의 팀({myTeam})에는 베팅 불가</span>}
            </p>

            {/* 팀 선택 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['A', 'B'].map(team => {
                const canBet = team === 'A' ? canBetOnA : canBetOnB;
                const selected = betTeam === team;
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
                    {!canBet && <div className="text-[10px] font-normal mt-0.5">내 팀</div>}
                  </button>
                );
              })}
            </div>

            {/* 금액 선택 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(betAmount === amt ? null : amt)}
                  disabled={amt > myPoints}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-yellow-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : amt > myPoints
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
      <div className="bg-[#0a0e1e] p-6 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700/50 pb-4">
          <h4 className="text-white font-black text-base tracking-wider">
            ROUND {match.match_sets?.length || 1} ENTRY
          </h4>
          <div className="flex items-center gap-2">
            {/* 종족 카드 표시 */}
            {currentSet?.race_cards?.map((r, i) => (
              <span key={i} className="w-8 h-8 bg-gray-900 border border-cyan-600/40 rounded-lg flex items-center justify-center text-cyan-400 font-black text-xs">
                {RACE_ICONS[r] || r}
              </span>
            ))}
            {/* 패배팀이 다음 종족 선택 */}
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

        {/* 종족 선택 패널 (패배팀 권한) */}
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

        {/* 팀 현황 */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {['A', 'B'].map(t => (
            <div key={t} className={`p-4 rounded-xl border-2 border-dashed transition-all ${
              t === 'A' ? 'border-blue-900/60 bg-blue-900/5' : 'border-red-900/60 bg-red-900/5'
            }`}>
              <p className={`text-center font-black text-xs mb-3 tracking-widest ${t === 'A' ? 'text-blue-500' : 'text-red-500'}`}>
                TEAM {t}
              </p>
              {isRevealed ? (
                <div className="space-y-2">
                  {currentSet?.[`team_${t.toLowerCase()}_entry`]?.map((p, i) => (
                    <div key={i} className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-xs text-center text-white font-bold">
                      {p.ByID}
                      <span className="text-cyan-400 ml-2">({RACE_ICONS[p.race] || p.race})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center gap-2">
                  {currentSet?.[`team_${t.toLowerCase()}_ready`] ? (
                    <>
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-emerald-500 font-bold text-[10px] tracking-wider">제출 완료</p>
                    </>
                  ) : (
                    <p className="text-gray-700 italic text-[10px] animate-pulse">엔트리 작성 중...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 내 엔트리 작성 */}
        {!isRevealed && !currentSet?.[`team_${myTeam?.toLowerCase()}_ready`] && myTeam && (
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
                  onChange={e => handleSelect(idx, e.target.value, race)}
                >
                  <option value="" className="bg-gray-900">선수 선택</option>
                  {teamMembers.map(member => {
                    const { count, canRest } = getRestStatus(member.id);
                    const isAlreadySelected = selectedEntry.some((se, i) => i !== idx && se.id === member.id);
                    return (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={isAlreadySelected || !canRest}
                        className="bg-gray-900"
                      >
                        {member.ByID} (휴식: {count}회)
                        {isAlreadySelected ? ' [선택됨]' : ''}
                        {!canRest ? ' [휴식 한도]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
            <button
              onClick={submitEntry}
              disabled={selectedEntry.some(e => !e.id)}
              className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-xl shadow-xl disabled:opacity-25 active:scale-98 transition-all text-sm tracking-wider"
            >
              {selectedEntry.every(e => e.id) ? '엔트리 최종 제출 →' : '모든 슬롯에 선수를 배치하세요'}
            </button>
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
