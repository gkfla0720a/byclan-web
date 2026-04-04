'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

function HomeContent({ navigateTo }) {
  const [topRankers, setTopRankers] = useState([]);

  useEffect(() => {
    const fetchTopRankers = async () => {
      try {
        const { data, error } = await supabase
          .from('ladders')
          .select('*')
          .order('rank', { ascending: true })
          .limit(3);
        
        if (error) throw error;
        if (data) setTopRankers(data);
      } catch (error) {
        console.error('랭킹 데이터 로딩 실패:', error);
      }
    };
    
    fetchTopRankers();
  }, []);

  const recentNotices = [
    { id: 1, type: '필독', title: '바이클랜 2026년 상반기 통합 랭킹전 안내', date: '03.28' },
    { id: 2, type: '공지', title: '신규 클랜원 가입 조건 및 테스트 안내', date: '03.25' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-down mt-4 sm:mt-8">
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20"></div>
         <div className="relative z-10 px-4">
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Welcome to <span className="text-yellow-500">ByClan</span></h2>
           <button onClick={() => navigateTo('가입신청')} className="px-6 py-2.5 bg-yellow-500 text-gray-900 font-bold rounded-full shadow-lg">가입 신청하기</button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('랭킹')}>
          <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🏆 명예의 전당</h3>
          <div className="space-y-3">
            {topRankers.map((p) => (
              <div key={p.rank} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                <span className="text-gray-200 font-semibold">{p.rank}위 {p.name}</span>
                <span className="font-bold text-sky-400">{p.points} P</span>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('공지사항')}>
          <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">📢 최근 소식</h3>
          <div className="space-y-3">
            {recentNotices.map((n) => (
              <div key={n.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{n.title}</span>
                <span className="text-gray-500 text-xs ml-2">{n.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomeContent;
