'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; 

import Header from './components/Header';
import Footer from './components/Footer';
import LadderDashboard from './components/LadderDashboard';
import MatchCenter from './components/MatchCenter'; 
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
         <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 drop-shadow-lg">최강의 스타크래프트 빠른무한 클랜, ByClan</h2>
         <p className="relative text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">바이클랜은 스타크래프트 빠른무한(빨무)을 즐기는 유저들이 모인 명실상부 최고의 클랜입니다.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">🎮</span>
            <h3 className="text-lg font-bold text-white">메인 게임</h3>
            <p className="text-gray-400 text-sm">빠른무한 (Fast Infinite)</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">👑</span>
            <h3 className="text-lg font-bold text-white">리더십</h3>
            <p className="text-gray-400 text-sm">운영진 체제</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">⚔️</span>
            <h3 className="text-lg font-bold text-white">활동</h3>
            <p className="text-gray-400 text-sm">자체 래더 및 내전</p>
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
      <div className="text-center sm:text-left border-b border-gray-700 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">⚔️ 클랜 대회 및 토너먼트</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {upcomingTournaments.map((t) => (
          <div key={t.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <span className="text-xs font-bold px-3 py-1 bg-sky-900/80 text-sky-400 rounded-full">{t.status}</span>
            <h4 className="text-xl font-bold text-white mt-4 mb-2">{t.title}</h4>
            <p className="text-sm text-yellow-500 font-semibold">🎁 {t.prize}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- [미디어] 갤러리 화면 ---
function MediaGallery() {
  const mediaItems = [
    { id: 1, type: '영상', title: 'BSL 시즌4 결승전 하이라이트', date: '2025.12.20', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
    { id: 2, type: '사진', title: '2025년 바이클랜 연말 모임', date: '2025.12.15', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop' },
  ];
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">🎬 미디어 갤러리</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            <img src={item.img} className="w-full aspect-video object-cover opacity-70" alt="" />
            <div className="p-4">
              <h3 className="text-white font-bold truncate">{item.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{item.date}</p>
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

// === [메인 렌더링] ===
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('Home');
  
  // ⚔️ 래더 시스템용 상태: 진행 중인 경기 ID
  const [activeMatchId, setActiveMatchId] = useState(null);

  const CORRECT_PASSWORD = "1990"; 

  // 페이지 진입 시 내가 참여 중인 경기가 있는지 수시로 체크 (새로고침 대응)
  useEffect(() => {
    if (!isAuthorized) return;
    
    const checkActiveMatch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase.from('ladder_matches')
        .select('id').eq('status', '진행중')
        .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`).maybeSingle();
      
      if (m) setActiveMatchId(m.id);
    };
    checkActiveMatch();
  }, [isAuthorized]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) setIsAuthorized(true);
    else alert("비밀번호가 틀렸습니다!");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-white p-4">
        <h1 className="text-3xl font-black mb-8 text-yellow-500">ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-4 w-full max-sm">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="flex-grow p-4 rounded-xl bg-gray-800 border border-gray-700 text-white" />
          <button type="submit" className="p-4 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400">입장</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={setActiveView} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        
        {/* ✨ activeView 매핑 로직 */}
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' || activeView === '정회원 전환신청' ? <JoinProcess view={activeView} /> :
         activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지' ? <NoticeBoard /> : 
         activeView === '자유게시판' || activeView === '클랜원 소식' ? <CommunityBoard /> : 

         /* ⚔️ 래더 시스템 통합 영역 */
         (activeView === '대시보드' || activeView === 'BY래더시스템') ? (
           !activeMatchId ? (
             <LadderDashboard onMatchEnter={(id) => setActiveMatchId(id)} />
           ) : (
             <MatchCenter matchId={activeMatchId} onExit={() => setActiveMatchId(null)} />
           )
         ) : 

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
