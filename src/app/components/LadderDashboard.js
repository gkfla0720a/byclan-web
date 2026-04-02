'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // 🚀 래더 입장/취소 로직 (닉네임 체크 추가)
  const toggleQueue = async () => {
    // 1. 닉네임 설정 여부 확인
    const hasValidNickname = profile?.ByID && profile.ByID.startsWith('By_');

    if (!profile?.is_in_queue && !hasValidNickname) {
      alert("⚠️ 래더 매칭을 시작하려면 먼저 프로필 설정에서 'By_'로 시작하는 닉네임을 설정해주세요!");
      return; // 함수 종료 (DB 업데이트 안 함)
    }

    const newState = !profile.is_in_queue;
    setProfile({ ...profile, is_in_queue: newState }); // 화면 즉시 반영
    
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  if (loading) return <div className="py-20 text-center text-cyan-500 font-mono animate-pulse">LADDER ONLINE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-black tracking-tighter">BATTLE-NET ID</p>
          <h3 className={`text-2xl font-black ${profile?.ByID?.startsWith('By_') ? 'text-white' : 'text-red-400'}`}>
            {profile?.ByID || '닉네임 미설정'}
          </h3>
          {(!profile?.ByID || !profile.ByID.startsWith('By_')) && (
            <p className="text-[10px] text-yellow-500 animate-pulse">※ 프로필에서 닉네임을 먼저 설정해주세요.</p>
          )}
        </div>
        <button 
          onClick={toggleQueue}
          className={`px-8 py-4 rounded-xl font-black transition-all transform active:scale-95 ${
            profile?.is_in_queue ? 'bg-red-600' : 'bg-cyan-600'
          }`}
        >
          {profile?.is_in_queue ? '대기 취소' : '래더 입장'}
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
        <h4 className="text-gray-400 font-bold text-sm mb-4 border-b border-gray-800 pb-2">실시간 대기 명단 ({waitingUsers.length})</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {waitingUsers.map(user => (
            <div key={user.id} className={`p-3 rounded-lg border text-center ${user.id === profile?.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-800 bg-gray-800/40'}`}>
              <p className="font-bold text-white text-sm truncate">{user.ByID || '-'}</p>
              <p className="text-[10px] text-gray-500">{user.ladder_points}P</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
