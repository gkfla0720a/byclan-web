'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard({ onMatchStart }) {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null); // 진행 중인 경기 ID
  const [timer, setTimer] = useState(0);

  const fetchAllData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. 프로필 및 진행 중인 경기 확인
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(p);

    // 2. 내가 참여 중인 '진행중'인 경기가 있는지 확인
    const { data: m } = await supabase.from('ladder_matches')
      .select('id')
      .eq('status', '진행중')
      .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`)
      .maybeSingle();
    
    if (m) setActiveMatchId(m.id);

    // 3. 대기열 목록
    const { data: q } = await supabase.from('profiles').select('id, ByID, ladder_points').eq('is_in_queue', true);
    setWaitingUsers(q || []);
  }, []);

  useEffect(() => {
    fetchAllData();
    const channel = supabase.channel('lobby').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAllData]);

  const toggleQueue = async () => {
    if (!profile?.ByID?.startsWith('By_')) return alert("⚠️ 'By_' 닉네임 설정이 필요합니다.");
    const newState = !profile.is_in_queue;
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  // 🛡️ 매칭 성공 시 MatchRoom으로 이동하는 버튼 (부모 컴포넌트에 matchId 전달)
  if (activeMatchId) {
    return (
      <div className="py-20 text-center space-y-6">
        <h2 className="text-3xl font-black text-white animate-pulse">⚔️ 전장이 준비되었습니다!</h2>
        <button 
          onClick={() => onMatchStart(activeMatchId)}
          className="px-12 py-6 bg-yellow-500 text-black font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.5)]"
        >
          경기장 입장하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      {/* 🏆 점수판 UI (기존 맘에 들어하신 그 디자인) */}
      <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 text-center shadow-2xl">
        <p className="text-gray-500 text-[10px] font-black tracking-widest mb-2">LADDER RATING</p>
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 italic mb-4">
          {profile?.ladder_points || 0}<span className="text-lg ml-2 text-yellow-600">PTS</span>
        </h1>
        <button 
          onClick={toggleQueue}
          className={`w-full max-w-xs py-4 rounded-xl font-black text-lg ${profile?.is_in_queue ? 'bg-red-600' : 'bg-cyan-600'}`}
        >
          {profile?.is_in_queue ? '매칭 취소' : '래더 매칭 시작'}
        </button>
      </div>
      
      {/* 대기 명단... (생략, 기존 UI 유지) */}
    </div>
  );
}
