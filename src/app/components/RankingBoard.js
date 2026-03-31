'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase 연결 초기화 ===
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RankingBoard() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const fetchRankings = async () => {
      // DB에서 전체 랭킹 불러오기
      const { data } = await supabase.from('ladders').select('*').order('rank', { ascending: true });
      if (data) setRankings(data);
    };
    fetchRankings();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ SYSTEM: LADDER RANKING ]
        </h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse">SUPABASE CONNECTED //</span>
      </div>
      <div className="bg-[#0A1128] border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-cyan-900/40 text-cyan-300 text-xs sm:text-sm border-b border-cyan-500/50">
              <th className="py-3 px-4 font-semibold w-16 text-center">RANK</th>
              <th className="py-3 px-4 font-semibold">USER_ID</th>
              <th className="py-3 px-4 font-semibold text-center hidden sm:table-cell">RACE</th>
              <th className="py-3 px-4 font-semibold text-center w-24">MMR</th>
              <th className="py-3 px-4 font-semibold text-center hidden md:table-cell">W / L</th>
              <th className="py-3 px-4 font-semibold text-center hidden sm:table-cell w-24">RATE</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-cyan-600">DB 데이터를 불러오는 중입니다...</td></tr>
            ) : null}
            {rankings.map((player) => (
              <tr key={player.id} className="border-b border-cyan-800/50 hover:bg-cyan-900/30 transition-colors">
                <td className="py-3 px-4 text-center font-bold text-cyan-100">{player.rank}</td>
                <td className="py-3 px-4 font-medium text-cyan-50">
                  <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
                    <span className="text-sm sm:text-base tracking-wide">{player.name}</span>
                    <span className="text-[10px] text-cyan-600 sm:hidden">[{player.race}]</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-400 hidden sm:table-cell">{player.race}</td>
                <td className="py-3 px-4 text-center font-bold text-cyan-300 text-sm sm:text-base drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{player.points}</td>
                <td className="py-3 px-4 text-center text-sm text-gray-400 hidden md:table-cell">
                  <span className="text-emerald-400">{player.win}W</span> / <span className="text-red-400">{player.lose}L</span>
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-500 hidden sm:table-cell">{player.win_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
