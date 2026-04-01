'use client';

import React, { useState, useEffect } from 'react';

import { supabase } from '@/supabase'; 

import Header from './components/Header';
import Footer from './components/Footer';
import RankingBoard from './components/RankingBoard';
import NoticeBoard from './components/NoticeBoard';
import CommunityBoard from './components/CommunityBoard';
import JoinProcess from './components/JoinProcess';

function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">이곳은 <strong className="text-white">{title}</strong> 메뉴의 내용을 넣을 공간입니다.</p>
    </div>
  );
}

function ClanOverview() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl p-8 sm:p-12 text-center group">
         <div className="absolute inset-0 bg-gradient-to-b from-gray-700/40 to-transparent pointer-events-none"></div>
         <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 drop-shadow-lg transition-transform duration-500 group-hover:scale-105">최강의 스타크래프트 빠른무한 클랜, ByClan</h2>
         <p className="relative text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">바이클랜은 스타크래프트 빠른무한(빨무)을 즐기는 유저들이 모인 명실상부 최고의 클랜입니다. 체계적인 래더 시스템과 끈끈한 커뮤니티를 바탕으로 함께 성장하며 즐거운 게임 문화를 만들어갑니다.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center shadow-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all cursor-default">
            <span className="text-4xl mb-3 drop-shadow-md">🎮</span>
            <h3 className="text-lg font-bold text-white mb-1">메인 게임</h3>
            <p className="text-gray-400 text-sm">스타크래프트 리마스터<br/>빠른무한 (Fast Infinite)</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center shadow-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            <span className="text-4xl mb-3 drop-shadow-md">👑</span>
            <h3 className="text-lg font-bold text-white mb-1">리더십</h3>
            <p className="text-gray-400 text-sm">길드마스터 및<br/>운영진 체제</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center shadow-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all cursor-default">
            <span className="text-4xl mb-3 drop-shadow-md">⚔️</span>
            <h3 className="text-lg font-bold text-white mb-1">주요 활동</h3>
            <p className="text-gray-400 text-sm">자체 래더 시스템 운영,<br/>정기 클랜전 및 내전</p>
         </div>
      </div>
    </div>
  );
}

function MatchRecord() {
  const matches = [
    { id: 1, p1: 'By_Slayer', p1Race: 'T', p2: 'By_Zergling', p2Race: 'Z', winner: 1, map: '투혼', date: '2026.03.29 14:30' },
    { id: 2, p1: 'By_Flash', p1Race: 'P', p2: 'By_Marine', p2Race: 'T', winner: 2, map: '폴리포이드', date: '2026.03.28 21:15' },
    { id: 3, p1: 'By_Zealot', p1Race: 'P', p2: 'By_Slayer', p2Race: 'T', winner: 1, map: '서킷브레이커', date: '2026.03.28 19:00' },
  ];
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">[ MATCH LOGS ]</h2>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <div key={match.id} className="bg-[#0A1128] border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)] p-4 flex flex-col sm:flex-row justify-between items-center rounded-sm hover:border-cyan-400 transition-colors relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50"></div>
            <div className="text-[10px] sm:text-xs text-cyan-600 mb-2 sm:mb-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex flex-col items-center">
              <span>{match.date}</span>
              <span className="text-cyan-400/70 border border-cyan-800 px-2 py-0.5 mt-1 bg-cyan-900/20">{match.map}</span>
            </div>
            <div className={`flex items-center gap-2 w-full sm:w-1/3 justify-end ${match.winner === 1 ? 'text-cyan-300 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-gray-500'}`}>
              <span className="text-sm sm:text-base">{match.p1}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-sm border ${match.p1Race === 'T' ? 'border-blue-500 text-blue-400' : match.p1Race === 'Z' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'} bg-gray-900`}>{match.p1Race}</span>
            </div>
            <div className="text-cyan-700 font-black text-sm my-2 sm:my-0 px-4">VS</div>
            <div className={`flex items-center gap-2 w-full sm:w-1/3 justify-start ${match.winner === 2 ? 'text-cyan-300 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-gray-500'}`}>
              <span className={`text-xs px-1.5 py-0.5 rounded-sm border ${match.p2Race === 'T' ? 'border-blue-500 text-blue-400' : match.p2Race === 'Z' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'} bg-gray-900`}>{match.p2Race}</span>
              <span className="text-sm sm:text-base">{match.p2}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LadderSystem() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono space-y-6">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest uppercase">[ SYSTEM: LADDER RULES & REWARDS ]</h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse hidden sm:inline">SECURE CONNECTION //</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#0A1128] p-6 sm:p-8 rounded-sm border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden group hover:border-cyan-400 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2"><span className="text-cyan-500">{">>"}</span> MATCH DIRECTIVES</h3>
          <ul className="space-y-4 text-sm sm:text-base text-cyan-100/80 relative z-10">
            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">[{'>'}]</span> <span><strong>경기 방식:</strong> 1:1 빠른무한 단판승</span></li>
            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">[{'>'}]</span> <span><strong>결과 보고:</strong> 승자가 디스코드에 리플레이 첨부 및 점수 기록</span></li>
            <li className="flex gap-2 items-start"><span className="text-red-400 mt-0.5">[!]</span> <span className="text-red-200"><strong>경고:</strong> 비매너 행위 적발 시 포인트 전액 몰수</span></li>
          </ul>
        </div>
        <div className="bg-[#0A1128] p-6 sm:p-8 rounded-sm border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2"><span className="text-emerald-500">{">>"}</span> MMR CALCULATION</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-emerald-950/40 p-4 rounded-sm border border-emerald-800/50">
              <span className="text-emerald-100/80 font-semibold">VICTORY (승리)</span>
              <span className="text-emerald-400 font-bold sm:text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">+15 P ~ +25 P</span>
            </div>
            <div className="flex justify-between items-center bg-red-950/40 p-4 rounded-sm border border-red-800/50">
              <span className="text-red-100/80 font-semibold">DEFEAT (패배)</span>
              <span className="text-red-400 font-bold sm:text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">-10 P ~ -15 P</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#050B14] p-6 sm:p-8 rounded-sm border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden mt-6">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
         <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2 border-b border-blue-900/50 pb-3"><span className="animate-pulse">_</span> SEASON REWARDS</h3>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
           <div className="bg-blue-950/30 p-5 rounded-sm border border-yellow-500/50 text-center flex flex-col items-center shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]">
             <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">🥇</span>
             <span className="font-bold text-yellow-300 text-lg tracking-widest">CHAMPION</span>
             <span className="text-yellow-100/80 text-sm mt-2 font-medium">상금 + 전용 '챔피언' 칭호</span>
           </div>
           <div className="bg-blue-950/30 p-5 rounded-sm border border-gray-400/50 text-center flex flex-col items-center shadow-[inset_0_0_20px_rgba(156,163,175,0.1)]">
             <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(156,163,175,0.6)]">🥈</span>
             <span className="font-bold text-gray-300 text-lg tracking-widest">RUNNER-UP</span>
             <span className="text-gray-400 text-sm mt-2 font-medium">소정의 상품 + 우수 클랜원</span>
           </div>
           <div className="bg-blue-950/30 p-5 rounded-sm border border-amber-600/50 text-center flex flex-col items-center shadow-[inset_0_0_20px_rgba(217,119,6,0.1)]">
             <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">🏅</span>
             <span className="font-bold text-amber-500 text-lg tracking-widest">TOP 10</span>
             <span className="text-amber-200/80 text-sm mt-2 font-medium">명예의 전당 영구 기록</span>
           </div>
         </div>
      </div>
    </div>
  );
}

function ClanTournament() {
  const upcomingTournaments = [
    { id: 1, title: '제 5회 BSL (ByClan StarLeague)', status: '참가 접수중', date: '04.10 ~ 04.30', prize: '우승 30만 포인트' },
    { id: 2, title: '주말 2:2 팀플 매치', status: '진행중', date: '03.28 ~ 03.29', prize: '치킨 기프티콘' }
  ];
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-8">
      <div className="text-center sm:text-left border-b border-gray-700 pb-4 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-md">⚔️ 클랜 대회 및 토너먼트</h2>
        <p className="text-gray-400 mt-2 text-sm sm:text-base break-keep">최고를 가리는 무대! BSL 및 다양한 이벤트 대회의 일정을 확인하세요.</p>
      </div>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {upcomingTournaments.map((tournament) => (
            <div key={tournament.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl relative overflow-hidden group hover:border-yellow-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${tournament.status === '진행중' ? 'bg-red-900/80 text-red-400 border-red-700' : 'bg-sky-900/80 text-sky-400 border-sky-700'}`}>{tournament.status}</span>
                <span className="text-xs text-gray-500 font-medium bg-gray-900 px-2 py-1 rounded">{tournament.date}</span>
              </div>
              <h4 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors">{tournament.title}</h4>
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center gap-2">
                <span className="text-xl">🎁</span><span className="text-sm font-semibold text-yellow-500">{tournament.prize}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MediaGallery() {
  const mediaItems = [
    { id: 1, type: '영상', title: 'BSL 시즌4 결승전 하이라이트', date: '2025.12.20', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
    { id: 2, type: '사진', title: '2025년 바이클랜 연말 모임', date: '2025.12.15', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop' },
    { id: 3, type: '영상', title: '초보자를 위한 가이드', date: '2025.11.05', img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop' },
  ];
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <div className="flex justify-between items-end mb-6 px-2 sm:px-0 border-b border-gray-700 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-md">🎬 미디어 갤러리</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-2 sm:px-0">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl group cursor-pointer hover:border-yellow-500/50 transition-all">
            <div className="relative aspect-video overflow-hidden bg-gray-900">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-[10px] font-bold text-gray-200 border border-gray-600">{item.type}</div>
            </div>
            <div className="p-4">
              <h3 className="text-gray-100 font-bold text-sm sm:text-base mb-1 truncate group-hover:text-yellow-400 transition-colors">{item.title}</h3>
              <p className="text-gray-500 text-xs">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointDashboard({ view }) {
  const shopItems = [
    { id: 1, name: '디스코드 VVIP 역할 (30일)', price: 1000, icon: '👑' },
    { id: 2, name: '닉네임 색상 변경권', price: 500, icon: '🎨' },
    { id: 3, name: '치킨 세트 기프티콘', price: 5000, icon: '🍗' },
    { id: 4, name: '스타벅스 아메리카노', price: 1500, icon: '☕' }
  ];
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-6 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest uppercase">
          [ SYSTEM: {view === '포인트 상점' ? 'POINT SHOP' : 'POINT HISTORY'} ]
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs sm:text-sm">MY POINTS:</span>
          <span className="text-yellow-400 font-bold sm:text-lg">2,450 P</span>
        </div>
      </div>
      {view === '포인트 상점' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map(item => (
            <div key={item.id} className="bg-[#0A1128] border border-cyan-500/30 p-4 rounded-sm flex items-center justify-between hover:border-cyan-400 transition-colors group">
              <div className="flex items-center gap-4">
                <span className="text-3xl bg-cyan-900/30 p-2 rounded">{item.icon}</span>
                <div>
                  <h4 className="text-cyan-100 font-bold group-hover:text-cyan-400 transition-colors">{item.name}</h4>
                  <span className="text-emerald-400 text-sm">{item.price} P</span>
                </div>
              </div>
              <button className="px-4 py-1.5 border border-emerald-500 text-emerald-400 text-sm hover:bg-emerald-500 hover:text-[#0A1128] font-bold transition-colors">구매</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0A1128] border border-cyan-500/40 rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-cyan-900/40 text-cyan-300 text-sm border-b border-cyan-500/50">
              <tr>
                <th className="py-3 px-4">일시</th>
                <th className="py-3 px-4">내용</th>
                <th className="py-3 px-4 text-center">증감</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">잔액</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm">
              <tr className="border-b border-cyan-800/30"><td className="py-3 px-4">2026.03.29</td><td className="py-3 px-4">래더 매치 승리</td><td className="py-3 px-4 text-center text-emerald-400 font-bold">+25</td><td className="py-3 px-4 text-center hidden sm:table-cell">2,450</td></tr>
              <tr className="border-b border-cyan-800/30"><td className="py-3 px-4">2026.03.25</td><td className="py-3 px-4">포인트 상점 이용</td><td className="py-3 px-4 text-center text-red-400 font-bold">-500</td><td className="py-3 px-4 text-center hidden sm:table-cell">2,425</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// === 홈 화면 구성 (기존 HTML 디자인 + Supabase 연동) ===
function HomeContent({ navigateTo }) {
  const [topRankers, setTopRankers] = useState([]);

  useEffect(() => {
    const fetchTopRankers = async () => {
      // Supabase DB 연동 기능은 그대로 살려두었습니다.
      const { data } = await supabase.from('ladders').select('*').order('rank', { ascending: true }).limit(3);
      if (data) setTopRankers(data);
    };
    fetchTopRankers();
  }, []);

  const recentNotices = [
    { id: 1, type: '필독', title: '바이클랜 2026년 상반기 통합 랭킹전 안내', date: '03.28' },
    { id: 2, type: '공지', title: '신규 클랜원 가입 조건 및 테스트 안내', date: '03.25' },
    { id: 3, type: '이벤트', title: '주말 빠른무한 내전 참여자 포인트 2배', date: '03.21' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-down mt-4 sm:mt-8">
      {/* 100% 원본 배너 디자인 복구 */}
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center group">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
         <div className="relative z-10 px-4">
           <span className="text-yellow-500 font-bold tracking-widest text-xs sm:text-sm mb-2 block">STARCRAFT FAST INFINITE CLAN</span>
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
             Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">ByClan</span>
           </h2>
           <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-base mb-6 hidden sm:block">전통과 실력을 자랑하는 최고의 스타크래프트 빠른무한 길드.<br/>지금 바로 래더에 참여하고 당신의 실력을 증명하세요!</p>
           <button onClick={() => navigateTo('가입신청')} className="px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 text-sm sm:text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105">
             가입 신청하기
           </button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigateTo('랭킹')}>
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2"><span>🏆</span> 명예의 전당 (Real DB)</h3>
            <button className="text-xs text-sky-400 hover:text-sky-300">자세히 보기 &gt;</button>
          </div>
          <div className="flex-grow flex flex-col justify-center space-y-3">
            {topRankers.map((player) => (
              <div key={player.rank} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 hover:border-yellow-500/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm shadow-inner ${player.rank === 1 ? 'bg-yellow-500 text-gray-900' : player.rank === 2 ? 'bg-gray-400 text-gray-900' : 'bg-amber-700 text-white'}`}>{player.rank}</span>
                  <span className="font-semibold text-gray-200 text-sm sm:text-base">{player.name}</span>
                </div>
                <span className="font-bold text-sky-400 text-sm sm:text-base">{player.points} P</span>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigateTo('공지사항')}>
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2"><span>📢</span> 최근 클랜 소식</h3>
            <button className="text-xs text-sky-400 hover:text-sky-300">더보기 &gt;</button>
          </div>
          <div className="flex-grow flex flex-col justify-center space-y-2 sm:space-y-3">
            {recentNotices.map((notice) => (
              <div key={notice.id} className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${notice.type === '필독' ? 'bg-red-900/60 text-red-400 border border-red-700/50' : notice.type === '이벤트' ? 'bg-sky-900/60 text-sky-400 border border-sky-700/50' : 'bg-gray-700 text-gray-300 border border-gray-600/50'}`}>{notice.type}</span>
                  <span className="text-sm text-gray-300 group-hover:text-yellow-400 transition-colors truncate">{notice.title}</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0 ml-2">{notice.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// === 메인 페이지 렌더링 영역 ===
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
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-white font-sans p-4">
        <h1 className="text-3xl font-black mb-8 text-yellow-500">ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="flex-grow p-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500 text-white" />
          <button type="submit" className="p-4 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400">입장</button>
        </form>
      </div>
    );
  }

  // 기존 HTML의 'ByClanHome' 렌더링 방식을 Next.js 라우팅(activeView)으로 그대로 매핑했습니다.
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={setActiveView} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' || activeView === '정회원 전환신청' ? <JoinProcess view={activeView} /> :
         activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지' ? <NoticeBoard /> : 
         activeView === '자유게시판' || activeView === '클랜원 소식' ? <CommunityBoard /> : 
         activeView === '대시보드' ? <LadderSystem /> : 
         activeView === '랭킹' || activeView === '시즌별 랭킹' ? <RankingBoard /> : 
         activeView === '경기기록' ? <MatchRecord /> : 
         activeView === 'BSL 경기일정 및 결과' || activeView === '진행중인 토너먼트' ? <ClanTournament /> : 
         activeView === '포인트 상점' || activeView === '포인트 내역' ? <PointDashboard view={activeView} /> :
         activeView === '경기 영상' || activeView === '사진 갤러리' ? <MediaGallery /> : 
         <PagePlaceholder title={activeView} />}
      </main>
      
      <Footer />
    </div>
  );
}