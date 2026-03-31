'use client';

import React, { useState } from 'react';

export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 👇 여기에 원하는 비밀번호를 설정하세요 (예: byclan77)
  const CORRECT_PASSWORD = "1990"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  // 1. 비밀번호 출입문 화면
  if (!isAuthorized) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }} />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>입장</button>
        </form>
        <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>관리자 전용 테스트 페이지입니다.</p>
      </div>
    );
  }

  // 2. 비밀번호 맞췄을 때 나오는 진짜 화면 (원상복구!)
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* 상단 네비게이션 바 */}
      <header className="flex justify-between items-center p-6 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center font-bold text-slate-900">BC</div>
          <h1 className="text-2xl font-black text-yellow-500">ByClan</h1>
        </div>
        <nav className="hidden md:flex gap-6 font-bold text-slate-300">
          <a href="#" className="hover:text-white">클랜 소개</a>
          <a href="#" className="hover:text-white">BY래더시스템</a>
          <a href="#" className="hover:text-white">커뮤니티</a>
        </nav>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="p-8 max-w-6xl mx-auto">
        {/* 환영 배너 */}
        <div className="bg-slate-800 rounded-2xl p-12 text-center mb-12 border border-slate-700">
          <p className="text-yellow-500 font-bold mb-2">STARCRAFT FAST INFINITE CLAN</p>
          <h2 className="text-5xl font-black mb-6">Welcome to <span className="text-yellow-500">ByClan</span></h2>
          <button className="bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-yellow-400">
            가입 신청하기
          </button>
        </div>

        {/* 랭킹 보드 */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-md">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">🏆 명예의 전당</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="bg-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                <span className="font-bold">By_Slayer</span>
              </div>
              <span className="text-blue-400 font-bold">2150 P</span>
            </div>
            <div className="flex justify-between items-center bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="bg-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                <span className="font-bold">By_Flash</span>
              </div>
              <span className="text-blue-400 font-bold">2080 P</span>
            </div>
            <div className="flex justify-between items-center bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="bg-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
                <span className="font-bold">By_Zergling</span>
              </div>
              <span className="text-blue-400 font-bold">1950 P</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
