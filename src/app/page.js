'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import Header from './components/Header';
import Footer from './components/Footer';
import RankingBoard from './components/RankingBoard';
import NoticeBoard from './components/NoticeBoard';
import CommunityBoard from './components/CommunityBoard';
import JoinProcess from './components/JoinProcess'; // 👈 가입신청 추가!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function HomeContent({ navigateTo }) { 
  const [topRankers, setTopRankers] = useState([]);

  useEffect(() => {
    const fetchTopRankers = async () => {
      const { data } = await supabase.from('ladders').select('*').order('rank', { ascending: true }).limit(3);
      if (data) setTopRankers(data);
    };
    fetchTopRankers();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-8 px-4">
      <section className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700 shadow-2xl">
        <p className="text-yellow-500 font-bold mb-2">STARCRAFT FAST INFINITE CLAN</p>
        <h2 className="text-5xl font-black mb-6">Welcome to <span className="text-yellow-500">ByClan</span></h2>
        {/* 👇 버튼 누르면 가입신청 메뉴로 이동! */}
        <button onClick={() => navigateTo('가입신청')} className="bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform">가입 신청하기</button>
      </section>

      <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer hover:border-gray-500 transition-colors" onClick={() => navigateTo('랭킹')}>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🏆 명 전당 (Top 3)</h3>
        <div className="space-y-4">
          {topRankers.map((player) => (
            <div key={player.id} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <span className="font-bold text-yellow-500">{player.rank}위. {player.name}</span>
              <span className="font-bold text-sky-400">{player.points} P</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('Home');

  const CORRECT_PASSWORD = "1990"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white font-sans p-4">
        <h1 className="text-3xl font-black mb-8 text-yellow-500">ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="flex-grow p-4 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-yellow-500 text-white" />
          <button type="submit" className="p-4 bg-yellow-500 text-slate-950 font-bold rounded-xl hover:bg-yellow-400">입장</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      <Header navigateTo={setActiveView} />
      <main className="flex-grow">
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '랭킹' ? <RankingBoard /> : 
         activeView === '공지사항' ? <NoticeBoard /> :
         activeView === '자유게시판' ? <CommunityBoard /> :
         activeView === '가입신청' ? <JoinProcess /> : /* 👈 가입신청 연결! */
         <div className="p-20 text-center text-gray-500">{activeView} 페이지 준비 중...</div>}
      </main>
      <Footer />
    </div>
  );
}
