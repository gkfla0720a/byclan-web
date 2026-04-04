'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard({ onMatchEnter }) {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [openMatches, setOpenMatches] = useState([]);
  const [ongoingMatch, setOngoingMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [matchType, setMatchType] = useState(4);
  const [joining, setJoining] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (profile) setMyProfile(profile);

      const { data: stats } = await supabase
        .from('ladders')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (stats) setMyStats(stats);

      // 진행 중인 매치 확인 (team_a_ids / team_b_ids)
      const { data: ongoing } = await supabase
        .from('ladder_matches')
        .select('*, profiles(*)')
        .eq('status', '진행중')
        .or(`team_a_ids.cs.{${authUser.id}},team_b_ids.cs.{${authUser.id}}`)
        .maybeSingle();
      setOngoingMatch(ongoing || null);

      // 대기 중인 (아직 한 팀만 구성된) 공개 매치
      const { data: open } = await supabase
        .from('ladder_matches')
        .select('*, profiles(*)')
        .eq('status', '대기중')
        .order('created_at', { ascending: false })
        .limit(10);
      setOpenMatches(open || []);
    } catch (err) {
      console.error('래더 대시보드 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('ladder-lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleCreateMatch = async () => {
    if (!user) return;
    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('ladder_matches')
        .insert({
          status: '대기중',
          match_type: matchType,
          team_a_ids: [user.id],
          team_b_ids: [],
          score_a: 0,
          score_b: 0,
        })
        .select()
        .single();
      if (error) throw error;
      await fetchData();
      alert('매치가 생성되었습니다! 상대팀을 기다리는 중입니다.');
      onMatchEnter(data.id);
    } catch (err) {
      alert('매치 생성 실패: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMatch = async (match) => {
    if (!user) return;
    const isInTeamA = (match.team_a_ids || []).includes(user.id);
    const isInTeamB = (match.team_b_ids || []).includes(user.id);
    if (isInTeamA || isInTeamB) {
      onMatchEnter(match.id);
      return;
    }

    try {
      setJoining(match.id);
      const teamA = match.team_a_ids || [];
      const teamB = match.team_b_ids || [];

      let updatePayload;
      if (teamA.length <= teamB.length) {
        updatePayload = { team_a_ids: [...teamA, user.id] };
      } else {
        updatePayload = { team_b_ids: [...teamB, user.id] };
      }

      // 양 팀 모두 3명이 되면 진행 중으로 상태 변경
      const newTeamA = updatePayload.team_a_ids || teamA;
      const newTeamB = updatePayload.team_b_ids || teamB;
      if (newTeamA.length >= 3 && newTeamB.length >= 3) {
        updatePayload.status = '진행중';
      }

      const { error } = await supabase
        .from('ladder_matches')
        .update(updatePayload)
        .eq('id', match.id);
      if (error) throw error;

      await fetchData();
      onMatchEnter(match.id);
    } catch (err) {
      alert('매치 참여 실패: ' + err.message);
    } finally {
      setJoining(null);
    }
  };

  const getDisplayName = (profile) => profile?.ByID || profile?.discord_name || '???';

  const getTeamNames = (match) => {
    const allProfiles = match.profiles || [];
    const teamA = (match.team_a_ids || []).map(id => {
      const p = allProfiles.find(pr => pr.id === id);
      return getDisplayName(p);
    });
    const teamB = (match.team_b_ids || []).map(id => {
      const p = allProfiles.find(pr => pr.id === id);
      return getDisplayName(p);
    });
    return { teamA, teamB };
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-cyan-400 font-mono animate-pulse">
        [ SYSTEM: CONNECTING TO LADDER SERVER... ]
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 font-mono animate-fade-in-down">

      {/* 헤더 */}
      <div className="flex items-end justify-between mb-6 border-b border-cyan-500/40 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] tracking-widest">
          ⚔️ BY래더 대시보드
        </h2>
        <span className="text-cyan-600 text-xs animate-pulse">LIVE //</span>
      </div>

      {/* 내 통계 */}
      {(myStats || myProfile) && (
        <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl p-5 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
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
            {myStats && (
              <>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">래더 포인트</p>
                  <p className="text-yellow-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(234,179,8,0.6)]">
                    {myStats.ladders_points ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">전적</p>
                  <p className="font-bold">
                    <span className="text-emerald-400">{myStats.win ?? 0}W</span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400">{myStats.lose ?? 0}L</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">승률</p>
                  <p className="text-cyan-300 font-bold">
                    {(myStats.win + myStats.lose) > 0
                      ? ((myStats.win / (myStats.win + myStats.lose)) * 100).toFixed(1) + '%'
                      : '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 진행 중인 매치 재입장 */}
      {ongoingMatch && (
        <div className="mb-6 bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <p className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping inline-block"></span>
            진행 중인 매치가 있습니다!
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-gray-300 text-sm font-sans">
              BO{ongoingMatch.match_type === 5 ? '7' : '5'} •{' '}
              {ongoingMatch.score_a} : {ongoingMatch.score_b}
            </span>
            <button
              onClick={() => onMatchEnter(ongoingMatch.id)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              매치 재입장 →
            </button>
          </div>
        </div>
      )}

      {/* 매치 생성 */}
      {!ongoingMatch && (
        <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl p-5 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <p className="text-cyan-600 text-xs mb-4 uppercase tracking-widest">{'//'} CREATE NEW MATCH</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs uppercase tracking-wider">포맷</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(Number(e.target.value))}
                className="bg-gray-900 border border-cyan-500/40 text-cyan-300 rounded px-3 py-1.5 text-sm outline-none cursor-pointer"
              >
                <option value={4}>BO5 (3v3)</option>
                <option value={5}>BO7 (3v3)</option>
              </select>
            </div>
            <button
              onClick={handleCreateMatch}
              disabled={creating}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] disabled:opacity-40"
            >
              {creating ? '생성 중...' : '⚔️ 매치 생성'}
            </button>
          </div>
        </div>
      )}

      {/* 공개 대기 매치 목록 */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="px-5 py-4 border-b border-cyan-500/30 flex items-center justify-between">
          <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest">{'//'} OPEN MATCHES</p>
          <button
            onClick={fetchData}
            className="text-cyan-700 hover:text-cyan-400 text-xs transition-colors uppercase tracking-wider"
          >
            새로고침
          </button>
        </div>

        {openMatches.length === 0 ? (
          <div className="text-center py-16 text-cyan-700 text-sm">
            [ 현재 참여 가능한 매치가 없습니다. 새 매치를 생성해보세요! ]
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/60 text-gray-500 text-xs uppercase tracking-wider border-b border-cyan-800/40">
                <th className="py-3 px-4">포맷</th>
                <th className="py-3 px-4 hidden sm:table-cell">팀 A</th>
                <th className="py-3 px-4 hidden sm:table-cell">팀 B</th>
                <th className="py-3 px-4 text-center">인원</th>
                <th className="py-3 px-4 text-center">참여</th>
              </tr>
            </thead>
            <tbody>
              {openMatches.map((match) => {
                const { teamA, teamB } = getTeamNames(match);
                const totalA = (match.team_a_ids || []).length;
                const totalB = (match.team_b_ids || []).length;
                const isMine =
                  (match.team_a_ids || []).includes(user?.id) ||
                  (match.team_b_ids || []).includes(user?.id);

                return (
                  <tr
                    key={match.id}
                    className={`border-b border-cyan-800/30 hover:bg-cyan-900/20 transition-colors ${
                      isMine ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-cyan-300 font-bold text-sm">
                      BO{match.match_type === 5 ? '7' : '5'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm hidden sm:table-cell">
                      {teamA.length > 0 ? teamA.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm hidden sm:table-cell">
                      {teamB.length > 0 ? teamB.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-bold ${(totalA + totalB) >= 6 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {totalA + totalB} / 6
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleJoinMatch(match)}
                        disabled={joining === match.id || !!ongoingMatch}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          isMine
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            : 'bg-cyan-800 hover:bg-cyan-700 text-cyan-200'
                        } disabled:opacity-40`}
                      >
                        {joining === match.id ? '...' : isMine ? '재입장' : '참여'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}