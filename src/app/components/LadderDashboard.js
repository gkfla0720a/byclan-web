'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { filterVisibleTestAccounts, filterVisibleTestData } from '@/app/utils/testData';

// ── 상수 ─────────────────────────────────────────────────────────────
const MATCH_TYPES = {
  '3v3': { label: '3대3', minPlayers: 6, perTeam: 3, isLadder: true, format: 'BO5 (3선승)' },
  '4v4': { label: '4대4', minPlayers: 8, perTeam: 4, isLadder: true, format: 'BO5 (3선승)' },
  '5v5': { label: '5대5', minPlayers: 10, perTeam: 5, isLadder: true, format: 'BO7 (4선승)', warning: true },
  '1v1': { label: '1대1', minPlayers: 2, perTeam: 1, isLadder: false, format: '일반게임' },
  '2v2': { label: '2대2', minPlayers: 4, perTeam: 2, isLadder: false, format: '일반게임' },
};

const BALANCE_THRESHOLD = 200;
const MAX_QUEUE_MINUTES = 20;
const PROPOSAL_CONSENT_SECONDS = 40;
const COOLDOWN_STEPS = [0, 10, 30, 180];

const TIER_COLORS = {
  Master: 'text-purple-400', Diamond: 'text-blue-400', Platinum: 'text-cyan-400',
  Gold: 'text-yellow-400', Silver: 'text-gray-400', Bronze: 'text-orange-700',
};

function getTier(pts) {
  if (pts >= 2200) return 'Master';
  if (pts >= 1900) return 'Diamond';
  if (pts >= 1600) return 'Platinum';
  if (pts >= 1350) return 'Gold';
  if (pts >= 1100) return 'Silver';
  return 'Bronze';
}

function getRaceIcon(race) {
  const icons = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return icons[race] || '?';
}

function buildTeams(players, perTeam, sortOption) {
  if (players.length < perTeam * 2) return null;
  const pool = [...players].slice(0, perTeam * 2);
  if (sortOption === 'balance') {
    const sorted = [...pool].sort((a, b) => (b.ladder_points || 1000) - (a.ladder_points || 1000));
    const teamA = [], teamB = [];
    sorted.forEach((p, i) => { if (i % 2 === 0) teamA.push(p); else teamB.push(p); });
    return { teamA, teamB };
  }
  if (sortOption === 'top') {
    const sorted = [...pool].sort((a, b) => (b.ladder_points || 1000) - (a.ladder_points || 1000));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
  if (sortOption === 'bottom') {
    const sorted = [...pool].sort((a, b) => (a.ladder_points || 1000) - (b.ladder_points || 1000));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
  return buildTeams(players, perTeam, 'balance');
}

// ── 매치 동의 팝업 ────────────────────────────────────────────────────
function ConsentPopup({ proposal, myUserId, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(PROPOSAL_CONSENT_SECONDS);
  const [rejected, setRejected] = useState(false);

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
                      <span className="flex-1 truncate">{p.ByID || p.discord_name}</span>
                      <span className="text-yellow-500 text-[10px]">{p.ladder_points || 1000}</span>
                    </div>
                  ))}
                  <div className={`text-center text-[10px] mt-1 font-bold ${team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                    평균 {Math.round(team === 'A' ? proposal.avgA : proposal.avgB)}P
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-center text-xs mb-5 ${proposal.diff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
              팀 점수 차이: {Math.round(proposal.diff)}P
              {proposal.diff > BALANCE_THRESHOLD && ' ⚠️ 200P 초과 — 불균형 주의'}
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

// ── 12명+ 두 팀 분리 제안 ─────────────────────────────────────────────
function TwoMatchSuggestion({ players, onSelectMatch }) {
  const [sortA, setSortA] = useState('balance');
  const [sortB, setSortB] = useState('balance');
  const perTeam = 3;
  const sorted = [...players].sort((a, b) => (b.ladder_points || 1000) - (a.ladder_points || 1000));
  const half = Math.floor(sorted.length / 2);
  const upperPool = sorted.slice(0, half);
  const lowerPool = sorted.slice(half);
  const match1 = buildTeams(upperPool, perTeam, sortA);
  const match2 = buildTeams(lowerPool, perTeam, sortB);
  const calcAvg = (team) => (team && team.length > 0) ? team.reduce((s, p) => s + (p.ladder_points || 1000), 0) / team.length : 0;
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
                <div className="text-blue-400">A: {t.teamA.map(p => p.ByID || p.discord_name).join(', ')}</div>
                <div className="text-red-400">B: {t.teamB.map(p => p.ByID || p.discord_name).join(', ')}</div>
                <div className={diff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}>
                  차이: {Math.round(diff)}P {diff > BALANCE_THRESHOLD ? '⚠️' : '✓'}
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function LadderDashboard({ onMatchEnter }) {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [queuePlayers, setQueuePlayers] = useState([]);
  const [ongoingMatches, setOngoingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [queueMatchType, setQueueMatchType] = useState('4v4');
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [sortOption, setSortOption] = useState('balance');
  const [activeProposal, setActiveProposal] = useState(null);
  const [proposalCooldown, setProposalCooldown] = useState(0);
  const [proposalAttempts, setProposalAttempts] = useState(0);
  const [show5v5Warning, setShow5v5Warning] = useState(false);
  const [accepted5v5, setAccepted5v5] = useState(false);
  const cooldownTimerRef = useRef(null);
  const queueTimerRef = useRef(null);
  const currentUserRef = useRef(null);
  const lastQueueKeyRef = useRef('');

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
        .select('id, ByID, discord_name, race, ladder_points, role, is_in_queue, queue_joined_at')
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
        .select('*, profiles(*)')
        .in('status', ['진행중', '제안중'])
        .order('created_at', { ascending: false })
        .limit(8));
      setOngoingMatches(ongoing || []);

      // 내가 포함된 제안 확인
      const myProposal = (ongoing || []).find(m =>
        m.status === '제안중' &&
        [...(m.team_a_ids || []), ...(m.team_b_ids || [])].includes(authUser.id)
      );
      if (myProposal) {
        const allProfs = myProposal.profiles || [];
        const teamA = (myProposal.team_a_ids || []).map(id => allProfs.find(p => p.id === id)).filter(Boolean);
        const teamB = (myProposal.team_b_ids || []).map(id => allProfs.find(p => p.id === id)).filter(Boolean);
        const avgA = teamA.length ? teamA.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teamA.length : 1000;
        const avgB = teamB.length ? teamB.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teamB.length : 1000;
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

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('ladder-queue-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // 쿨다운 카운트다운
  useEffect(() => {
    if (proposalCooldown <= 0) return;
    cooldownTimerRef.current = setTimeout(() => setProposalCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(cooldownTimerRef.current);
  }, [proposalCooldown]);

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

  const handleLeaveQueue = async () => {
    const uid = currentUserRef.current?.id || user?.id;
    if (!uid) return;
    clearTimeout(queueTimerRef.current);
    await supabase.from('profiles').update({ is_in_queue: false }).eq('id', uid);
    setInQueue(false);
  };

  const handleProposeMatch = async (typeStr, teamA, teamB) => {
    if (!user || proposalCooldown > 0) return;
    const perTeam = parseInt(typeStr);
    const avgA = teamA.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teamA.length;
    const avgB = teamB.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teamB.length;
    const diff = Math.abs(avgA - avgB);

    if (diff > BALANCE_THRESHOLD) {
      const ok = window.confirm(
        `⚠️ 팀 점수 차이 ${Math.round(diff)}P — 200P 초과입니다.\n불균형 매치입니다. 계속 진행하시겠습니까?`
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

  const getDisplayName = (p) => p?.ByID || p?.discord_name || '???';

  const perTeam = MATCH_TYPES[queueMatchType]?.perTeam || 4;
  const minPlayers = perTeam * 2;
  const matchTypeInfo = MATCH_TYPES[queueMatchType];
  const canPropose = queuePlayers.length >= minPlayers;
  const teams = canPropose ? buildTeams(queuePlayers, perTeam, sortOption) : null;
  const avgA = teams ? teams.teamA.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teams.teamA.length : 0;
  const avgB = teams ? teams.teamB.reduce((s, p) => s + (p.ladder_points || 1000), 0) / teams.teamB.length : 0;
  const balanceDiff = Math.abs(avgA - avgB);
  const has8Plus = queuePlayers.length >= 8;
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
              래더 점수에 영향을 미칩니다.
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
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">래더 포인트</p>
              <p className="text-yellow-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(234,179,8,0.6)]">
                {myProfile?.ladder_points ?? myStats?.ladders_points ?? 1000} P
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">티어</p>
              <p className={`font-bold ${TIER_COLORS[getTier(myProfile?.ladder_points ?? 1000)]}`}>
                {getTier(myProfile?.ladder_points ?? 1000)}
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
              const tier = getTier(p.ladder_points || 1000);
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
                    <span className="text-yellow-400 font-bold">{p.ladder_points || 1000} P</span>
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
                <p className="text-blue-400 text-xs font-bold mb-2">TEAM A — 평균 {Math.round(avgA)}P</p>
                <div className="space-y-1">
                  {teams.teamA.map(p => (
                    <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate">{getDisplayName(p)}</span>
                      <span className="text-yellow-400">{p.ladder_points || 1000}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center px-3">
                <div className={`font-black text-2xl ${balanceDiff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
                  {Math.round(balanceDiff)}P
                </div>
                <div className="text-gray-600 text-[10px]">차이</div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-red-400 text-xs font-bold mb-2">TEAM B — 평균 {Math.round(avgB)}P</p>
                <div className="space-y-1">
                  {teams.teamB.map(p => (
                    <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2 flex-row-reverse">
                      <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate text-right">{getDisplayName(p)}</span>
                      <span className="text-yellow-400">{p.ladder_points || 1000}</span>
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
              const allProfs = match.profiles || [];
              const isParticipant = [...(match.team_a_ids || []), ...(match.team_b_ids || [])].includes(user?.id);
              const teamANames = (match.team_a_ids || []).map(id => getDisplayName(allProfs.find(p => p.id === id)));
              const teamBNames = (match.team_b_ids || []).map(id => getDisplayName(allProfs.find(p => p.id === id)));
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
