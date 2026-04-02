'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0); // 초 단위 (최대 1200초 = 20분)

  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('id, ByID, is_in_queue, ladder_points').eq('id', user.id).single();
      setProfile(p);

      const { data: q } = await supabase.from('profiles').select('id, ByID, ladder_points').eq('is_in_queue', true);
      setWaitingUsers(q || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAllData();
    const channel = supabase.channel('ladder-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  // ⏱️ 20분(1200초) 자동 대기 취소 타이머
  useEffect(() => {
    let interval;
    if (profile?.is_in_queue) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 1200) {
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

  const toggleQueue = async (forceState = null) => {
    const hasValidNickname = profile?.ByID && profile.ByID.startsWith('By_');
    if (!profile?.is_in_queue && !hasValidNickname) {
      alert("⚠️ 먼저 프로필에서 'By_'로 시작하는 닉네임을 설정해주세요!");
      return;
    }

    const newState = forceState !== null ? forceState : !profile.is_in_queue;
    setProfile({ ...profile, is_in_queue: newState });
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  if (loading) return <div className="py-20 text-center text-cyan-500 font-mono animate-pulse">LADDER ONLINE...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-10 animate-fade-in font-sans">
      
      {/* 🏆 [메인] 초대형 점수판 섹션 */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-center group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        
        <p className="text-gray-500 text-xs font-black tracking-[0.3em] mb-4 uppercase">Current Ladder Rating</p>
        
        {/* ✨ 점수 강조 (가장 크게!) */}
        <div className="relative inline-block">
          <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-600 drop-shadow-[0_10px_20px_rgba(234,179,8,0.3)] italic">
            {profile?.ladder_points || 0}
          </h1>
          <span className="absolute -right-12 bottom-4 text-2xl font-bold text-yellow-600">PTS</span>
        </div>

        <h3 className="text-3xl font-black text-white mt-6 mb-2 tracking-tight">
          {profile?.ByID || '-'}
        </h3>

        {/* ⏱️ 타이머 & 상태 표시 */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {profile?.is_in_queue ? (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/50 px-6 py-2 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-red-400 font-mono font-bold tracking-widest text-lg">
                MATCHING: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')} / 20:00
              </span>
            </div>
          ) : (
            <p className="text-gray-500 font-bold italic tracking-wide">WAITING FOR ENTRY...</p>
          )}

          <button 
            onClick={() => toggleQueue()}
            className={`w-full max-w-sm py-5 rounded-2xl font-black text-xl transition-all transform active:scale-95 shadow-2xl ${
              profile?.is_in_queue 
              ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-white border-b-4 border-blue-800'
            }`}
          >
            {profile?.is_in_queue ? '매칭 취소하기' : '래더 매칭 시작'}
          </button>
        </div>
      </div>

      {/* 👥 대기열 현황 */}
      <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
          <h4 className="text-gray-400 font-bold text-lg">실시간 대기 명단 ({waitingUsers.length})</h4>
          <span className="text-xs text-gray-600 font-mono tracking-tighter uppercase">Real-time sync enabled</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {waitingUsers.map(user => (
            <div key={user.id} className={`relative p-5 rounded-2xl border transition-all ${user.id === profile?.id ? 'border-yellow-500 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-gray-800 bg-gray-800/40 hover:border-gray-600'}`}>
              {user.id === profile?.id && <span className="absolute top-2 right-2 text-[8px] font-bold text-yellow-500 uppercase">You</span>}
              <p className="font-bold text-white text-base truncate mb-1">{user.ByID || '-'}</p>
              <p className="text-xs font-black text-cyan-500 font-mono">{user.ladder_points}P</p>
            </div>
          ))}
          {waitingUsers.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <p className="text-gray-700 italic font-medium">대기 중인 전사가 아직 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
