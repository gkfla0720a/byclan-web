'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; 

import Header from './components/Header';
import Footer from './components/Footer';
import LadderDashboard from './components/LadderDashboard';
import RankingBoard from './components/RankingBoard';
import NoticeBoard from './components/NoticeBoard';
import CommunityBoard from './components/CommunityBoard';
import JoinProcess from './components/JoinProcess';
import AdminMembers from './components/AdminMembers';
import ApplicationList from './components/ApplicationList';
import AdminBoard from './components/AdminBoard'; 
import MyProfile from './components/MyProfile';
import NotificationCenter from './components/NotificationCenter';

// --- [공통] 페이지 준비 중 플레이스홀더 ---
function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">이곳은 <strong className="text-white">{title}</strong> 메뉴의 내용을 넣을 공간입니다.</p>
    </div>
  );
}

// --- [클랜 소개] 개요 화면 ---
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

// --- [BSL/토너먼트] 대회 목록 화면 ---
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

// --- [미디어] 갤러리 화면 ---
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

// --- [홈] 메인 대시보드 ---
function HomeContent({ navigateTo }) {
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

// === [메인 렌더링] ===
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('Home');

  const CORRECT_PASSWORD = "1990"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) setIsAuthorized(true);
    else alert("비밀번호가 틀렸습니다!");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-white p-4">
        <h1 className="text-3xl font-black mb-8 text-yellow-500">ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="flex-grow p-4 rounded-xl bg-gray-800 border border-gray-700 text-white" />
          <button type="submit" className="p-4 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-colors">입장</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={setActiveView} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        {/* ✨ activeView에 따른 화면 매핑 (정리 완료) */}
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' || activeView === '정회원 전환신청' ? <JoinProcess view={activeView} /> :
         activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지' ? <NoticeBoard /> : 
         activeView === '자유게시판' || activeView === '클랜원 소식' ? <CommunityBoard /> : 
         activeView === '대시보드' || activeView === 'BY래더시스템' ? <LadderDashboard /> : 
         activeView === '랭킹' || activeView === '시즌별 랭킹' ? <RankingBoard /> : 
         activeView === 'BSL 경기일정 및 결과' || activeView === '진행중인 토너먼트' ? <ClanTournament /> : 
         activeView === '경기 영상' || activeView === '사진 갤러리' ? <MediaGallery /> : 
         activeView === '가입 심사' ? <ApplicationList /> :
         activeView === '관리자' ? <AdminMembers /> :
         activeView === '운영진게시판' ? <AdminBoard /> :
         activeView === '프로필' ? <MyProfile /> :
         activeView === '알림' ? <NotificationCenter /> :
         <PagePlaceholder title={activeView} />}
      </main>
      <Footer />
    </div>
  );
}
