'use client';

import React, { useState } from 'react';
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
import DevConsole from './components/DevConsole';

// 페이지 컴포넌트들
import HomeContent from './pages/HomeContent';
import ClanOverview from './pages/ClanOverview';
import ClanTournament from './pages/ClanTournament';
import MediaGallery from './pages/MediaGallery';
import PagePlaceholder from './pages/PagePlaceholder';

// 훅들
import { useAuth } from './hooks/useAuth';

// === [메인 렌더링] ===
export default function Home() {
  const [activeView, setActiveView] = useState('Home');
  
  const {
    password,
    setPassword,
    isAuthorized,
    profile,
    activeMatchId,
    setActiveMatchId,
    handleLogin,
    getPermissions
  } = useAuth();

  // [관문 1] 개발 서버 비밀번호가 통과되지 않은 경우
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-white p-4">
        <h1 className="text-3xl font-black mb-8 text-yellow-500">ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="비밀번호 입력" 
            className="flex-grow p-4 rounded-xl bg-gray-800 border border-gray-700 text-white" 
          />
          <button type="submit" className="p-4 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400">입장</button>
        </form>
      </div>
    );
  }

  // --- [권한 로직 통합] ---
  const { isAdminOrHigher, isEliteOrHigher, isDeveloper } = getPermissions();

  // [최종] 모든 관문 통과 후 메인 서비스 레이아웃
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={setActiveView} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        
        {/* 🗺️ activeView 매핑 (개발자 슈퍼 유저 권한 적용) */}
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' || activeView === '정회원 전환신청' ? <JoinProcess view={activeView} /> :
         activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지' ? <NoticeBoard /> : 
         activeView === '자유게시판' || activeView === '클랜원 소식' ? <CommunityBoard /> : 

         /* ⚔️ 래더 시스템 매핑 */
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

         /* 👑 운영 관리 영역 (개발자 포함 모든 운영진 가능) */
         (activeView === '가입 심사' || activeView === '관리자' || activeView === '운영진게시판') ? (
           (isAdminOrHigher || (activeView === '가입 심사' && isEliteOrHigher)) ? (
             activeView === '가입 심사' ? <ApplicationList /> :
             activeView === '관리자' ? <AdminMembers /> : <AdminBoard />
           ) : <PagePlaceholder title="인가된 운영진 전용 메뉴입니다." />
         ) :

         /* ⚙️ 시스템 개발 영역 (오직 개발자만 가능) */
         activeView === '개발자' ? (
           isDeveloper ? <DevConsole navigateTo={setActiveView} /> : <PagePlaceholder title="ACCESS DENIED (Developer Only)" />
         ) :

         activeView === '프로필' ? <MyProfile navigateTo={setActiveView} /> :
         activeView === '알림' ? <NotificationCenter /> :
         <PagePlaceholder title={activeView} />}
      </main>
      <Footer />
    </div>
  );
}
