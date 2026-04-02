'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);

  // 🔄 데이터 로드 함수 (로그를 추가하여 어디서 막히는지 확인 가능하게 함)
  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 프로필 정보 (ByID, ladder_points 명시적 선택)
      const { data: p, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // 에러 방지를 위해 maybeSingle 사용
      
      if (p) {
        setProfile(p);
        console.log("내 프로필 데이터:", p);
      }

      // 2. 대기열 정보
      const { data: q, error: qError } = await supabase
        .from('profiles')
        .select('id, ByID, ladder_points')
        .eq('is_in_queue', true);
      
      if (q) {
        setWaitingUsers(q);
        console.log("대기열 데이터:", q);
      }

    } catch (e) {
      console.error("데이터 동기화 실패:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // 실시간 구독 설정
    const channel = supabase.channel('ladder-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  // ⏱️ 20분 타이머 로직
  useEffect(() => {
    let interval;
    if (profile?.is_in_queue) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 1200) {
            alert("⚠️ 20분 초과로 대기열에서 제외되었습니다.");
            toggleQueue(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [profile?.is_in_queue]);

  const toggleQueue = async (forceState = null) => {
    if (!profile) return;
    const hasValidNickname = profile.ByID && profile.ByID.startsWith('By_');
    
    if (!profile.is_in_queue && !hasValidNickname) {
      alert("⚠️ 먼저 프로필에서 'By_'로 시작하는 닉네임을 설정해주세요!");
      return;
    }

    const newState = forceState !== null ? forceState : !profile.is_in_queue;
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
    setProfile(prev => ({ ...prev, is_in_queue: newState }));
  };

  if (loading) return <div className="py-24 text-center font-mono text-cyan-500 animate-pulse">LADDER SYSTEM CONNECTING...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans">
      
      {/* 🏆 점수 및 내 상태 섹션 */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50"></div>
        
        <p className="text-gray-500 text-[10px] font-black tracking-widest mb-2">LADDER RATING</p>
        
        {/* 점수 표시 */}
        <div className="mb-4">
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 italic">
            {profile?.ladder_points || 0}
          </span>
          <span className="text-yellow-600 font-bold ml-2">PTS</span>
        </div>

        {/* 닉네임 표시 (ByID) */}
        <h3 className={`text-2xl font-black mb-6 ${profile?.ByID?.startsWith('By_') ? 'text-white' : 'text-red-500'}`}>
          {profile?.ByID || '닉네임 미설정'}
        </h3>

        {/* 타이머 표시 (대기 중일 때만 등장) */}
        {profile?.is_in_queue && (
          <div className="mb-6 inline-flex items-center gap-2 bg-red-900/30 border border-red-500/50 px-5 py-2 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-red-400 font-mono font-bold text-sm">
              매칭 중: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')} / 20:00
            </span>
          </div>
        )}

        <button 
          onClick={() => toggleQueue()}
          className={`w-full max-w-xs py-4 rounded-xl font-black text-lg shadow-xl transition-all active:scale-95 ${
            profile?.is_in_queue ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'
          }`}
        >
          {profile?.is_in_queue ? '매칭 취소하기' : '래더 매칭 시작'}
        </button>
      </div>

      {/* 👥 실시간 대기 명단 섹션 */}
      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
        <h4 className="text-gray-400 font-bold text-sm mb-6 border-b border-gray-800 pb-3 flex justify-between">
          <span>실시간 대기 명단</span>
          <span className="text-cyan-500">{waitingUsers.length}명 대기 중</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {waitingUsers.map(user => (
            <div key={user.id} className={`p-4 rounded-xl border text-center transition-all ${user.id === profile?.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-800 bg-gray-800/40'}`}>
              <p className="font-bold text-white text-sm truncate">{user.ByID || '-'}</p>
              <p className="text-[10px] text-cyan-500 font-black mt-1">{user.ladder_points}P</p>
            </div>
          ))}
          {waitingUsers.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-700 italic text-sm border-2 border-dashed border-gray-800 rounded-xl">
              현재 대기 중인 인원이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
