'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard({ navigateTo }) {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0); // 초 단위 타이머
  
  // 알림 중복 발송 방지를 위한 Ref
  const lastNotifiedCount = useRef(0);

  const powerLevel = { master: 100, admin: 80, elite: 60, member: 40, rookie: 20, associate: 15, guest: 10 };

  useEffect(() => {
    fetchData();
    const channel = setupSubscriptions();
    return () => supabase.removeChannel(channel);
  }, []);

  // ⏱️ 20분 대기 제한 타이머 로직
  useEffect(() => {
    let interval;
    if (profile?.is_in_queue) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 1200) { // 20분(1200초) 초과 시
            alert("대기 시간이 20분을 초과하여 자동으로 대기열에서 제외됩니다.");
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

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);

      const { data: q } = await supabase.from('profiles').select('*').eq('is_in_queue', true);
      setWaitingUsers(q || []);
      
      // ✨ 알림 트리거 체크 (마지막 1명 / 전원 집결)
      checkNotificationTriggers(q?.length || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const setupSubscriptions = () => {
    return supabase.channel('ladder-system')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchData)
      .subscribe();
  };

  // 📢 상황별 자동 알림 전송 로직
  const checkNotificationTriggers = async (count) => {
    if (count === lastNotifiedCount.current) return;
    lastNotifiedCount.current = count;

    // 1. 마지막 1명 남았을 때 (5, 7, 9명)
    if ([5, 7, 9].includes(count)) {
      await sendGlobalNotification(
        "🔥 레더 인원이 거의 모였습니다!", 
        `현재 ${count}명 대기 중! 마지막 1명이 들어오면 매치가 시작됩니다.`,
        '대시보드'
      );
    }
    // 2. 인원이 다 모였을 때 (6, 8, 10명)
    else if ([6, 8, 10].includes(count)) {
      await sendGlobalNotification(
        "⚔️ 매치 준비 완료!", 
        `${count/2}vs${count/2} 매치 인원이 모두 모였습니다. 지금 바로 동의 버튼을 눌러주세요!`,
        '대시보드'
      );
    }
  };

  const sendGlobalNotification = async (title, message, link) => {
    // 실제 운영 시에는 모든 authenticated 유저에게 insert 하거나 
    // 특정 '전체 알림' 테이블을 활용합니다. 여기서는 현재 대기실 유저들에게 발송 예시.
    const inserts = waitingUsers.map(u => ({
      user_id: u.id,
      title,
      message,
      link_to: link
    }));
    if (inserts.length > 0) await supabase.from('notifications').insert(inserts);
  };

  const toggleQueue = async (forceState = null) => {
    const newState = forceState !== null ? forceState : !profile.is_in_queue;
    await supabase.from('profiles').update({ is_in_queue: newState, vote_to_start: false }).eq('id', profile.id);
  };

  const handleStartMatch = async () => {
    // 전원 동의 시 매치 생성 로직...
    await sendGlobalNotification("🚀 매치 시작!", "전장이 열렸습니다. 게임에 접속하여 승리를 쟁취하세요!", "경기기록");
  };

  if (loading) return <div className="text-center py-20 text-cyan-500 font-mono animate-pulse">SYSTEM LOADING...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 space-y-6 font-sans">
      
      {/* ⏱️ 상단 타이머 및 상태바 */}
      {profile?.is_in_queue && (
        <div className="bg-cyan-900/20 border border-cyan-500/50 p-4 rounded-xl flex justify-between items-center animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-black text-sm">MATCHING TIMER</span>
            <span className="text-white font-mono text-xl">
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')} / 20:00
            </span>
          </div>
          <p className="text-[10px] text-cyan-600 hidden sm:block">20분 초과 시 자동 취소됩니다.</p>
        </div>
      )}

      {/* 🚀 제어판 */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-2xl">
         <div>
            <h3 className="text-2xl font-black text-white">{profile?.ByID}</h3>
            <p className="text-cyan-400 text-sm">Rating: {profile?.ladder_points} P</p>
         </div>
         <button 
           onClick={() => toggleQueue()}
           className={`px-8 py-4 rounded-xl font-black transition-all ${profile?.is_in_queue ? 'bg-red-600' : 'bg-cyan-600'}`}
         >
           {profile?.is_in_queue ? '대기 취소' : '래더 입장'}
         </button>
      </div>

      {/* 5대5 경고 및 투표 UI (이전 코드 동일 유지) */}
      {/* ...생략... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 대기 명단 및 경기 목록 (이전 코드 동일 유지) */}
      </div>
    </div>
  );
}
