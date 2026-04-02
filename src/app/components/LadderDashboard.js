'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard({ onMatchEnter }) {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. 프로필 및 현재 참여 중인 경기 확인
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(p);

    const { data: m } = await supabase.from('ladder_matches')
      .select('id').eq('status', '진행중')
      .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`).maybeSingle();
    
    if (m) onMatchEnter(m.id);

    // 2. 대기열 목록
    const { data: q } = await supabase.from('profiles').select('id, ByID, ladder_points').eq('is_in_queue', true);
    setWaitingUsers(q || []);
    setLoading(false);
  }, [onMatchEnter]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('lobby').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const toggleQueue = async () => {
    if (!profile?.ByID?.startsWith('By_')) return alert("⚠️ 'By_' 닉네임 설정이 필요합니다.");
    await supabase.from('profiles').update({ is_in_queue: !profile.is_in_queue }).eq('id', profile.id);
  };

  if (loading) return <div className="py-20 text-center font-mono text-cyan-500 animate-pulse">BOOTING BYCLAN LADDER...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* 초대형 점수 UI */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 text-center shadow-2xl">
        <p className="text-gray-500 text-[10px] font-black tracking-widest mb-2">LADDER RATING</p>
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 italic mb-4">
          {profile?.ladder_points || 0}<span className="text-lg ml-2 text-yellow-600">PTS</span>
        </h1>
        <h3 className="text-white font-black text-xl mb-6">{profile?.ByID}</h3>
        <button 
          onClick={toggleQueue}
          className={`w-full max-w-xs py-4 rounded-xl font-black text-lg shadow-xl ${profile?.is_in_queue ? 'bg-red-600' : 'bg-cyan-600'}`}
        >
          {profile?.is_in_queue ? '매칭 취소' : '래더 매칭 시작'}
        </button>
      </div>

      {/* 대기 명단 현황 */}
      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
        <h4 className="text-gray-400 font-bold text-sm mb-4 border-b border-gray-800 pb-2">실시간 대기 ({waitingUsers.length})</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {waitingUsers.map(user => (
            <div key={user.id} className="p-3 bg-gray-800 border border-gray-700 rounded-xl text-center">
              <p className="font-bold text-white text-xs">{user.ByID}</p>
              <p className="text-[10px] text-cyan-500 font-mono">{user.ladder_points}P</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
