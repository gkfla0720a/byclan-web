"use client"; // Next.js에서 화면 조작(클릭 등)을 위해 반드시 필요한 선언문입니다.

import { useState, useRef, useEffect } from 'react';

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
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">이곳은 콘텐츠가 들어갈 영역입니다.</p>
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
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 mt-4 sm:mt-8">
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center group">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
         <div className="relative z-10 px-4">
           <span className="text-yellow-500 font-bold tracking-widest text-xs sm:text-sm mb-2 block">STARCRAFT FAST INFINITE CLAN</span>
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
             Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">ByClan</span>
           </h2>
           <button className="px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 text-sm sm:text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105">
             가입 신청하기
           </button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2 mb-4"><span>🏆</span> 명예의 전당</h3>
          <div className="flex-grow flex flex-col space-y-3">
            {topRankers.map((player) => (
              <div key={player.rank} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold bg-gray-700 text-white">{player.rank}</span>
                  <span className="font-semibold text-gray-200">{player.name}</span>
                </div>
                <span className="font-bold text-sky-400">{player.points} P</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// === 4. Sci-Fi 랭킹 보드 ===
function RankingBoard() {
  const rankings = [
    { rank: 1, name: 'By_Slayer', points: 2150, race: 'Terran', win: 150, lose: 45, winRate: '76.9%' },
    { rank: 2, name: 'By_Flash', points: 2080, race: 'Protoss', win: 132, lose: 50, winRate: '72.5%' },
  ];
  return (
    <div className="w-full max-w-5xl mx-auto mt-4 sm:mt-8 font-mono">
      <div className="flex justify-between items-end mb-4 px-2 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-widest">[ SYSTEM: LADDER RANKING ]</h2>
      </div>
      <div className="bg-[#0A1128] border border-cyan-500/40 rounded-sm overflow-hidden relative p-4">
        {rankings.map(player => (
          <div key={player.rank} className="text-cyan-300 flex justify-between py-2 border-b border-cyan-900">
            <span>{player.rank}. {player.name} [{player.race}]</span>
            <span className="font-bold">{player.points} P</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 메인 페이지 내보내기 (App Container) ===
export default function ByClanHome() {
  const [activeView, setActiveView] = useState('Home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordionIndex, setMobileAccordionIndex] = useState(null);

  const menuData = [
    { title: '클랜 소개', items: ['가입안내', '개요'] },
    { title: 'BY래더시스템', items: ['대시보드', '랭킹', '경기기록'] },
    { title: '커뮤니티', items: ['공지사항', '자유게시판'] }
  ];

  const navigateTo = (viewName) => {
    setActiveView(viewName);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200">
      <nav className="bg-gray-950 border-b border-gray-800 relative z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('Home')}>
            <ByClanLogo />
            <h1 className="text-2xl font-black text-yellow-500">ByClan</h1>
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 p-2">
              {isMobileMenuOpen ? '닫기(X)' : '메뉴(☰)'}
            </button>
          </div>
          
          <ul className="hidden md:flex gap-6">
            {menuData.map((menu, index) => (
              <li key={index}>
                <button onClick={() => navigateTo(menu.items[0])} className="text-gray-300 hover:text-white font-semibold">
                  {menu.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-gray-950/95 border-b border-gray-800 z-50 flex flex-col">
            {menuData.map((menu, index) => (
              <div key={index} className="flex flex-col border-b border-gray-800/50">
                <button onClick={() => setMobileAccordionIndex(mobileAccordionIndex === index ? null : index)} className="px-6 py-4 text-left text-gray-200 font-bold">
                  {menu.title}
                </button>
                {mobileAccordionIndex === index && (
                  <div className="flex flex-col bg-gray-900/50 py-2">
                    {menu.items.map((subItem, subIndex) => (
                      <span key={subIndex} onClick={() => navigateTo(subItem)} className="px-10 py-3 text-sm text-gray-400 cursor-pointer">
                        {subItem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow w-full relative z-10 flex flex-col items-center p-4">
        {activeView === 'Home' ? <HomeContent /> : 
         activeView === '랭킹' ? <RankingBoard /> : 
         <PagePlaceholder title={activeView} />}
      </main>
    </div>
  );
}