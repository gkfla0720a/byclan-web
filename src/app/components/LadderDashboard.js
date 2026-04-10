/**
 * 파일명: LadderDashboard.js
 *
 * 역할:
 *   ByClan 래더 시스템의 메인 대시보드 컴포넌트입니다.
 *   클랜원이 매칭 대기열에 참가하고, 매치를 제안하며, 진행 중인 경기를 확인할 수 있습니다.
 *
 * 주요 기능:
 *   - 실시간 매칭 대기열 표시 (Supabase Realtime 구독)
 *   - 대기열 참가 / 취소 (최대 20분 자동 타임아웃)
 *   - 팀 자동 배분 (밸런스 / 상픽 / 하픽 옵션)
 *   - 매치 시작 제안 및 동의/거절 팝업 (ConsentPopup)
 *   - 12명 이상일 때 두 경기 동시 제안 (TwoMatchSuggestion)
 *   - 5v5 경고 모달
 *   - 진행 중인 래더 매치 목록 표시
 *
 * 사용 방법:
 *   <LadderDashboard
 *     onMatchEnter={(matchId) => { ... }}
 *   />
 *
 *   - onMatchEnter: 매치에 입장할 때 호출되는 콜백 (matchId 전달)
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { filterVisibleTestAccounts, filterVisibleTestData } from '@/app/utils/testData';

// ── 상수 ─────────────────────────────────────────────────────────────
/** 지원하는 매치 유형 정보. 키는 선택 값, 값은 레이블·최소 인원·포맷 등을 담습니다. */
const MATCH_TYPES = {
  '3v3': { label: '3대3', minPlayers: 6, perTeam: 3, isLadder: true, format: 'BO5 (3선승)' },
  '4v4': { label: '4대4', minPlayers: 8, perTeam: 4, isLadder: true, format: 'BO5 (3선승)' },
  '5v5': { label: '5대5', minPlayers: 10, perTeam: 5, isLadder: true, format: 'BO7 (4선승)', warning: true },
  '1v1': { label: '1대1', minPlayers: 2, perTeam: 1, isLadder: false, format: '일반게임' },
  '2v2': { label: '2대2', minPlayers: 4, perTeam: 2, isLadder: false, format: '일반게임' },
};

/** 팀 MMR 차이가 이 값(200점)을 초과하면 불균형 경고를 표시합니다. */
const BALANCE_THRESHOLD = 200;
/** 대기열 최대 대기 시간(분). 이 시간이 지나면 자동으로 대기열에서 제거됩니다. */
const MAX_QUEUE_MINUTES = 20;
/** 매치 제안 동의/거절 팝업에서 카운트다운 시작 시간(초) */
const PROPOSAL_CONSENT_SECONDS = 40;
/**
 * 매치 제안 실패(거절) 시 적용되는 쿨다운 시간 단계(초)
 * 첫 번째 실패: 0초, 두 번째: 10초, 세 번째: 30초, 네 번째 이상: 180초
 */
const COOLDOWN_STEPS = [0, 10, 30, 180];

/** 티어별 텍스트 색상 클래스 (Tailwind CSS) */
const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Master: 'text-purple-400', Diamond: 'text-blue-400', Platinum: 'text-cyan-400',
  Gold: 'text-yellow-400', Silver: 'text-gray-400', Bronze: 'text-orange-700',
};

/**
 * MMR 포인트로 티어 이름을 반환합니다.
 * @param {number} pts - 플레이어의 MMR 포인트
 * @returns {string} 티어 이름
 */
function getTier(pts) {
  if (pts >= 2400) return 'Challenger';
  if (pts >= 2200) return 'Master';
  if (pts >= 1900) return 'Diamond';
  if (pts >= 1600) return 'Platinum';
  if (pts >= 1350) return 'Gold';
  if (pts >= 1100) return 'Silver';
  return 'Bronze';
}

/**
 * 종족 영문명을 한글 약자로 변환합니다.
 * @param {string} race - 종족 이름
 * @returns {string} 한글 약자 ('테', '프', '저', '랜') 또는 '?'
 */
function getRaceIcon(race) {
  const icons = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return icons[race] || '?';
}

/**
 * 대기열 플레이어 배열을 두 팀으로 분배합니다.
 *
 * @param {Array} players - 대기열 플레이어 목록
 * @param {number} perTeam - 팀당 인원 수
 * @param {string} sortOption - 팀 구성 방식
 *   - 'balance': MMR 교차 배분 (뱀 드래프트 방식, 가장 균형적)
 *   - 'top': 상위 MMR 순으로 A팀, 나머지 B팀
 *   - 'bottom': 하위 MMR 순으로 A팀, 나머지 B팀
 * @returns {{ teamA: Array, teamB: Array } | null} 두 팀 객체 또는 인원 부족 시 null
 */
function buildTeams(players, perTeam, sortOption) {
  if (players.length < perTeam * 2) return null;
  const pool = [...players].slice(0, perTeam * 2);
  if (sortOption === 'balance') {
    const sorted = [...pool].sort((a, b) => (b.Clan_Point || 1000) - (a.Clan_Point || 1000));
    const teamA = [], teamB = [];
    sorted.forEach((p, i) => { if (i % 2 === 0) teamA.push(p); else teamB.push(p); });
    return { teamA, teamB };
  }
  if (sortOption === 'top') {
    const sorted = [...pool].sort((a, b) => (b.Clan_Point || 1000) - (a.Clan_Point || 1000));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
  if (sortOption === 'bottom') {
    const sorted = [...pool].sort((a, b) => (a.Clan_Point || 1000) - (b.Clan_Point || 1000));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
  return buildTeams(players, perTeam, 'balance');
}

/**
 * 매치 시작 제안 시 표시되는 동의/거절 팝업 컴포넌트입니다.
 * PROPOSAL_CONSENT_SECONDS(40초) 카운트다운 후 자동으로 거절 처리됩니다.
 *
 * @param {object} proposal - 제안된 매치 정보 (팀 구성, 매치 타입 등)
 * @param {string} myUserId - 현재 로그인 유저의 ID
 * @param {function} onAccept - 동의 버튼 클릭 시 호출되는 콜백
 * @param {function} onReject - 거절 또는 시간 초과 시 호출되는 콜백
 */
// ── 매치 동의 팝업 ────────────────────────────────────────────────────
function ConsentPopup({ proposal, myUserId, onAccept, onReject }) {
  /** 남은 동의 시간(초). 0이 되면 자동 거절됩니다. */
  const [timeLeft, setTimeLeft] = useState(PROPOSAL_CONSENT_SECONDS);
  /** 거절 처리 여부. true이면 UI가 회색으로 변하고 닫힘 안내가 표시됩니다. */
  const [rejected, setRejected] = useState(false);

  /**
   * 1초마다 timeLeft를 감소시킵니다.
   * timeLeft가 0이 되거나 이미 거절 상태면 onReject()를 호출합니다.
   */
  useEffect(() => {
    if (timeLeft <= 0 && !rejected) { onReject(); return; }
    if (rejected) return;
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, rejected, onReject]);

  const handleReject = () => {
    setRejected(true);
    setTimeout(() => onReject(), 1800);
  };

  const isProposer = proposal.proposedBy === myUserId;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className={`relative max-w-md w-full mx-4 rounded-2xl border-2 p-8 transition-all duration-500 ${
        rejected
          ? 'border-gray-700 bg-gray-900 grayscale'
          : 'border-blue-500 bg-[#0a0f1e] shadow-[0_0_40px_rgba(59,130,246,0.4)]'
      }`}>
        <div className="flex justify-center mb-6">
          <div className={`relative w-20 h-20 ${rejected ? 'opacity-30' : ''}`}>
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e3a5f" strokeWidth="6" />
              <circle
                cx="40" cy="40" r={radius} fill="none"
                stroke={rejected ? '#6b7280' : '#3b82f6'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timeLeft / PROPOSAL_CONSENT_SECONDS)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-black text-xl ${rejected ? 'text-gray-600' : 'text-blue-400'}`}>
              {rejected ? '✕' : timeLeft}
            </div>
          </div>
        </div>

        <h3 className={`text-center font-black text-xl mb-2 ${rejected ? 'text-gray-500' : 'text-white'}`}>
          {rejected ? '매치 거절됨' : '⚡ 매치 시작 제안!'}
        </h3>
        <p className={`text-center text-sm mb-1 ${rejected ? 'text-gray-600' : 'text-gray-300'}`}>
          {proposal.matchType} 레더 매치
        </p>

        {!rejected && (
          <>
            <div className="grid grid-cols-2 gap-3 my-5">
              {['A', 'B'].map(team => (
                <div key={team} className={`p-3 rounded-xl border ${team === 'A' ? 'border-blue-800 bg-blue-950/20' : 'border-red-800 bg-red-950/20'}`}>
                  <p className={`text-xs font-bold mb-2 text-center ${team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>TEAM {team}</p>
                  {(team === 'A' ? proposal.teamA : proposal.teamB).map(p => (
                    <div key={p.id} className="text-xs text-gray-300 truncate flex items-center gap-1 mb-1">
                      <span className="text-cyan-600 w-4 text-center">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate">{p.ByID || <span className="text-red-400 text-[10px]">[ByID 없음]</span>}</span>
                      <span className="text-yellow-500 text-[10px]">{p.Clan_Point || 1000}점</span>
                    </div>
                  ))}
                  <div className={`text-center text-[10px] mt-1 font-bold ${team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                    평균 MMR {Math.round(team === 'A' ? proposal.avgA : proposal.avgB)}점
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-center text-xs mb-5 ${proposal.diff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
              팀 MMR 차이: {Math.round(proposal.diff)}점
              {proposal.diff > BALANCE_THRESHOLD && ' ⚠️ 200점 초과 — 불균형 주의'}
            </div>
            <p className="text-center text-xs text-gray-500 mb-6">
              {isProposer ? '상대방의 동의를 기다리고 있습니다...' : '매치 시작에 동의하시겠습니까?'}
            </p>
            <div className="flex gap-3">
              {!isProposer && (
                <button
                  onClick={onAccept}
                  className="flex-1 py-3 font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                >
                  ✓ 동의
                </button>
              )}
              <button
                onClick={handleReject}
                className={`${isProposer ? 'w-full' : 'flex-1'} py-3 font-black rounded-xl border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition-colors`}
              >
                {isProposer ? '제안 취소' : '✗ 거절'}
              </button>
            </div>
          </>
        )}
        {rejected && (
          <div className="text-center text-gray-600 text-sm mt-4 animate-pulse">잠시 후 닫힙니다...</div>
        )}
      </div>
    </div>
  );
}

/**
 * 대기열에 12명 이상일 때, 상위/하위 두 그룹으로 나눠 동시에 두 경기를 제안하는 컴포넌트입니다.
 * 각 경기마다 팀 구성 정렬 방식을 독립적으로 선택할 수 있습니다.
 *
 * @param {Array} players - 전체 대기열 플레이어 목록
 * @param {function} onSelectMatch - 매치를 선택했을 때 호출되는 콜백. {teamA, teamB} 전달.
 */
// ── 12명+ 두 팀 분리 제안 ─────────────────────────────────────────────
function TwoMatchSuggestion({ players, onSelectMatch }) {
  /** 상위 매치의 팀 구성 정렬 방식 ('balance' | 'top' | 'bottom') */
  const [sortA, setSortA] = useState('balance');
  /** 하위 매치의 팀 구성 정렬 방식 ('balance' | 'top' | 'bottom') */
  const [sortB, setSortB] = useState('balance');
  const perTeam = 3;
  const sorted = [...players].sort((a, b) => (b.Clan_Point || 1000) - (a.Clan_Point || 1000));
  const half = Math.floor(sorted.length / 2);
  const upperPool = sorted.slice(0, half);
  const lowerPool = sorted.slice(half);
  const match1 = buildTeams(upperPool, perTeam, sortA);
  const match2 = buildTeams(lowerPool, perTeam, sortB);
  const calcAvg = (team) => (team && team.length > 0) ? team.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / team.length : 0;
  const diff1 = match1 ? Math.abs(calcAvg(match1.teamA) - calcAvg(match1.teamB)) : 0;
  const diff2 = match2 ? Math.abs(calcAvg(match2.teamA) - calcAvg(match2.teamB)) : 0;
  const SORT_OPTIONS = [
    { value: 'top', label: '상픽 우선' },
    { value: 'balance', label: '밸런스 우선' },
    { value: 'bottom', label: '하픽 우선' },
  ];
  return (
    <div className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-950/10">
      <p className="text-purple-400 text-xs font-bold mb-3 uppercase tracking-wider">⚡ 두 경기 동시 진행 제안 (12명+)</p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '상위 매치', sort: sortA, setSort: setSortA, teams: match1, diff: diff1, color: 'yellow' },
          { label: '하위 매치', sort: sortB, setSort: setSortB, teams: match2, diff: diff2, color: 'cyan' },
        ].map(({ label, sort, setSort, teams: t, diff, color }) => (
          <div key={label} className="p-3 rounded-lg border border-gray-700 bg-gray-900/40">
            <p className={`text-${color}-400 text-xs font-bold mb-2`}>{label}</p>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1 mb-2 outline-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {t && (
              <div className="space-y-0.5 text-[10px]">
                <div className="text-blue-400">A: {t.teamA.map(p => p.ByID || '[ByID 없음]').join(', ')}</div>
                <div className="text-red-400">B: {t.teamB.map(p => p.ByID || '[ByID 없음]').join(', ')}</div>
                <div className={diff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}>
                  차이: {Math.round(diff)}점 {diff > BALANCE_THRESHOLD ? '⚠️' : '✓'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => match1 && onSelectMatch(match1)}
        className="mt-3 w-full py-2 text-xs font-bold rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-950/30 transition-colors"
      >
        이 구성으로 상위 매치 제안
      </button>
    </div>
  );
}

/**
 * 래더 대시보드 메인 컴포넌트입니다.
 * 대기열 현황, 팀 밸런스 미리보기, 매치 제안/동의, 진행 중 매치 목록을 통합 제공합니다.
 *
 * @param {function} onMatchEnter - 매치에 입장할 때 호출되는 콜백 (matchId: string 전달)
 * @returns {JSX.Element} 래더 대시보드 UI
 */
// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function LadderDashboard({ onMatchEnter }) {
  /** 현재 로그인한 Supabase 유저 객체. 비로그인 상태면 null. */
  const [user, setUser] = useState(null);
  /** 현재 유저의 profiles 테이블 데이터 (닉네임, 종족, MMR 등) */
  const [myProfile, setMyProfile] = useState(null);
  /** 현재 유저의 ladders 테이블 통계 데이터 (승/패 등). 없을 수 있음. */
  const [myStats, setMyStats] = useState(null);
  /** 현재 대기열에 있는 플레이어 목록 (참가 시간 오름차순 정렬) */
  const [queuePlayers, setQueuePlayers] = useState([]);
  /** 진행 중(진행중/제안중) 래더 매치 목록 (최대 8개) */
  const [ongoingMatches, setOngoingMatches] = useState([]);
  /** 최초 데이터 로딩 여부. true이면 로딩 화면 표시. */
  const [loading, setLoading] = useState(true);
  /** 내가 현재 대기열에 있는지 여부 */
  const [inQueue, setInQueue] = useState(false);
  /** 현재 선택된 매치 유형 (예: '4v4') */
  const [queueMatchType, setQueueMatchType] = useState('4v4');
  /** 대기열 참가 API 요청 처리 중 여부 */
  const [joiningQueue, setJoiningQueue] = useState(false);
  /** 팀 구성 정렬 방식 ('balance' | 'top' | 'bottom') */
  const [sortOption, setSortOption] = useState('balance');
  /** 현재 활성화된 매치 제안 정보. null이면 팝업 미표시. */
  const [activeProposal, setActiveProposal] = useState(null);
  /** 매치 제안 재시도 쿨다운 남은 시간(초). 0이면 즉시 제안 가능. */
  const [proposalCooldown, setProposalCooldown] = useState(0);
  /** 매치 제안 시도 횟수 (쿨다운 단계 계산에 사용) */
  const [proposalAttempts, setProposalAttempts] = useState(0);
  /** 5v5 경고 모달 표시 여부 */
  const [show5v5Warning, setShow5v5Warning] = useState(false);
  /** 5v5 경고를 확인하고 동의했는지 여부 */
  const [accepted5v5, setAccepted5v5] = useState(false);
  /** 진행 중 매치에 참여한 플레이어 프로필 조회 맵 (userId → profile) */
  const [matchProfiles, setMatchProfiles] = useState({});
  /** 쿨다운 카운트다운 타이머 참조 (clearTimeout에 사용) */
  const cooldownTimerRef = useRef(null);
  /** 대기열 자동 이탈 타이머 참조 (MAX_QUEUE_MINUTES 후 자동 취소) */
  const queueTimerRef = useRef(null);
  /** 대기열 이탈 함수에서 최신 유저 ID를 참조하기 위한 ref (클로저 문제 방지) */
  const currentUserRef = useRef(null);
  /** 대기열 인원 변경 감지용 - 플레이어 ID 목록의 이전 상태를 저장 */
  const lastQueueKeyRef = useRef('');

  /**
   * Supabase에서 모든 필요 데이터를 한꺼번에 조회하는 함수입니다.
   * - 현재 유저 정보 및 프로필
   * - 래더 통계 (ladders 테이블)
   * - 대기열 플레이어 목록
   * - 진행 중인 매치 목록
   * - 내가 포함된 활성 제안(activeProposal) 여부
   * useCallback으로 감싸 불필요한 재생성을 방지합니다.
   */
  const fetchData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      currentUserRef.current = authUser;

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single();
      if (profile) {
        setMyProfile(profile);
        setInQueue(profile.is_in_queue || false);
      }

      const { data: stats } = await supabase
        .from('ladders').select('*').eq('user_id', authUser.id).maybeSingle();
      if (stats) setMyStats(stats);

      const { data: queue } = await filterVisibleTestAccounts(supabase
        .from('profiles')
        .select('id, ByID, race, Clan_Point, role, is_in_queue, queue_joined_at')
        .eq('is_in_queue', true)
        .order('queue_joined_at', { ascending: true }));
      const qPlayers = queue || [];
      setQueuePlayers(qPlayers);

      // 대기열 인원 변경 시 쿨다운 리셋
      const newKey = qPlayers.map(p => p.id).sort().join(',');
      if (lastQueueKeyRef.current && lastQueueKeyRef.current !== newKey) {
        setProposalAttempts(0);
        setProposalCooldown(0);
        clearTimeout(cooldownTimerRef.current);
      }
      lastQueueKeyRef.current = newKey;

      const { data: ongoing } = await filterVisibleTestData(supabase
        .from('ladder_matches')
        .select('*')
        .in('status', ['진행중', '제안중'])
        .order('created_at', { ascending: false })
        .limit(8));
      const ongoingList = ongoing || [];
      setOngoingMatches(ongoingList);

      // 진행 중인 매치 참여 선수 프로필을 별도 조회 (host_id FK 조인은 팀원 정보를 제공하지 않음)
      const allTeamIds = [...new Set(
        ongoingList.flatMap(m => [...(m.team_a_ids || []), ...(m.team_b_ids || [])])
      )];
      let profMap = {};
      if (allTeamIds.length > 0) {
        const { data: teamProfs } = await supabase
          .from('profiles')
          .select('id, ByID, Clan_Point')
          .in('id', allTeamIds);
        profMap = Object.fromEntries((teamProfs || []).map(p => [p.id, p]));
      }
      setMatchProfiles(profMap);

      // 내가 포함된 제안 확인
      const myProposal = ongoingList.find(m =>
        m.status === '제안중' &&
        [...(m.team_a_ids || []), ...(m.team_b_ids || [])].includes(authUser.id)
      );
      if (myProposal) {
        const resolveProf = (id) => ({
          id,
          ByID: profMap[id]?.ByID,

          Clan_Point: profMap[id]?.Clan_Point || 1000,
        });
        const teamA = (myProposal.team_a_ids || []).map(resolveProf);
        const teamB = (myProposal.team_b_ids || []).map(resolveProf);
        const avgA = teamA.length ? teamA.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teamA.length : 1000;
        const avgB = teamB.length ? teamB.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teamB.length : 1000;
        setActiveProposal(prev => prev?.matchId === myProposal.id ? prev : {
          matchId: myProposal.id,
          matchType: `${myProposal.match_type}v${myProposal.match_type}`,
          teamA, teamB, avgA, avgB,
          diff: Math.abs(avgA - avgB),
          proposedBy: myProposal.created_by,
        });
      } else {
        setActiveProposal(prev => prev ? null : prev);
      }
    } catch (err) {
      console.error('래더 대시보드 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 컴포넌트 마운트 시 데이터를 불러오고, Supabase Realtime 채널을 구독합니다.
   * profiles 또는 ladder_matches 테이블에 변경이 있을 때마다 fetchData가 자동 호출됩니다.
   * 컴포넌트가 언마운트될 때 채널 구독을 해제(cleanup)합니다.
   */
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('ladder-queue-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  /**
   * proposalCooldown이 0보다 클 때 1초마다 1씩 감소시킵니다.
   * 0에 도달하면 타이머가 멈추고 "매치 시작 제안" 버튼이 다시 활성화됩니다.
   */
  // 쿨다운 카운트다운
  useEffect(() => {
    if (proposalCooldown <= 0) return;
    cooldownTimerRef.current = setTimeout(() => setProposalCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(cooldownTimerRef.current);
  }, [proposalCooldown]);

  /**
   * 대기열 참가 버튼 핸들러입니다.
   * - Discord 연동이 필요한 경우 Discord 모달을 표시합니다.
   * - 5v5 선택 시 경고 모달을 먼저 표시합니다.
   * - 성공 시 profiles.is_in_queue를 true로 업데이트하고
   *   MAX_QUEUE_MINUTES 후 자동 이탈 타이머를 설정합니다.
   */
  const handleJoinQueue = async () => {
    if (!user) return;
    const mt = MATCH_TYPES[queueMatchType];
    if (mt?.warning && !accepted5v5) {
      setShow5v5Warning(true);
      return;
    }
    try {
      setJoiningQueue(true);
      await supabase.from('profiles').update({
        is_in_queue: true,
        queue_joined_at: new Date().toISOString(),
      }).eq('id', user.id);
      setInQueue(true);
      fetchData();
      clearTimeout(queueTimerRef.current);
      queueTimerRef.current = setTimeout(() => {
        handleLeaveQueue();
      }, MAX_QUEUE_MINUTES * 60 * 1000);
    } catch (err) {
      alert('대기열 참여 실패: ' + err.message);
    } finally {
      setJoiningQueue(false);
    }
  };

  /**
   * 대기열 취소 핸들러입니다.
   * profiles.is_in_queue를 false로 업데이트하고 자동 이탈 타이머를 취소합니다.
   * currentUserRef를 사용하여 클로저 내에서도 최신 유저 ID를 참조합니다.
   */
  const handleLeaveQueue = async () => {
    const uid = currentUserRef.current?.id || user?.id;
    if (!uid) return;
    clearTimeout(queueTimerRef.current);
    await supabase.from('profiles').update({ is_in_queue: false }).eq('id', uid);
    setInQueue(false);
    fetchData();
  };

  /**
   * 매치 시작을 제안합니다. ladder_matches 테이블에 새 레코드를 삽입합니다.
   * - 팀 MMR 차이가 BALANCE_THRESHOLD(200점) 초과 시 사용자 확인을 요청합니다.
   * - 제안 횟수에 따라 COOLDOWN_STEPS 기준으로 쿨다운을 증가시킵니다.
   * - 제안 성공 시 activeProposal 상태를 설정하여 동의 팝업을 띄웁니다.
   *
   * @param {string} typeStr - 팀당 인원 수 문자열 (예: '3', '4', '5')
   * @param {Array} teamA - A팀 플레이어 배열
   * @param {Array} teamB - B팀 플레이어 배열
   */
  const handleProposeMatch = async (typeStr, teamA, teamB) => {
    if (!user || proposalCooldown > 0) return;
    const perTeam = parseInt(typeStr);
    const avgA = teamA.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teamA.length;
    const avgB = teamB.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teamB.length;
    const diff = Math.abs(avgA - avgB);

    if (diff > BALANCE_THRESHOLD) {
      const ok = window.confirm(
        `⚠️ 팀 MMR 차이 ${Math.round(diff)}점 — 200점 초과입니다.\n불균형 매치입니다. 계속 진행하시겠습니까?`
      );
      if (!ok) return;
    }

    try {
      const { data, error } = await supabase
        .from('ladder_matches')
        .insert({
          status: '제안중',
          match_type: perTeam,
          team_a_ids: teamA.map(p => p.id),
          team_b_ids: teamB.map(p => p.id),
          score_a: 0,
          score_b: 0,
          created_by: user.id,
        })
        .select().single();
      if (error) throw error;

      const newAttempts = proposalAttempts + 1;
      setProposalAttempts(newAttempts);
      const cdIdx = Math.min(newAttempts, COOLDOWN_STEPS.length - 1);
      setProposalCooldown(COOLDOWN_STEPS[cdIdx]);

      setActiveProposal({
        matchId: data.id,
        matchType: `${perTeam}v${perTeam}`,
        teamA, teamB, avgA, avgB, diff,
        proposedBy: user.id,
      });
    } catch (err) {
      alert('매치 제안 실패: ' + err.message);
    }
  };

  /**
   * 매치 제안 동의 핸들러입니다.
   * - ladder_matches 상태를 '진행중'으로 업데이트합니다.
   * - 참여 플레이어 전원의 is_in_queue를 false로 변경합니다.
   * - onMatchEnter 콜백을 호출하여 MatchCenter 화면으로 이동합니다.
   */
  const handleAccept = async () => {
    if (!activeProposal) return;
    try {
      await supabase.from('ladder_matches')
        .update({ status: '진행중' })
        .eq('id', activeProposal.matchId);
      const allIds = [...activeProposal.teamA, ...activeProposal.teamB].map(p => p.id);
      await supabase.from('profiles').update({ is_in_queue: false }).in('id', allIds);
      const mid = activeProposal.matchId;
      setActiveProposal(null);
      onMatchEnter(mid);
    } catch (err) {
      alert('동의 처리 실패: ' + err.message);
    }
  };

  /**
   * 매치 제안 거절 핸들러입니다.
   * ladder_matches 상태를 '거절됨'으로 업데이트하고 activeProposal을 초기화합니다.
   */
  const handleReject = async () => {
    if (!activeProposal) return;
    try {
      await supabase.from('ladder_matches')
        .update({ status: '거절됨' })
        .eq('id', activeProposal.matchId);
    } finally {
      setActiveProposal(null);
    }
  };

  /**
   * 플레이어 표시 이름을 반환합니다.
   * ByID가 없으면 데이터 오류로 간주합니다.
   * @param {object|null} p - 플레이어 프로필 객체
   * @returns {string} 표시할 이름
   */
  const getDisplayName = (p) => p?.ByID || '[ByID 없음]';

  /** 현재 선택된 매치 유형의 팀당 인원 수 */
  const perTeam = MATCH_TYPES[queueMatchType]?.perTeam || 4;
  /** 매치 시작에 필요한 최소 총 인원 수 (perTeam * 2) */
  const minPlayers = perTeam * 2;
  /** 현재 선택된 매치 유형의 상세 정보 객체 */
  const matchTypeInfo = MATCH_TYPES[queueMatchType];
  /** 대기열 인원이 충분하여 매치 제안 가능한지 여부 */
  const canPropose = queuePlayers.length >= minPlayers;
  /** canPropose가 true일 때 buildTeams로 계산된 두 팀. null이면 팀 구성 미표시. */
  const teams = canPropose ? buildTeams(queuePlayers, perTeam, sortOption) : null;
  /** A팀 평균 MMR */
  const avgA = teams ? teams.teamA.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teams.teamA.length : 0;
  /** B팀 평균 MMR */
  const avgB = teams ? teams.teamB.reduce((s, p) => s + (p.Clan_Point || 1000), 0) / teams.teamB.length : 0;
  /** 두 팀 평균 MMR 차이 (절댓값). BALANCE_THRESHOLD 초과 시 경고 표시. */
  const balanceDiff = Math.abs(avgA - avgB);
  /** 대기열 인원이 8명 이상인지 여부 (팀 구성 정렬 옵션 표시 조건) */
  const has8Plus = queuePlayers.length >= 8;
  /** 대기열 인원이 12명 이상인지 여부 (두 경기 동시 제안 컴포넌트 표시 조건) */
  const has12Plus = queuePlayers.length >= 12;

  if (loading) {
    return (
      <div className="text-center py-24 text-cyan-400 font-mono animate-pulse">
        [ SYSTEM: CONNECTING TO LADDER SERVER... ]
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 font-mono animate-fade-in-down">

      {/* 매치 동의 팝업 */}
      {activeProposal && (
        <ConsentPopup
          proposal={activeProposal}
          myUserId={user?.id}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* 5v5 경고 모달 */}
      {show5v5Warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="max-w-sm w-full mx-4 p-7 rounded-2xl border-2 border-red-600 bg-[#0a0008] shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="text-center font-black text-lg text-red-400 mb-3">5대5 경고</h3>
            <p className="text-sm text-gray-300 text-center mb-6 leading-relaxed">
              5대5는 공식 권장 포맷이 아닙니다.<br />
              모든 참가자의 동의가 필요하며 진행에 어려움이 있을 수 있습니다.<br /><br />
              경기 형식: BO7 (4선승제)<br />
              MMR에 영향을 미칩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAccepted5v5(true);
                  setShow5v5Warning(false);
                  setTimeout(() => handleJoinQueue(), 100);
                }}
                className="flex-1 py-3 font-black rounded-xl bg-red-700 hover:bg-red-600 text-white transition-colors"
              >
                동의하고 참여
              </button>
              <button
                onClick={() => setShow5v5Warning(false)}
                className="flex-1 py-3 font-black rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-end justify-between mb-6 border-b border-cyan-500/40 pb-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] tracking-widest">
            ⚔️ BY래더 대시보드
          </h2>
          <p className="text-gray-600 text-xs mt-0.5">스타크래프트 빠른무한 내전 래더 — 3v3 · 4v4 · 5v5</p>
        </div>
        <span className="text-cyan-600 text-xs animate-pulse">LIVE //</span>
      </div>

      {/* 내 통계 */}
      {(myStats || myProfile) && (
        <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl p-5 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <p className="text-cyan-600 text-xs mb-3 uppercase tracking-widest">{'//'} MY STATS</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">플레이어</p>
              <p className="text-white font-bold text-lg">{getDisplayName(myProfile)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">종족</p>
              <p className="text-cyan-300 font-bold">{myProfile?.race || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">MMR</p>
              <p className="text-yellow-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(234,179,8,0.6)]">
                {myProfile?.Clan_Point ?? myStats?.ladders_points ?? 1000}점
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">티어</p>
              <p className={`font-bold ${TIER_COLORS[getTier(myProfile?.Clan_Point ?? 1000)]}`}>
                {getTier(myProfile?.Clan_Point ?? 1000)}
              </p>
            </div>
            {(myProfile?.wins !== undefined || myStats?.win !== undefined) && (
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">전적</p>
                <p className="font-bold">
                  <span className="text-emerald-400">{myProfile?.wins ?? myStats?.win ?? 0}W</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400">{myProfile?.losses ?? myStats?.lose ?? 0}L</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ 매칭 대기열 ═══════════════ */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl overflow-hidden mb-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        {/* 대기열 헤더 */}
        <div className="px-5 py-4 border-b border-cyan-500/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${queuePlayers.length > 0 ? 'bg-green-400 animate-ping' : 'bg-gray-600'}`}></span>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest">
              매칭 대기열 — {queuePlayers.length}명 대기 중
            </p>
            {matchTypeInfo && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${matchTypeInfo.isLadder ? 'border-yellow-700 text-yellow-500 bg-yellow-950/20' : 'border-gray-700 text-gray-500'}`}>
                {matchTypeInfo.isLadder ? '래더' : '일반'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={queueMatchType}
              onChange={e => { setQueueMatchType(e.target.value); setAccepted5v5(false); }}
              className="bg-gray-900 border border-cyan-500/40 text-cyan-300 rounded px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <optgroup label="── 래더 매치 ──">
                <option value="3v3">3대3 래더 (BO5 3선승)</option>
                <option value="4v4">4대4 래더 (BO5 3선승)</option>
                <option value="5v5">5대5 래더 (BO7 4선승)</option>
              </optgroup>
              <optgroup label="── 일반 게임 ──">
                <option value="1v1">1대1 일반 (래더 미반영)</option>
                <option value="2v2">2대2 일반 (래더 미반영)</option>
              </optgroup>
            </select>
            <button onClick={fetchData} className="text-cyan-700 hover:text-cyan-400 text-xs transition-colors uppercase tracking-wider">
              새로고침
            </button>
          </div>
        </div>

        {/* 대기열 플레이어 목록 */}
        {queuePlayers.length === 0 ? (
          <div className="text-center py-12 text-cyan-700 text-sm">
            [ 현재 대기 중인 플레이어가 없습니다 ]
          </div>
        ) : (
          <div className="divide-y divide-cyan-900/20">
            {queuePlayers.map((p, idx) => {
              const tier = getTier(p.Clan_Point || 1000);
              const isMe = p.id === user?.id;
              const queueMinutes = p.queue_joined_at
                ? Math.floor((Date.now() - new Date(p.queue_joined_at).getTime()) / 60000)
                : 0;
              return (
                <div key={p.id} className={`px-5 py-3 flex items-center justify-between hover:bg-cyan-900/10 transition-colors ${isMe ? 'bg-cyan-950/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 text-xs w-5 text-right">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-700/40 flex items-center justify-center text-xs font-bold text-cyan-400">
                      {getRaceIcon(p.race)}
                    </div>
                    <span className={`font-semibold text-sm ${isMe ? 'text-cyan-300' : 'text-gray-200'}`}>
                      {getDisplayName(p)}
                      {isMe && <span className="ml-2 text-[10px] text-cyan-600 border border-cyan-800 px-1 rounded">나</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`font-bold ${TIER_COLORS[tier]}`}>{tier}</span>
                    <span className="text-yellow-400 font-bold">{p.Clan_Point || 1000}점</span>
                    <span className="text-gray-600 hidden sm:inline">{queueMinutes}분</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 8명+ 소팅 옵션 */}
        {has8Plus && canPropose && (
          <div className="px-5 py-3 border-t border-cyan-900/30 bg-[#08101e]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-cyan-700 text-xs uppercase tracking-wider">팀 구성:</span>
              {[
                { value: 'top', label: '상픽 우선' },
                { value: 'balance', label: '밸런스 우선' },
                { value: 'bottom', label: '하픽 우선' },
              ].map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortOption(o.value)}
                  className={`px-3 py-1 text-xs rounded font-bold transition-all ${
                    sortOption === o.value
                      ? 'bg-cyan-700 text-white shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                      : 'bg-gray-900 text-gray-500 border border-gray-700 hover:border-cyan-700 hover:text-cyan-400'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 팀 밸런스 미리보기 */}
        {canPropose && teams && (
          <div className={`px-5 py-4 border-t ${balanceDiff > BALANCE_THRESHOLD ? 'border-yellow-700/30 bg-yellow-950/5' : 'border-blue-700/20 bg-blue-950/5'}`}>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-3">
              예상 팀 구성 ({queueMatchType})
              {balanceDiff > BALANCE_THRESHOLD && <span className="ml-2 text-yellow-500">⚠️ 밸런스 주의</span>}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-blue-400 text-xs font-bold mb-2">TEAM A — 평균 MMR {Math.round(avgA)}점</p>
                <div className="space-y-1">
                  {teams.teamA.map(p => (
                    <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate">{getDisplayName(p)}</span>
                      <span className="text-yellow-400">{p.Clan_Point || 1000}점</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center px-3">
                <div className={`font-black text-2xl ${balanceDiff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
                  {Math.round(balanceDiff)}점
                </div>
                <div className="text-gray-600 text-[10px]">MMR 차이</div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-red-400 text-xs font-bold mb-2">TEAM B — 평균 MMR {Math.round(avgB)}점</p>
                <div className="space-y-1">
                  {teams.teamB.map(p => (
                    <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2 flex-row-reverse">
                      <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate text-right">{getDisplayName(p)}</span>
                      <span className="text-yellow-400">{p.Clan_Point || 1000}점</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 12명+ 두 경기 제안 */}
        {has12Plus && (
          <div className="px-5 pb-4">
            <TwoMatchSuggestion
              players={queuePlayers}
              onSelectMatch={(match) => handleProposeMatch('3', match.teamA, match.teamB)}
            />
          </div>
        )}

        {/* 대기열 액션 버튼 */}
        <div className="px-5 py-4 border-t border-cyan-900/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {!inQueue ? (
              <button
                onClick={handleJoinQueue}
                disabled={joiningQueue}
                className="px-5 py-2.5 rounded-lg text-sm font-bold btn-neon disabled:opacity-40 transition-all"
              >
                {joiningQueue ? '참여 중...' : `▶ ${matchTypeInfo?.label || queueMatchType} 대기열 참여`}
              </button>
            ) : (
              <button
                onClick={handleLeaveQueue}
                className="px-5 py-2.5 rounded-lg text-sm font-bold border border-red-700/50 text-red-400 hover:bg-red-950/20 transition-all"
              >
                ✗ 대기 취소
              </button>
            )}
            {inQueue && (
              <span className="text-cyan-700 text-xs font-mono animate-pulse">
                대기 중 — 최대 {MAX_QUEUE_MINUTES}분
              </span>
            )}
          </div>

          {canPropose && (
            <div className="flex items-center gap-2">
              {proposalCooldown > 0 && (
                <span className="text-gray-600 text-xs font-mono">{proposalCooldown}s 후 재시도</span>
              )}
              <button
                onClick={() => teams && handleProposeMatch(String(perTeam), teams.teamA, teams.teamB)}
                disabled={proposalCooldown > 0 || !teams || !!activeProposal}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 ${
                  !proposalCooldown && !activeProposal
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-400/20 animate-pulse-neon'
                    : 'bg-gray-900 text-gray-600 border border-gray-700 cursor-not-allowed'
                }`}
              >
                ⚡ 매치 시작 제안
              </button>
            </div>
          )}

          {!canPropose && queuePlayers.length > 0 && (
            <span className="text-gray-600 text-xs font-mono">
              {queueMatchType} 매치까지 {minPlayers - queuePlayers.length}명 더 필요
            </span>
          )}
        </div>
      </div>

      {/* 진행 중인 매치 목록 */}
      {ongoingMatches.filter(m => m.status === '진행중').length > 0 && (
        <div className="bg-[#0A1128] border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="px-5 py-4 border-b border-emerald-500/30 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping flex-shrink-0"></span>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">레더매치보드 — 진행 중</p>
          </div>
          <div className="divide-y divide-emerald-900/20">
            {ongoingMatches.filter(m => m.status === '진행중').map(match => {
              const isParticipant = [...(match.team_a_ids || []), ...(match.team_b_ids || [])].includes(user?.id);
              const teamANames = (match.team_a_ids || []).map(id => getDisplayName(matchProfiles[id]));
              const teamBNames = (match.team_b_ids || []).map(id => getDisplayName(matchProfiles[id]));
              return (
                <div key={match.id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-emerald-300 font-bold text-sm">
                        {match.match_type}v{match.match_type} {match.match_type >= 3 ? '래더' : '일반'}
                      </span>
                      <span className="text-gray-600 text-xs border border-gray-700 px-2 py-0.5 rounded">
                        BO{match.match_type >= 5 ? '7' : '5'} — {match.score_a} : {match.score_b}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs font-sans">
                      <span className="text-blue-400">A</span>: {teamANames.join(', ')}
                      <span className="mx-2 text-gray-700">vs</span>
                      <span className="text-red-400">B</span>: {teamBNames.join(', ')}
                    </div>
                  </div>
                  {isParticipant && (
                    <button
                      onClick={() => onMatchEnter(match.id)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                      매치 재입장 →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
