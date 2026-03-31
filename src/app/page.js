'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 👇 분리한 컴포넌트들을 불러옵니다
import Footer from './components/Footer';
import RankingBoard from './components/RankingBoard'; 

// === Supabase 연결 초기화 ===
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// === 로고 컴포넌트 === 
function ByClanLogo() {
  const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <img src={logoUrl} alt="ByClan Logo" className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" style={{ filter: "drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.6))" }} />
    </div>
  );
}

function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">이곳은 <strong className="text-white">{title}</strong> 메뉴의 내용을 넣을 공간입니다.</p>
    </div>
  );
}

// === 메인 홈 (대시보드) ===
function HomeContent() {
  const [topRankers, setTopRankers] = useState([]);

  useEffect(() => {
    const fetchTopRankers = async () => {
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
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center group">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
         <div className="relative z-10 px-4">
           <span className="text-yellow-500 font-bold tracking-widest text-xs sm:text-sm mb-2 block">STARCRAFT FAST INFINITE CLAN</span>
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">ByClan</span></h2>
           <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-base mb-6 hidden sm:block">전통과 실력을 자랑하는 최고의 스타크래프트 빠른무한 길드.<br/>지금 바로 래더에 참여하고 당신의 실력을 증명하세요!</p>
           <button className="px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 text-sm sm:text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105">가입 신청하기</button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-700 shadow-xl flex flex-col hover:border-gray-600 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2"><span>🏆</span> 명예의 전당 (Real-time DB)</h3>
            <button className="text-xs text-sky-400 hover:text-sky-300">자세히 보기 &gt;</button>
          </div>
          <div className="flex-grow flex flex-col justify-center space-y-3">
            {topRankers.length === 0 ? <p className="text-center text-gray-500 text-sm py-4">데이터베이스 연동 중...</p> : null}
            {topRankers.map((player) => (
              <div key={player.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 hover:border-yellow-500/30 transition-colors cursor-pointer">
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

// === 전체 앱 렌더링 ===
function ByClanApp() {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [activeView, setActiveView] = useState('Home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordionIndex, setMobileAccordionIndex] = useState(null);
  const menuRefs = useRef([]); 
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) setOpenMenuIndex(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuData = [
    { title: 'BY래더시스템', items: ['대시보드', '랭킹', '경기기록'] },
    { title: '커뮤니티', items: ['공지사항', '자유게시판'] }
  ];

  const navigateTo = (viewName) => {
    setActiveView(viewName);
    setOpenMenuIndex(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

      <nav ref={navRef} className="bg-gray-950 border-b border-gray-800 relative z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('Home')}>
            <ByClanLogo />
            <h1 className="text-2xl sm:text-3xl font-black text-yellow-500">ByClan</h1>
          </div>
          
          <div className="md:hidden flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white p-2">
              {isMobileMenuOpen ? 'X' : '☰'}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-gray-950/95 border-b border-gray-800 z-50 flex flex-col">
            {menuData.map((menu, index) => (
              <div className="flex flex-col border-b border-gray-800/50" key={index}>
                <button onClick={() => setMobileAccordionIndex(mobileAccordionIndex === index ? null : index)} className="px-6 py-4 flex justify-between text-gray-200">
                  {menu.title}
                </button>
                {mobileAccordionIndex === index && (
                  <div className="flex flex-col bg-gray-900/50 py-2">
                    {menu.items.map((subItem, subIndex) => (
                      <span key={subIndex} onClick={() => navigateTo(subItem)} className="px-10 py-3 text-sm text-gray-400">{subItem}</span>
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
         activeView === '랭킹' ? <RankingBoard /> : 
         <PagePlaceholder title={activeView} />}
      </main>

      {/* 모듈화된 푸터 */}
      <Footer />
    </div>
  );
}

// === 비밀번호 잠금 화면 ===
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 👇 여기에 원하는 비밀번호를 설정하세요!
  const CORRECT_PASSWORD = "여기에_비밀번호_입력"; 

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
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" style={{ padding: '10px', borderRadius: '5px', backgroundColor: 'white', color: 'black', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>입장</button>
        </form>
      </div>
    );
  }

  return <ByClanApp />;
}
