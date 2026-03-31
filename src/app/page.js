'use client';

import React, { useState, useRef, useEffect } from 'react';

// === 1. 로고 컴포넌트 === 
function ByClanLogo() {
  const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <img 
        src={logoUrl} alt="ByClan Logo" 
        className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
        style={{ filter: "drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.6))" }}
      />
    </div>
  );
}

// === 2. 임시 서브 페이지 ===
function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">
        이곳은 <strong className="text-white">{title}</strong> 메뉴의 내용을 넣을 공간입니다.<br/>
        추후 이 영역에 원하는 콘텐츠를 개발하여 넣을 수 있습니다.
      </p>
    </div>
  );
}

// === 3. 메인 홈 (대시보드) ===
function HomeContent() {
  const topRankers = [
    { rank: 1, name: 'By_Slayer', points: 2150 },
    { rank: 2, name: 'By_Flash', points: 2080 },
    { rank: 3, name: 'By_Zergling', points: 1950 },
  ];
  const recentNotices = [
    { id: 1, type: '필독', title: '바이클랜 2026년 상반기 통합 랭킹전 안내', date: '03.28' },
    { id: 2, type: '공지', title: '신규 클랜원 가입 조건 및 테스트 안내', date: '03.25' },
    { id: 3, type: '이벤트', title: '주말 빠른무한 내전 참여자 포인트 2배', date: '03.21' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-down mt-4 sm:mt-8">
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center group">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
         <div className="relative z-10 px-4">
           <span className="text-yellow-500 font-bold tracking-widest text-xs sm:text-sm mb-2 block">STARCRAFT FAST INFINITE CLAN</span>
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
             Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">ByClan</span>
           </h2>
           <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-base mb-6 hidden sm:block">전통과 실력을 자랑하는 최고의 스타크래프트 빠른무한 길드.<br/>지금 바로 래더에 참여하고 당신의 실력을 증명하세요!</p>
           <button className="px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 text-sm sm:text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105">
             가입 신청하기
           </button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2"><span>🏆</span> 명예의 전당</h3>
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
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors">
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

// === 4. 개요 ===
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

// === 5. 공지사항 ===
function NoticeBoard() {
  const notices = [
    { id: 1, type: '필독', title: '바이클랜 2026년 상반기 통합 랭킹전 안내', author: '운영진', date: '2026.03.28', views: 142 },
    { id: 2, type: '공지', title: '신규 클랜원 가입 조건 및 테스트 안내', author: '길드마스터', date: '2026.03.25', views: 89 },
    { id: 3, type: '이벤트', title: '주말 빠른무한 내전 참여자 포인트 2배 지급', author: '운영진', date: '2026.03.21', views: 215 },
  ];
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <div className="flex justify-between items-end mb-4 sm:mb-6 px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-md">📢 공지사항</h2>
        <button className="px-4 py-1.5 sm:px-5 sm:py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded shadow-lg transition-colors">글쓰기</button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/80 text-gray-400 text-xs sm:text-sm border-b border-gray-700">
              <th className="py-3 px-2 sm:py-4 sm:px-6 font-semibold w-12 sm:w-20 text-center">번호</th>
              <th className="py-3 px-4 sm:py-4 sm:px-6 font-semibold">제목</th>
              <th className="py-3 px-6 font-semibold w-24 text-center hidden md:table-cell">작성자</th>
              <th className="py-3 px-6 font-semibold w-28 text-center hidden sm:table-cell">작성일</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((post) => (
              <tr key={post.id} className="border-b border-gray-700/50 hover:bg-gray-700/80 transition-colors cursor-pointer group">
                <td className="py-3 px-2 sm:py-4 sm:px-6 text-center text-gray-500 font-medium text-xs sm:text-base">{post.id}</td>
                <td className="py-3 px-4 sm:py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded font-bold shadow-sm w-max shrink-0 ${post.type === '필독' ? 'bg-red-900/60 text-red-400 border border-red-700' : post.type === '공지' ? 'bg-yellow-900/60 text-yellow-400 border border-yellow-700' : 'bg-sky-900/60 text-sky-400 border border-sky-700'}`}>{post.type}</span>
                    <span className="text-gray-200 group-hover:text-yellow-400 transition-colors font-medium text-sm sm:text-base break-keep leading-tight">{post.title}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500 flex gap-2 sm:hidden items-center">
                    <span>{post.author}</span><span>|</span><span>{post.date}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center text-sm text-gray-400 hidden md:table-cell">{post.author}</td>
                <td className="py-4 px-6 text-center text-sm text-gray-500 hidden sm:table-cell">{post.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === 6. 랭킹 보드 ===
function RankingBoard() {
  const rankings = [
    { rank: 1, name: 'By_Slayer', points: 2150, race: 'Terran', win: 150, lose: 45, winRate: '76.9%' },
    { rank: 2, name: 'By_Flash', points: 2080, race: 'Protoss', win: 132, lose: 50, winRate: '72.5%' },
    { rank: 3, name: 'By_Zergling', points: 1950, race: 'Zerg', win: 110, lose: 60, winRate: '64.7%' },
    { rank: 4, name: 'By_Marine', points: 1820, race: 'Terran', win: 95, lose: 55, winRate: '63.3%' },
    { rank: 5, name: 'By_Zealot', points: 1790, race: 'Protoss', win: 88, lose: 62, winRate: '58.6%' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ SYSTEM: LADDER RANKING ]
        </h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse">LIVE DATA //</span>
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
            {rankings.map((player) => (
              <tr key={player.rank} className="border-b border-cyan-800/50 hover:bg-cyan-900/30 transition-colors">
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
                <td className="py-3 px-4 text-center text-sm text-cyan-500 hidden sm:table-cell">{player.winRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === 7. 경기 기록 ===
function MatchRecord() {
  const matches = [
    { id: 1, p1: 'By_Slayer', p1Race: 'T', p2: 'By_Zergling', p2Race: 'Z', winner: 1, map: '투혼', date: '2026.03.29 14:30' },
    { id: 2, p1: 'By_Flash', p1Race: 'P', p2: 'By_Marine', p2Race: 'T', winner: 2, map: '폴리포이드', date: '2026.03.28 21:15' },
    { id: 3, p1: 'By_Zealot', p1Race: 'P', p2: 'By_Slayer', p2Race: 'T', winner: 1, map: '서킷브레이커', date: '2026.03.28 19:00' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ MATCH LOGS ]
        </h2>
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

// === 8. 레더 시스템 ===
function LadderSystem() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono space-y-6">
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest uppercase">
          [ SYSTEM: LADDER RULES & REWARDS ]
        </h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse hidden sm:inline">SECURE CONNECTION //</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#0A1128] p-6 sm:p-8 rounded-sm border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden group hover:border-cyan-400 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
            <span className="text-cyan-500">&gt;&gt;</span> MATCH DIRECTIVES
          </h3>
          <ul className="space-y-4 text-sm sm:text-base text-cyan-100/80 relative z-10">
            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">[&gt;]</span> <span><strong>경기 방식:</strong> 1:1 빠른무한 단판승 (결승/준결승 3판 2선승)</span></li>
            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">[&gt;]</span> <span><strong>결과 보고:</strong> 승자가 디스코드에 리플레이 첨부 및 점수 기록</span></li>
            <li className="flex gap-2 items-start"><span className="text-red-400 mt-0.5">[!]</span> <span className="text-red-200"><strong>경고:</strong> 비매너 행위 적발 시 래더 포인트 전액 몰수</span></li>
          </ul>
        </div>
        <div className="bg-[#0A1128] p-6 sm:p-8 rounded-sm border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
            <span className="text-emerald-500">&gt;&gt;</span> MMR CALCULATION
          </h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-emerald-950/40 p-4 rounded-sm border border-emerald-800/50">
              <span className="text-emerald-100/80 font-semibold">VICTORY (승리)</span>
              <span className="text-emerald-400 font-bold sm:text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">+15 P ~ +25 P</span>
            </div>
            <div className="flex justify-between items-center bg-red-950/40 p-4 rounded-sm border border-red-800/50">
              <span className="text-red-100/80 font-semibold">DEFEAT (패배)</span>
              <span className="text-red-400 font-bold sm:text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">-10 P ~ -15 P</span>
            </div>
            <p className="text-xs text-emerald-500/70 mt-2">* MMR 격차에 따라 획득/상실 포인트 차등 적용</p>
          </div>
        </div>
      </div>
      <div className="bg-[#050B14] p-6 sm:p-8 rounded-sm border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden mt-6">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
         <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2 border-b border-blue-900/50 pb-3">
          <span className="animate-pulse">_</span> SEASON REWARDS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="bg-blue-950/30 p-5 rounded-sm border border-yellow-500/50 text-center flex flex-col items-center hover:bg-blue-900/50 transition-colors shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]">
            <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">🥇</span>
            <span className="font-bold text-yellow-300 text-lg tracking-widest">CHAMPION</span>
            <span className="text-yellow-100/80 text-sm mt-2 font-medium">상금 + 전용 '챔피언' 칭호</span>
          </div>
          <div className="bg-blue-950/30 p-5 rounded-sm border border-gray-400/50 text-center flex flex-col items-center hover:bg-blue-900/50 transition-colors shadow-[inset_0_0_20px_rgba(156,163,175,0.1)]">
            <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(156,163,175,0.6)]">🥈</span>
            <span className="font-bold text-gray-300 text-lg tracking-widest">RUNNER-UP</span>
            <span className="text-gray-400 text-sm mt-2 font-medium">소정의 상품 + 우수 클랜원</span>
          </div>
          <div className="bg-blue-950/30 p-5 rounded-sm border border-amber-600/50 text-center flex flex-col items-center hover:bg-blue-900/50 transition-colors shadow-[inset_0_0_20px_rgba(217,119,6,0.1)]">
            <span className="text-4xl mb-3 drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">🏅</span>
            <span className="font-bold text-amber-500 text-lg tracking-widest">TOP 10</span>
            <span className="text-amber-200/80 text-sm mt-2 font-medium">명예의 전당 영구 기록</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// === 9. 클랜대회 ===
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

// === 10. 커뮤니티 ===
function CommunityBoard() {
  const posts = [
    { id: 105, category: '가입인사', title: '안녕하세요! 새로 가입한 뉴비입니다.', author: '초보저그', date: '14:20', views: 24, comments: 5 },
    { id: 104, category: '잡담', title: '오늘 저녁에 팀플 하실 분 계신가요?', author: 'By_Marine', date: '12:05', views: 45, comments: 12 },
    { id: 103, category: '전략/팁', title: '초반 4드론 막는 꿀팁 공유합니다', author: 'By_Zealot', date: '09:30', views: 156, comments: 8 },
  ];
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <div className="flex justify-between items-end mb-4 sm:mb-6 px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-md">💬 커뮤니티 (자유게시판)</h2>
        <button className="px-4 py-1.5 sm:px-5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded shadow-lg transition-colors">글쓰기</button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/80 text-gray-400 text-xs sm:text-sm border-b border-gray-700">
              <th className="py-3 px-2 sm:py-4 sm:px-6 font-semibold w-16 text-center hidden sm:table-cell">분류</th>
              <th className="py-3 px-4 sm:py-4 sm:px-6 font-semibold">제목</th>
              <th className="py-3 px-6 font-semibold w-24 text-center hidden md:table-cell">작성자</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-gray-700/50 hover:bg-gray-700/80 transition-colors cursor-pointer group">
                <td className="py-3 px-2 sm:py-4 sm:px-6 text-center text-gray-400 font-medium text-xs sm:text-sm hidden sm:table-cell">{post.category}</td>
                <td className="py-3 px-4 sm:py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-gray-400 text-[10px] sm:hidden">[{post.category}]</span>
                    <span className="text-gray-200 group-hover:text-yellow-400 transition-colors font-medium text-sm sm:text-base break-keep">{post.title}</span>
                    <span className="text-sky-400 text-xs font-bold shrink-0">[{post.comments}]</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500 flex gap-2 sm:hidden items-center">
                    <span>{post.author}</span><span>|</span><span>{post.date}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center text-sm text-gray-400 hidden md:table-cell">{post.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === 11. 미디어 갤러리 ===
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

// === 12. 푸터 ===
function Footer() {
  return (
    <footer className="w-full bg-gray-950 border-t border-gray-800 mt-16 py-8 sm:py-12 px-4 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-3">
            <ByClanLogo />
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700">ByClan</span>
          </div>
          <p className="text-gray-500 text-sm">스타크래프트 리마스터 빠른무한 공식 길드</p>
          <p className="text-gray-600 text-xs mt-1">© 2026 ByClan. All rights reserved.</p>
        </div>
        <div className="flex gap-8 text-sm text-gray-400">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-gray-200 font-bold mb-1">지원</span>
            <a href="#" className="hover:text-yellow-500 transition-colors">가입 신청</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">건의사항</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">운영진 문의</a>
          </div>
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-gray-200 font-bold mb-1">규칙</span>
            <a href="#" className="hover:text-yellow-500 transition-colors">클랜 회칙</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">매너 규정</a>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <span className="text-gray-300 font-bold mb-3">공식 커뮤니티 참가</span>
          <button className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-transform hover:scale-105">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Discord 입장
          </button>
        </div>
      </div>
    </footer>
  );
}

// === 13. 가입 및 신청 프로세스 ===
function JoinProcess({ view }) {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-md">📝 {view}</h2>
      </div>
      {view === '가입안내' ? (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-700 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">🔰 신규 클랜원 가입 조건</h3>
          <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
            <li>✔️ <strong>나이:</strong> 20세 이상 성인 남녀</li>
            <li>✔️ <strong>실력:</strong> 초보자부터 고수까지 열정만 있다면 누구나 환영! (단, 기본 매너 필수)</li>
            <li>✔️ <strong>활동:</strong> 주 2회 이상 디스코드 접속 및 게임 참여 권장</li>
          </ul>
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
            <p className="text-sky-400 font-bold mb-1">진행 절차</p>
            <p className="text-sm text-gray-400">가입신청서 작성 ➔ 운영진 확인 ➔ 디스코드 초대 ➔ 간단한 테스트 게임 ➔ 가입 승인</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-700 shadow-xl">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">스타크래프트 닉네임</label>
              <input type="text" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-yellow-500" placeholder="예: By_Newbie" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">주종족</label>
                <select className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-yellow-500">
                  <option>테란 (Terran)</option>
                  <option>저그 (Zerg)</option>
                  <option>프로토스 (Protoss)</option>
                  <option>랜덤 (Random)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">출생년도</label>
                <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-yellow-500" placeholder="예: 1995" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">가입 동기</label>
              <textarea rows="4" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-yellow-500" placeholder="열심히 하겠습니다!"></textarea>
            </div>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold rounded shadow-lg hover:scale-[1.02] transition-transform">
              {view} 제출하기
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// === 14. 포인트 상점 및 내역 ===
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
              <tr className="border-b border-cyan-800/30">
                <td className="py-3 px-4">2026.03.29</td>
                <td className="py-3 px-4">래더 매치 승리 (vs By_Flash)</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">+25</td>
                <td className="py-3 px-4 text-center hidden sm:table-cell">2,450</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// === 15. 진짜 메인 앱 컴포넌트 ===
function ByClanApp() {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [activeView, setActiveView] = useState('Home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordionIndex, setMobileAccordionIndex] = useState(null);
  const menuRefs = useRef([]); 
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuData = [
    { title: '클랜 소개', items: ['가입안내', '가입신청', '정회원 전환신청', '개요'] },
    { title: 'BY래더시스템', items: ['대시보드', '랭킹', '경기기록'] },
    { title: 'BSL', items: ['BSL 공지사항', 'BSL 경기일정 및 결과'] },
    { title: '토너먼트', items: ['토너먼트 공지', '진행중인 토너먼트'] },
    { title: '커뮤니티', items: ['공지사항', '자유게시판', '클랜원 소식'] },
    { title: '포인트', items: ['포인트 상점', '포인트 내역'] }
  ];

  const getDropdownPlacement = (index) => {
    const menuItem = menuRefs.current[index];
    if (!menuItem) return 'left-0';
    return menuItem.getBoundingClientRect().left + 160 > window.innerWidth ? 'right-0' : 'left-0';
  };

  const navigateTo = (viewName) => {
    setActiveView(viewName);
    setOpenMenuIndex(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-semibold selection:bg-yellow-500/30" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {/* 폰트 적용을 위한 링크 */}
      <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

      <nav ref={navRef} className="bg-gray-950 border-b border-gray-800 relative z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('Home')}>
            <ByClanLogo />
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest shrink-0 transition-all duration-300 group-hover:brightness-110" style={{ background: "linear-gradient(155deg, #FFE8C6 0%, #B89C60 20%, #C8A266 40%, #45372A 50%, #5E462E 60%, #B89C60 80%, #2E241C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0px 1px 0px rgba(200, 162, 102, 0.6)) drop-shadow(0px 2px 1px rgba(0, 0, 0, 0.9))", textShadow: "0px 1px 1px rgba(200, 162, 102, 0.4), 0px 1px 0px rgba(0, 0, 0, 0.3)" }}>
              ByClan
            </h1>
          </div>
          
          <ul className="hidden md:flex flex-wrap gap-x-6 items-center justify-end w-full">
            {menuData.map((menu, index) => (
              <li key={index} className="relative" ref={(el) => menuRefs.current[index] = el}>
                <button onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)} className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 text-sm font-semibold">{menu.title}</button>
                {openMenuIndex === index && (
                  <div className={`absolute top-full mt-4 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden ${getDropdownPlacement(index)}`}>
                    {menu.items.map((subItem, subIndex) => (
                      <span key={subIndex} onClick={() => navigateTo(subItem)} className="px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-yellow-500 cursor-pointer transition-colors border-b border-gray-800 last:border-none">{subItem}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li><button className="px-4 py-1.5 border border-gray-600 rounded text-gray-300 text-sm hover:bg-gray-800 transition-colors">LOGIN</button></li>
          </ul>

          <div className="md:hidden flex items-center gap-3">
            <button className="text-gray-300 text-sm font-bold border border-gray-600 px-3 py-1 rounded">LOGIN</button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white p-2 focus:outline-none">
              {isMobileMenuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 z-50 flex flex-col max-h-[80vh] overflow-y-auto animate-fade-in-down">
            {menuData.map((menu, index) => (
              <div key={index} className="flex flex-col border-b border-gray-800/50">
                <button onClick={() => setMobileAccordionIndex(mobileAccordionIndex === index ? null : index)} className="px-6 py-4 flex justify-between items-center text-gray-200 font-bold hover:bg-gray-900 transition-colors">
                  {menu.title} <span className="text-gray-500 text-xs">{mobileAccordionIndex === index ? '▲' : '▼'}</span>
                </button>
                {mobileAccordionIndex === index && (
                  <div className="flex flex-col bg-gray-900/50 py-2">
                    {menu.items.map((subItem, subIndex) => (
                      <span key={subIndex} onClick={() => navigateTo(subItem)} className="px-10 py-3 text-sm text-gray-400 hover:text-yellow-500 active:bg-gray-800 cursor-pointer transition-colors">{subItem}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        {activeView === 'Home' ? <HomeContent /> : 
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

// === 16. 최상위 비밀번호 잠금 컴포넌트 ===
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 👇 여기에 원하는 비밀번호를 설정하세요! (예: byclan77)
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

  // 비밀번호 통과 시 진짜 앱을 렌더링
  return <ByClanApp />;
}
