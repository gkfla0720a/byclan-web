'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 내 프로필 (ByID, discord_name 등 오타 대비 안전하게 가져오기)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) setProfile(p);

      // 대기열 (데이터가 없으면 빈 배열 [] 로 초기화해서 에러 방지)
      const { data: q } = await supabase.from('profiles').select('*').eq('is_in_queue', true);
      setWaitingUsers(q || []);

      // 진행 중 경기
      const { data: m } = await supabase.from('ladder_matches').select('*, host:host_id(ByID)').eq('status', '진행중');
      setLiveMatches(m || []);

    } catch (e) {
      console.error("데이터 동기화 실패:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const channel = supabase.channel('ladder-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchAllData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  if (loading) return <div className="py-24 text-center text-cyan-500 font-mono animate-pulse">BOOTING...</div>;

  // ✨ 안전 장치: profile이 없을 때를 대비한 기본값 설정
  const qCount = waitingUsers?.length || 0;
  const myID = profile?.ByID || profile?.nickname || "Unknown";

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl flex justify-between items-center shadow-2xl">
         <div>
            <p className="text-gray-500 text-xs font-bold mb-1">PLAYER</p>
            <h3 className="text-2xl font-black text-white">{myID}</h3>
         </div>
         <div className="text-right">
            <p className="text-gray-500 text-xs font-bold mb-1">TOTAL QUEUE</p>
            <p className="text-3xl font-black text-cyan-400">{qCount}명</p>
         </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
        <h4 className="text-gray-400 font-bold mb-4">실시간 대기 명단</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {waitingUsers.map(user => (
            <div key={user.id} className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-center">
              <p className="text-white font-bold">{user.ByID || "참가자"}</p>
            </'use client';

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

  const toggleQueue = async () => {
    const newState = !profile.is_in_queue;
    setProfile({ ...profile, is_in_queue: newState }); // 낙관적 업데이트
    await supabase.from('profiles').update({ is_in_queue: newState }).eq('id', profile.id);
  };

  if (loading) return <div className="py-20 text-center text-cyan-500 font-mono animate-pulse">LADDER ONLINE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-black tracking-tighter">BATTLE-NET ID</p>
          <h3 className="text-2xl font-black text-white">{profile?.ByID || '-'}</h3>
        </div>
        <button 
          onClick={toggleQueue}
          className={`px-8 py-4 rounded-xl font-black transition-all transform active:scale-95 ${profile?.is_in_queue ? 'bg-red-600' : 'bg-cyan-600'}`}
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
>
          ))}
        </div>
      </div>
    </div>
  );
}
