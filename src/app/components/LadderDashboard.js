'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  // --- [1. 상태 관리] ---
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0); // 20분 타이머 (단위: 초)
  const [isProcessing, setIsProcessing] = useState(false);

  // --- [2. 데이터 불러오기 및 실시간 동기화] ---
  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 내 프로필 정보
      const { data: p } = await supabase.from('profiles').select('id, ByID, is_in_queue, ladder_points').eq('id', user.id).single();
      setProfile(p);

      // 현재 대기열 인원 (ByID와 점수 포함)
      const { data: q } = await supabase.from('profiles').select('id, ByID, ladder_points').eq('is_in_queue', true);
      setWaitingUsers(q || []);
    } catch (e) {
      console.error("데이터 동기화 실패:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // 리얼타임 구독: 프로필 테이블에 변화가 생기면 즉시 다시 읽어옴
    const channel = supabase.channel('ladder-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  // --- [3. 20분 자동 대기 취소 타이머] ---
  useEffect(() => {
    let interval;
    if (profile?.is_in_queue) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 1200) { // 1200초 = 20분
            alert("⚠️ 대기 시간이 20분을 초과하여 자동으로 취소되었습니다.");
            toggleQueue(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [profile?.is_in_queue]);

  // --- [4. 래더 매칭 엔진 (밸런싱)] ---
  const getBalancedTeams = (users) => {
    const size = users.length / 2;
    let bestDiff = Infinity;
    let bestCombination = { teamA: [], teamB: [] };

    const combine = (start, combo) => {
      if (combo.length === size) {
        const teamA = combo;
        const teamB = users.filter(u => !teamA.includes(u));
        const sumA = teamA.reduce((sum, u) => sum + (u.ladder_points || 1000), 0);
        const sumB = teamB.reduce((sum, u) => sum + (u.ladder_points || 1000), 0);
        const diff = Math.abs(sumA - sumB);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCombination = { teamA, teamB };
        }
        return;
      }
      for (let i = start; i < users.length; i++) {
        combine(i + 1, [...combo, users[i]]);
      }
    };
    combine(0, []);
    return bestCombination;
  };

  // --- [5. 주요 액션: 매칭 입장/취소 및 경기 시작] ---
  const toggleQueue = async (forceState = null) => {
    const hasValidNickname = profile?.ByID && profile.ByID.startsWith('By_');
    if (!profile?.is_in_queue && !hasValidNickname) {
      alert("⚠️ 먼저 프로필 설정에서 'By_'로 시작하는 닉네임을 설정해주세요!");
      return;
    }
    const newState = forceState !== null ? forceState : !profile.is_in_queue;
    setProfile({ ...profile, is_in_queue: newState });
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  const startMatch = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const participants = waitingUsers;
      const { teamA, teamB } = getBalancedTeams(participants);

      // 1. 경기 레코드 생성
      const { error: mError } = await supabase.from('ladder_matches').insert({
        match_type: participants.length / 2,
        team_a: teamA.map(u => u.id),
        team_b: teamB.map(u => u.id),
        status: '진행중',
        host_id: profile.id
      });
      if (mError) throw mError;

      // 2. 참여자 대기열 청소
      const pIds = participants.map(u => u.id);
      await supabase.from('profiles').update({ is_in_queue: false }).in('id', pIds);
      
      alert("⚔️ 황금 밸런스 매치가 생성되었습니다! 전장으로 이동하세요.");
    } catch (e) {
      alert("오류 발생: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-cyan-500 font-mono animate-pulse">LADDER ONLINE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans">
      
      {/* 🏆 [상단] 점수판 & 입장 버튼 */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        <p className="text-gray-500 text-[10px] font-black tracking-widest mb-3 uppercase">Ladder Rating</p>
        
        <div className="relative inline-block mb-2">
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-600 drop-shadow-lg italic">
            {profile?.ladder_points || 0}
          </h1>
          <span className="absolute -right-8 bottom-1 text-base font-bold text-yellow-600">PTS</span>
        </div>

        <h3 className={`text-2xl font-black mt-2 mb-6 ${profile?.ByID?.startsWith('By_') ? 'text-white' : 'text-red-500'}`}>
          {profile?.ByID || '닉네임 미설정'}
        </h3>

        <div className="flex flex-col items-center gap-4">
          {profile?.is_in_queue && (
            <div className="bg-red-900/30 border border-red-500/50 px-5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-red-400 font-mono font-bold text-sm">
                MATCHING: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')} / 20:00
              </span>
            </div>
          )}

          <button 
            onClick={() => toggleQueue()}
            className={`w-full max-w-xs py-4 rounded-xl font-black text-lg transition-all active:scale-95 shadow-xl ${
              profile?.is_in_queue ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {profile?.is_in_queue ? '매칭 취소하기' : '래더 매칭 시작'}
          </button>
        </div>
      </div>

      {/* ⚔️ [중단] 매칭 발견 팝업 (6, 8, 10인 시 등장) */}
      {waitingUsers.length >= 6 && waitingUsers.length % 2 === 0 && (
        <div className="bg-cyan-900/40 border-2 border-cyan-500 p-6 rounded-2xl text-center animate-bounce-slow">
          <h4 className="text-white font-black text-xl mb-1">⚔️ 매치 준비 완료! ({waitingUsers.length}인)</h4>
          {waitingUsers.length === 10 && (
            <p className="text-red-400 text-[10px] font-bold mb-3 animate-pulse">⚠️ 5대5 경기는 시간이 매우 길어집니다. 신중히 결정하세요!</p>
          )}
          <button 
            onClick={startMatch}
            disabled={isProcessing}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl shadow-lg transition-all"
          >
            {isProcessing ? '팀 구성 중...' : '황금 밸런스 팀 나누기'}
          </button>
        </div>
      )}

      {/* 👥 [하단] 실시간 대기 명단 */}
      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
        <h4 className="text-gray-400 font-bold text-sm mb-4 border-b border-gray-800 pb-2">실시간 대기 명단 ({waitingUsers.length})</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {waitingUsers.map(user => (
            <div key={user.id} className={`p-4 rounded-xl border ${user.id === profile?.id ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-800 bg-gray-800/40'}`}>
              <p className="font-bold text-white text-sm truncate">{user.ByID || '-'}</p>
              <p className="text-[10px] text-cyan-500 font-black">{user.ladder_points}P</p>
            </div>
          ))}
          {waitingUsers.length === 0 && <p className="col-span-full text-center py-10 text-gray-700 italic text-sm">대기 중인 전사가 없습니다.</p>}
        </div>
      </div>

    </div>
  );
}
