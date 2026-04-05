'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; // ✅ 수정1
import { filterVisibleTestData, isMarkedTestData } from '@/app/utils/testData';

export default function RankingBoard() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const fetchRankings = async () => {
      const { data } = await filterVisibleTestData(supabase
        .from('ladders')
        .select('*')
        .order('ladders_points', { ascending: false })); // ✅ 수정2
      if (data) setRankings(data);
    };
    fetchRankings();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      {/* 헤더 동일 */}
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ SYSTEM: LADDER MMR RANKING ]
        </h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse">SUPABASE CONNECTED //</span>
      </div>
      
      {/* 테이블 동일 */}
      <div className="bg-[#0A1128] border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-sm overflow-hidden relative">
        {/* ... 헤더 동일 ... */}
        <table className="w-full text-left border-collapse relative z-10">
          <thead>{/* 헤더 동일 */}</thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-cyan-600">DB 데이터를 불러오는 중입니다...</td></tr>
            ) : null}
            {rankings.map((player, index) => (  // ✅ index 추가
              <tr key={player.id} className="border-b border-cyan-800/50 hover:bg-cyan-900/30 transition-colors">
                <td className="py-3 px-4 text-center font-bold text-cyan-100">
                  {index + 1}  {/* ✅ 동적 랭킹 */}
                </td>
                <td className="py-3 px-4 font-medium text-cyan-50">
                  <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
                    <span className="text-sm sm:text-base tracking-wide">{player.ByID || player.discord_name}</span>  {/* ✅ 수정3 */}
                    {isMarkedTestData(player) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}
                    <span className="text-[10px] text-cyan-600 sm:hidden">[{player.race}]</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-400 hidden sm:table-cell">{player.race}</td>
                <td className="py-3 px-4 text-center font-bold text-cyan-300 text-sm sm:text-base drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  {player.ladders_points}점  {/* ✅ 수정4 */}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-400 hidden md:table-cell">
                  <span className="text-emerald-400">{player.win}W</span> / <span className="text-red-400">{player.lose}L</span>  {/* ✅ 수정5 */}
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-500 hidden sm:table-cell">
                  {((player.win / (player.win + player.lose)) * 100 || 0).toFixed(1)}%  {/* ✅ 수정6 */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}