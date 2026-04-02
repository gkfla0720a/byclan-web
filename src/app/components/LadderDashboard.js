'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [stats, setStats] = useState({ totalPlayers: 0, totalGames: 0, todayGames: 0 });

  useEffect(() => {
    fetchLadderData();
    // ✨ Supabase Realtime 설정: 누군가 방을 만들거나 경기를 끝내면 즉시 반영!
    const channel = supabase
      .channel('ladder-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, () => {
        fetchLadderData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchLadderData = async () => {
    const { data: matches } = await supabase
      .from('ladder_matches')
      .select('*, host:host_id(ByID)')
      .order('created_at', { ascending: false });
    
    setLiveMatches(matches || []);
    // 실제 운영 시에는 별도의 통계 테이블이나 count 쿼리로 처리합니다.
    setStats({ totalPlayers: 208, totalGames: 263, todayGames: 18 }); 
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 font-sans text-cyan-50">
      
      {/* 📊 상단 실시간 현황판 (사진의 DASHBOARD 감성) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '참여 플레이어', value: stats.totalPlayers, color: 'text-cyan-400' },
          { label: '총 경기 수', value: stats.totalGames, color: 'text-white' },
          { label: '오늘 경기', value: stats.todayGames, color: 'text-emerald-400' },
          { label: '시즌 시작일', value: '2026.03.21', color: 'text-yellow-500' },
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl backdrop-blur-sm shadow-xl">
            <p className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-tighter">{item.label}</p>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 🎮 메인 영역: 실시간 경기 목록 및 팀 구성 */}
      <div className="bg-gray-800/30 border border-cyan-900/30 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-xl font-black flex items-center gap-2">
            <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
            LIVE 경기 <span className="text-gray-500 text-sm ml-2">{liveMatches.length}건 진행 중</span>
          </h3>
          <button className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm transition-all">
            경기 등록 +
          </button>
        </div>

        <div className="p-6 space-y-6">
          {liveMatches.map((match) => (
            <div key={match.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group">
              <div className="flex justify-between items-center mb-4 text-xs font-mono text-gray-500">
                <span>#{match.id.slice(0,4)} | 호스트: {match.host?.ByID}</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-cyan-400 font-bold">{match.match_type}</span>
              </div>

              {/* ⚔️ 대전 레이아웃 (3vs3, 4vs4 대응) */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full text-right space-y-2">
                  <p className="text-xs font-bold text-blue-400 mb-2">TEAM A</p>
                  {/* 팀원 목록 맵핑 (예시 데이터) */}
                  <div className="text-gray-300 font-bold">By_Aplus+ <span className="text-[10px] text-yellow-500">ACE</span></div>
                  <div className="text-gray-400">By_UDU</div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-700 group-hover:text-cyan-500 transition-colors">VS</span>
                  <span className="text-[10px] text-gray-600 mt-1 font-mono">MAP: 투혼</span>
                </div>

                <div className="flex-1 w-full text-left space-y-2">
                  <p className="text-xs font-bold text-red-400 mb-2">TEAM B</p>
                  <div className="text-gray-300 font-bold">By_Grin <span className="text-[10px] text-yellow-500">ACE</span></div>
                  <div className="text-gray-400">By_Dragon</div>
                </div>
              </div>
            </div>
          ))}
          
          {liveMatches.length === 0 && (
            <div className="text-center py-20 text-gray-600 italic">
              현재 대기 중인 래더 경기가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
