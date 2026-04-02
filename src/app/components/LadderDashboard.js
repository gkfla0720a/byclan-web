'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);

  // ✨ 권한 레벨 정의
  const powerLevel = { master: 100, admin: 80, elite: 60, member: 40, rookie: 20, associate: 15, guest: 10, expelled: 0 };

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, ByID')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // ✨ 신입 길드원(rookie) 이상인 경우에만 실제 데이터를 불러옵니다.
      if (profileData && powerLevel[profileData.role] >= powerLevel['rookie']) {
        const { data: matches } = await supabase
          .from('ladder_matches')
          .select('*, host:host_id(ByID)')
          .order('created_at', { ascending: false });
        setLiveMatches(matches || []);
      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500 font-mono animate-pulse">SYSTEM INITIALIZING...</div>;

  // 🔒 권한 부족 시 보여줄 "래더 티저(Teaser)" 화면
  if (!profile || powerLevel[profile.role] < powerLevel['rookie']) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 animate-fade-in-down">
        <div className="relative bg-gray-900 rounded-3xl border-2 border-dashed border-cyan-900/50 p-10 sm:p-20 overflow-hidden text-center shadow-2xl">
          {/* 배경 데코레이션 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <span className="text-6xl mb-6 block drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">🔒</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tighter">
              BYCLAN <span className="text-cyan-400">LADDER SYSTEM</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              래더 대시보드 및 실시간 경기 매칭 시스템은 <br className="hidden sm:block" />
              <strong className="text-yellow-500">정식 길드원(신입 이상)</strong>에게만 제공되는 특권입니다.
            </p>
            
            {/* 맛보기 이미지/아이콘 섹션 */}
            <div className="grid grid-cols-3 gap-4 mb-10 opacity-30 grayscale">
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">REALTIME</p>
                  <div className="h-2 w-full bg-gray-700 rounded-full"></div>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 scale-110">
                  <p className="text-[10px] text-cyan-500 font-bold mb-1">BALANCING</p>
                  <div className="h-2 w-full bg-cyan-900 rounded-full"></div>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">BETTING</p>
                  <div className="h-2 w-full bg-gray-700 rounded-full"></div>
               </div>
            </div>

            <button 
              onClick={() => window.location.href = '#'} // 가입안내 섹션으로 이동하도록 추후 수정
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all hover:scale-105"
            >
              정식 길드원 신청하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 신입 길드원 이상에게 보여줄 실제 "래더 대시보드" 화면
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 font-sans text-cyan-50 animate-fade-in-down">
      
      {/* 상단 실시간 현황판 (기존 코드와 동일) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '참여 플레이어', value: '208', color: 'text-cyan-400' },
          { label: '총 경기 수', value: '263', color: 'text-white' },
          { label: '오늘 경기', value: '18', color: 'text-emerald-400' },
          { label: '시즌 시작일', value: '2026.03.21', color: 'text-yellow-500' },
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl backdrop-blur-sm shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <p className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-tighter">{item.label}</p>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 메인 영역: 실시간 경기 목록 (기존 코드와 동일) */}
      <div className="bg-gray-800/30 border border-cyan-900/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-xl font-black flex items-center gap-2">
            <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
            LIVE 경기 <span className="text-gray-500 text-sm ml-2">{liveMatches.length}건 진행 중</span>
          </h3>
          <button className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg active:scale-95">
            경기 등록 +
          </button>
        </div>

        <div className="p-6 space-y-6">
          {liveMatches.map((match) => (
            <div key={match.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group relative overflow-hidden">
              {/* 경기 정보 렌더링... */}
            </div>
          ))}
          
          {liveMatches.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-600 italic text-lg mb-2">현재 대기 중인 래더 경기가 없습니다.</p>
              <p className="text-gray-700 text-sm">By_ 닉네임 설정 후 직접 경기를 생성해 보세요!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
