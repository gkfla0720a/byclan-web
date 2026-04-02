'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]); // 대기실 인원
  const [liveMatches, setLiveMatches] = useState([]);   // 진행 중 경기
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    setupSubscriptions(); // ✨ 실시간 동기화 시작
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);

      // 1. 대기 중인 인원 가져오기
      const { data: q } = await supabase.from('profiles').select('ByID, ladder_points, race').eq('is_in_queue', true);
      setWaitingUsers(q || []);

      // 2. 진행 중인 경기 가져오기
      const { data: m } = await supabase.from('ladder_matches').select('*, host:host_id(ByID)').eq('status', '진행중');
      setLiveMatches(m || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ✨ 누군가 대기실에 들어오거나 경기를 시작하면 즉시 화면 갱신
  const setupSubscriptions = () => {
    supabase.channel('ladder-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchInitialData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchInitialData)
      .subscribe();
  };

  // 대기실 입장/퇴장 토글
  const toggleQueue = async () => {
    const newState = !profile.is_in_queue;
    const { error } = await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
    if (!error) setProfile({ ...profile, is_in_queue: newState });
  };

  if (loading) return <div className="text-center py-20 text-cyan-500 font-mono animate-pulse">LADDER SYSTEM BOOTING...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 space-y-10 font-sans">
      
      {/* 🚀 상단: 내 상태 및 제어판 */}
      <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-900/50 rounded-full flex items-center justify-center border border-cyan-500 text-cyan-400 font-black">
            {profile?.race?.[0] || '?' }
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{profile?.ByID || '미설정'}</h3>
            <p className="text-cyan-400 font-mono text-sm">Rating: {profile?.ladder_points} P</p>
          </div>
        </div>
        
        <button 
          onClick={toggleQueue}
          className={`px-10 py-4 rounded-xl font-black text-lg transition-all shadow-lg ${
            profile?.is_in_queue 
            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {profile?.is_in_queue ? '대기 중 (취소)' : '래더 대기열 합류'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📋 대기실 (Waiting Room) */}
        <div className="lg:col-span-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h4 className="text-gray-400 font-bold mb-6 flex justify-between items-center">
            <span>👥 대기 중인 멤버</span>
            <span className="text-cyan-500">{waitingUsers.length}명</span>
          </h4>
          <div className="space-y-3">
            {waitingUsers.map((user, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-white font-bold">{user.ByID}</span>
                <span className="text-xs text-gray-500 font-mono">{user.ladder_points} P</span>
              </div>
            ))}
            {waitingUsers.length === 0 && <p className="text-center text-gray-700 py-10 italic">대기 중인 인원이 없습니다.</p>}
          </div>
        </div>

        {/* ⚔️ 진행 중인 경기 (Live Matches) */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h4 className="text-gray-400 font-bold mb-6">🔴 진행 중인 경기</h4>
          <div className="space-y-4">
            {liveMatches.map((match) => (
              <div key={match.id} className="p-5 bg-gray-800 rounded-xl border-l-4 border-cyan-500 shadow-xl">
                <div className="flex justify-between text-xs text-gray-500 mb-4 font-mono">
                  <span>HOST: {match.host?.ByID}</span>
                  <span className="text-cyan-400">LIVE // {match.match_type}vs{match.match_type}</span>
                </div>
                <div className="flex items-center justify-around gap-4">
                  <div className="text-center font-black text-blue-400">TEAM A</div>
                  <div className="text-2xl font-black text-white italic">VS</div>
                  <div className="text-center font-black text-red-400">TEAM B</div>
                </div>
                {/* 추후 세부 팀원 명단 추가 영역 */}
              </div>
            ))}
            {liveMatches.length === 0 && <p className="text-center text-gray-700 py-10 italic">진행 중인 경기가 없습니다.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
