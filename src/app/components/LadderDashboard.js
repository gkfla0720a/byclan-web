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

  // ⏱️ 20분 자동 대기 취소 타이머
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
      alert("⚠️ 먼저 프로필 설정에서 'By_'로 시작하는 닉네임을 설정해주세요!");
      return;
    }

    const newState = forceState !== null ? forceState : !profile.is_in_queue;
    setProfile({ ...profile, is_in_queue: newState });
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  if (loading) return <div className="py-20 text-center text-cyan-500 font-mono animate-pulse">LADDER ONLINE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans">
      
      {/* 🏆 [메인] 최적화된 크기의 점수판 섹션 */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden text-center group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        
        <p className="text-gray-500 text-[10px] font-black tracking-[0.3em] mb-3 uppercase">Ladder Rating</p>
        
        {/* ✨ 점수 강조 (절반 크기로 조정!) */}
        <div className="relative inline-block">
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-600 drop-shadow-[0_5px_15px_rgba(234,179,8,0.3)] italic">
            {profile?.ladder_points || 0}
          </h1>
          <span className="absolute -right-8 bottom-1 text-base font-bold text-yellow-600">PTS</span>
        </div>

        <h3 className="text-2xl font-black text-white mt-4 mb-1 tracking-tight">
          {profile?.ByID || '-'}
        </h3>

        {/* ⏱️ 타이머 & 상태 표시 */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {profile?.is_in_queue ? (
            <div className="flex items-center gap-2.5 bg-red-900/30 border border-red-500/50 px-5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-red-400 font-mono font-bold tracking-widest text-base">
                MATCHING: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')} / 20:00
              </span>
            </div>
          ) : (
            <p className="text-gray-500 font-bold italic tracking-wide text-sm">WAITING FOR ENTRY...</p>
          )}

          <button 
            onClick={() => toggleQueue()}
            className={`w-full max-w-sm py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-2xl ${
              profile?.is_in_queue 
              ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800' 
              : 'bg-cyan-600 hover:bg-cyan-600 text-white border-b-4 border-blue-800'
            }`}
          >
            {profile?.is_in_queue ? '매칭 취소하기' : '래더 매칭 시작'}
          </button>
        </div>
      </div>

      {/* 👥 대기열 현황 */}
      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-3">
          <h4 className="text-gray-400 font-bold text-base">실시간 대기 명단 ({waitingUsers.length})</h4>
          <span className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">Real-time sync</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {waitingUsers.map(user => (
            <div key={user.id} className={`relative p-4 rounded-xl border transition-all ${user.id === profile?.id ? 'border-yellow-500 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-800 bg-gray-800/40 hover:border-gray-600'}`}>
              {user.id === profile?.id && <span className="absolute top-1 right-1 text-[7px] font-bold text-yellow-500 uppercase">You</span>}
              <p className="font-bold text-white text-sm truncate mb-0.5">{user.ByID || '-'}</p>
              <p className="text-[10px] font-black text-cyan-500 font-mono">{user.ladder_points}P</p>
            </div>
          ))}
          {waitingUsers.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-700 italic font-medium text-sm">대기 중인 전사가 아직 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
