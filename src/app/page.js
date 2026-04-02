'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; 

import Header from './components/Header';
import Footer from './components/Footer';
import LadderDashboard from './components/LadderDashboard';
import MatchCenter from './components/MatchCenter'; // ✨ 매치 센터 추가
import RankingBoard from './components/RankingBoard';
import NoticeBoard from './components/NoticeBoard';
import CommunityBoard from './components/CommunityBoard';
import JoinProcess from './components/JoinProcess';
import AdminMembers from './components/AdminMembers';
import ApplicationList from './components/ApplicationList';
import AdminBoard from './components/AdminBoard'; 
import MyProfile from './components/MyProfile';
import NotificationCenter from './components/NotificationCenter';

// --- [플레이스홀더 및 기존 컴포넌트들 생략 가능 - 기존 코드 유지됨] ---
function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">이곳은 <strong className="text-white">{title}</strong> 메뉴의 내용을 넣을 공간입니다.</p>
    </div>
  );
}

// ... (ClanOverview, ClanTournament, MediaGallery, HomeContent 컴포넌트는 기존과 동일하므로 유지) ...
// [공간상 생략하지만 실제 파일에는 그대로 두시면 됩니다]

// === [메인 렌더링] ===
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('Home');
  
  // ⚔️ 래더 시스템 핵심 상태: 현재 참여 중인 경기 ID
  const [activeMatchId, setActiveMatchId] = useState(null);

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
        
        {/* ✨ activeView에 따른 화면 매핑 (통합 로직 적용) */}
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' || activeView === '정회원 전환신청' ? <JoinProcess view={activeView} /> :
         activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지' ? <NoticeBoard /> : 
         activeView === '자유게시판' || activeView === '클랜원 소식' ? <CommunityBoard /> : 

         /* ⚔️ 래더 대시보드 섹션: 경기 유무에 따라 화면 전환 */
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
