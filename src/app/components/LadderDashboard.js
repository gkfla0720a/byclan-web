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
import { useAuthContext } from '@/app/context/AuthContext';
import { getPlayerMmr, getRaceIcon, getTier, TIER_COLORS } from '@/utils/profiles';
import { buildTeams, MATCH_TYPES } from '@/utils/matchmaking';
import ConsentPopup from '@/components/ladder/ConsentPopup';
import TwoMatchSuggestion from '@/components/ladder/TwoMatchSuggestion';
import TeamBalancePreview from '@/components/ladder/TeamBalancePreview';
import OngoingMatchList from '@/components/ladder/OngoingMatchList';
import Warning5v5Modal from '@/components/ladder/Warning5v5Modal';

const BALANCE_THRESHOLD = 200;
const MAX_QUEUE_MINUTES = 20;
const COOLDOWN_STEPS = [0, 10, 30, 180];

export default function LadderDashboard({ onMatchEnter }) {
  const { user, profile: myProfile, authLoading } = useAuthContext();
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
  const [matchProfiles, setMatchProfiles] = useState({});
  const cooldownTimerRef = useRef(null);
  const queueTimerRef = useRef(null);
  const currentUserRef = useRef(null);
  const lastQueueKeyRef = useRef('');

  // 대기열과 매치 정보만 가져옵니다.
  const fetchData = useCallback(async () => {
    // 로딩 중이거나 유저가 없으면 멈춤
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      currentUserRef.current = user;

      // 내 대기열 상태 조회
      const { data: myQueue } = await supabase
        .from('ladder_queue')
        .select('is_in_queue')
        .eq('user_id', user.id)
        .maybeSingle();
      setInQueue(myQueue?.is_in_queue || false);

      // 테스트 계정 필터링 값
      const isTestViewer = typeof window !== 'undefined' &&
        window.localStorage.getItem('byclan_current_is_test_account') === 'true';

      // 대기열 전체 목록 조회
      const { data: queueRaw } = await supabase
        .from('ladder_queue')
        .select(`
          user_id, queue_joined_at,
          profiles!inner (
            id, by_id, race, clan_point, role,
            profile_meta (is_test_account, is_test_account_active),
            ladder_rankings (ladder_mmr, team_mmr, total_mmr)
          )
        `)
        .eq('is_in_queue', true)
        .order('queue_joined_at', { ascending: true });

      const qPlayers = (queueRaw || []).filter(r => {
        const meta = Array.isArray(r.profiles?.profile_meta) ? r.profiles.profile_meta[0] : r.profiles?.profile_meta;
        const isTest = meta?.is_test_account === true;
        const isActive = meta?.is_test_account_active === true;
        return isTestViewer ? (isTest && isActive) : !isTest;
      }).map(r => {
        const rankings = Array.isArray(r.profiles?.ladder_rankings) ? r.profiles.ladder_rankings[0] : r.profiles?.ladder_rankings;
        return {
          id: r.user_id,
          by_id: r.profiles?.by_id, // 💡 profiles에서 by_id를 정확히 꺼냄
          race: r.profiles?.race,
          role: r.profiles?.role,
          total_mmr: rankings?.total_mmr, // 💡 total_mmr을 온전히 담아줌
          queue_joined_at: r.queue_joined_at,
        };
      });
      setQueuePlayers(qPlayers);

      // 대기열 쿨다운 초기화 로직
      const newKey = qPlayers.map(p => p.id).sort().join(',');
      if (lastQueueKeyRef.current && lastQueueKeyRef.current !== newKey) {
        setProposalAttempts(0);
        setProposalCooldown(0);
        clearTimeout(cooldownTimerRef.current);
      }
      lastQueueKeyRef.current = newKey;

      // [보완 3] 진행 중인 매치 조회 (부모 테이블 match_type도 함께 가져옵니다)
      const { data: ongoingRaw } = await supabase
        .from('ladder_match_sets')
        .select('*, ladder_record!inner(id, team_a_ids, team_b_ids, match_type)') 
        .in('status', ['in_progress', 'proposed'])
        .order('created_at', { ascending: false })
        .limit(20);

      const ongoingList = (ongoingRaw || []).map(m => {
        const rec = Array.isArray(m.ladder_record) ? m.ladder_record[0] : m.ladder_record;
        // 기존 UI는 ladder_record를 [{user_id, team}] 형태의 배열로 기대하므로 변환해줍니다.
        const teamA = (rec?.team_a_ids || []).map(id => ({ user_id: id, team: 'A' }));
        const teamB = (rec?.team_b_ids || []).map(id => ({ user_id: id, team: 'B' }));
        return {
          ...m,
          match_type: rec?.match_type, // 부모의 match_type을 자식으로 복사
          ladder_record: [...teamA, ...teamB] 
        };
      }).slice(0, 8);

      setOngoingMatches(ongoingList);

      // 참여 선수 프로필 조회
      const allTeamIds = [...new Set(
        ongoingList.flatMap(m => (m.ladder_record || []).map(r => r.user_id))
      )];
      
      let profMap = {};
      if (allTeamIds.length > 0) {
        const { data: teamProfs } = await supabase
          .from('ladder_rankings')
          .select('user_id, ladder_mmr, team_mmr, total_mmr, profiles!inner(id, by_id, clan_point)') 
          .in('user_id', allTeamIds);

        profMap = Object.fromEntries((teamProfs || []).map(p => [p.user_id, {
          id: p.user_id,
          by_id: p.profiles?.by_id,
          clan_point: p.profiles?.clan_point,
          ladder_mmr: p.ladder_mmr,
          team_mmr: p.team_mmr,
          total_mmr: p.total_mmr,
        }]));
      }
      setMatchProfiles(profMap);

      // [보완 4] 내가 포함된 제안 확인
      const myProposal = ongoingList.find(m =>
        m.status === 'proposed' &&
        (m.ladder_record || []).some(r => r.user_id === authUser.id)
      );

      if (myProposal) {
        const resolveProf = (id) => ({
          id,
          by_id: profMap[id]?.by_id || '...',
          clan_point: profMap[id]?.total_mmr || 1000,
        });

        const teamA = (myProposal.ladder_record || []).filter(r => r.team === 'A').map(r => resolveProf(r.user_id));
        const teamB = (myProposal.ladder_record || []).filter(r => r.team === 'B').map(r => resolveProf(r.user_id));

        const avgA = teamA.length ? teamA.reduce((s, p) => s + (p.clan_point || 1000), 0) / teamA.length : 1000;
        const avgB = teamB.length ? teamB.reduce((s, p) => s + (p.clan_point || 1000), 0) / teamB.length : 1000;

        setActiveProposal(prev => (prev?.matchId === myProposal.id) ? prev : {
          matchId: myProposal.match_id,
          matchType: myProposal.match_type || '래더',
          teamA, teamB, avgA, avgB,
          diff: Math.abs(avgA - avgB),
          proposedBy: null,
        });
      } else {
        setActiveProposal(null);
      }
    } catch (err) {
      console.error('래더 대시보드 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]); // 의존성 배열에 user와 authLoading 추가

  /**
   * 컴포넌트 마운트 시 데이터를 불러오고, Supabase Realtime 채널을 구독합니다.
   * profiles 또는 ladder_matches 테이블에 변경이 있을 때마다 fetchData가 자동 호출됩니다.
   * 컴포넌트가 언마운트될 때 채널 구독을 해제(cleanup)합니다.
   */
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('ladder-queue-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_queue' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_match_sets' }, fetchData)
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
      await supabase.from('ladder_queue').upsert({
        user_id: user.id,
        is_in_queue: true,
        queue_joined_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
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
    await supabase.from('ladder_queue').update({ is_in_queue: false, vote_to_start: false }).eq('user_id', uid);
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
    const avgA = teamA.reduce((s, p) => s + getPlayerMmr(p), 0) / teamA.length;
    const avgB = teamB.reduce((s, p) => s + getPlayerMmr(p), 0) / teamB.length;
    const diff = Math.abs(avgA - avgB);

    if (diff > BALANCE_THRESHOLD) {
      const ok = window.confirm(
        `⚠️ 팀 MMR 차이 ${Math.round(diff)}점 — 200점 초과입니다.\n불균형 매치입니다. 계속 진행하시겠습니까?`
      );
      if (!ok) return;
    }

    try {
      const matchId = crypto.randomUUID(); // 그룹 식별자 발급
      
      const { error: setErr } = await supabase
        .from('ladder_match_sets')
        .insert({
          match_id: matchId,
          set_number: 1,
          status: 'proposed',
          race_type: `${perTeam}v${perTeam}`,
        });
      if (setErr) throw setErr;

      const records = [
        ...teamA.map(p => ({ match_id: matchId, user_id: p.id, team: 'A' })),
        ...teamB.map(p => ({ match_id: matchId, user_id: p.id, team: 'B' }))
      ];
      const { error: recordErr } = await supabase.from('ladder_record').insert(records);
      if (recordErr) throw recordErr;

      const newAttempts = proposalAttempts + 1;
      setProposalAttempts(newAttempts);
      const cdIdx = Math.min(newAttempts, COOLDOWN_STEPS.length - 1);
      setProposalCooldown(COOLDOWN_STEPS[cdIdx]);

      setActiveProposal({
        matchId: matchId,
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
   * - ladder_matches 상태를 'in_progress'으로 업데이트합니다.
   * - 참여 플레이어 전원의 is_in_queue를 false로 변경합니다.
   * - onMatchEnter 콜백을 호출하여 MatchCenter 화면으로 이동합니다.
   */
  const handleAccept = async () => {
    if (!activeProposal) return;
    try {
      await supabase.from('ladder_match_sets')
        .update({ status: 'in_progress' })
        .eq('match_id', activeProposal.matchId);
      const allIds = [...activeProposal.teamA, ...activeProposal.teamB].map(p => p.id);
      await supabase.from('ladder_queue').update({ is_in_queue: false, vote_to_start: false }).in('user_id', allIds);

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
      await supabase.from('ladder_match_sets')
        .update({ status: '거절됨' })
        .eq('match_id', activeProposal.matchId);
    } finally {
      setActiveProposal(null);
    }
  };

  /**
   * 플레이어 표시 이름을 반환합니다.
   * by_id가 없으면 데이터 오류로 간주합니다.
   * @param {object|null} p - 플레이어 프로필 객체
   * @returns {string} 표시할 이름
   */
  const getDisplayName = (p) => p?.by_id || '[by_id 없음]';

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
  const avgA = teams ? teams.teamA.reduce((s, p) => s + getPlayerMmr(p), 0) / teams.teamA.length : 0;
  /** B팀 평균 MMR */
  const avgB = teams ? teams.teamB.reduce((s, p) => s + getPlayerMmr(p), 0) / teams.teamB.length : 0;
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
      {/* 1. 팝업 모달 영역 */}
      {activeProposal && <ConsentPopup proposal={activeProposal} myUserId={user?.id} onAccept={handleAccept} onReject={handleReject} />}
      
      {/* 5v5 경고 모달 */}
      {show5v5Warning && (
        <Warning5v5Modal 
          onAccept={() => {
            setAccepted5v5(true);
            setShow5v5Warning(false);
            setTimeout(() => handleJoinQueue(), 100);
          }}
          onCancel={() => setShow5v5Warning(false)}
        />
      )}

      {/* 2. 대시보드 헤더 */}
      <div className="flex items-end justify-between mb-6 border-b border-cyan-500/40 pb-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] tracking-widest">
            ⚔️ BY래더 대시보드
          </h2>
          <p className="text-gray-600 text-xs mt-0.5">스타크래프트 빠른무한 내전 래더 — 3v3 · 4v4 · 5v5</p>
        </div>
        <span className="text-cyan-600 text-xs animate-pulse">LIVE //</span>
      </div>

      {/* 3. 내 통계 요약 (복구됨!) */}
      {myProfile && (
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
                {getPlayerMmr(myProfile)}점
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">티어</p>
              <p className={`font-bold ${TIER_COLORS[getTier(getPlayerMmr(myProfile))]}`}>
                {getTier(getPlayerMmr(myProfile))}
              </p>
            </div>
            {(myProfile?.wins !== undefined || myProfile?.losses !== undefined) && (
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">전적</p>
                <p className="font-bold">
                  <span className="text-emerald-400">{myProfile?.wins ?? 0}W</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400">{myProfile?.losses ?? 0}L</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 매칭 대기열 메인 박스 */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl overflow-hidden mb-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        
        {/* 대기열 헤더 (복구됨!) */}
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

        {/* 대기열 리스트 (복구됨!) */}
        {queuePlayers.length === 0 ? (
          <div className="text-center py-12 text-cyan-700 text-sm">
            [ 현재 대기 중인 플레이어가 없습니다 ]
          </div>
        ) : (
          <div className="divide-y divide-cyan-900/20">
            {queuePlayers.map((p, idx) => {
              const tier = getTier(getPlayerMmr(p));
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
                    <span className="text-yellow-400 font-bold">{getPlayerMmr(p)}점</span>
                    <span className="text-gray-600 hidden sm:inline">{queueMinutes}분</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 8명+ 소팅 옵션 (복구됨!) */}
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

        {/* 💡 레고 블록 장착 1: 팀 밸런스 미리보기 */}
        {canPropose && teams && (
          <TeamBalancePreview 
            teams={teams} 
            matchType={queueMatchType} 
            avgA={avgA} avgB={avgB} balanceDiff={balanceDiff} 
          />
        )}

        {/* 💡 레고 블록 장착 2: 12명+ 듀얼 매치 제안기 */}
        {has12Plus && (
          <div className="px-5 pb-4">
            <TwoMatchSuggestion players={queuePlayers} onSelectMatch={(match) => handleProposeMatch(String(perTeam), match.teamA, match.teamB)} />
          </div>
        )}

        {/* 하단 대기열 액션 버튼 (복구됨!) */}
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

      {/* 💡 레고 블록 장착 3: 진행 중인 매치 목록 */}
      <OngoingMatchList 
        matches={ongoingMatches} 
        matchProfiles={matchProfiles} 
        currentUserId={user?.id} 
        onMatchEnter={onMatchEnter} 
      />
    </div>
  );
}