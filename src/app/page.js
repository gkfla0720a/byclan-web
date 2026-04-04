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
import ImprovedAuthForm from './components/ImprovedAuthForm';
import AuthDashboard from './components/AuthDashboard';
import VisitorWelcome from './components/VisitorWelcome';
import DevSettingsPanel from './components/DevSettingsPanel';
import GuildManagement from './components/GuildManagement';

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
    user,
    needsSetup,
    handleLogin,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete
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

  // [관문 2] 로그인이 필요한 경우
  if (isAuthorized && !user) {
    return <ImprovedAuthForm onSuccess={handleAuthSuccess} />;
  }

  // [관문 3] 프로필 설정이 필요한 경우
  if (isAuthorized && user && needsSetup) {
    return <AuthDashboard user={user} onSetupComplete={handleSetupComplete} />;
  }

  // [관문 4] 방문자 상태인 경우
  if (isAuthorized && user && profile && profile.role === 'visitor') {
    return <VisitorWelcome user={user} onApplicationSubmit={() => {
      // 가입 신청 후 프로필 다시 로드
      const reloadProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      reloadProfile();
    }} />;
  }

  // [관문 5] 신규 가입자 상태인 경우
  if (isAuthorized && user && profile && profile.role === 'applicant') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl max-w-md text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
          <p className="text-gray-300 mb-4">
            가입 신청이 접수되었습니다.<br/>
            테스트 결과를 기다려주세요.
          </p>
          <div className="text-sm text-gray-400">
            신청 현황은 '가입 신청' 메뉴에서 확인할 수 있습니다.
          </div>
        </div>
      </div>
    );
  }

  // --- [권한 로직 통합] ---
  const permissions = getPermissions();
  
  // 임시 개발자 권한 우회 (이메일 기반)
  const userEmail = user?.email;
  const isDevByEmail = userEmail?.includes('developer') || userEmail?.includes('admin') || userEmail?.includes('test') || userEmail?.includes('gkfla');
  
  // 디버그 로그
  console.log('🔍 권한 확인:', {
    userRole: profile?.role,
    isDeveloper: permissions.isDeveloper,
    isDevByEmail,
    userEmail,
    activeView,
    canAccessAdmin: permissions.canAccessMenu('관리자'),
    canAccessGuild: permissions.canAccessMenu('길드원 관리')
  });

  // [최종] 모든 관문 통과 후 메인 서비스 레이아웃
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-gray-200 font-semibold" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={setActiveView} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-start px-2 sm:px-8 mb-10">
        
        {/* 🗺️ activeView 매핑 (개발자 슈퍼 유저 권한 적용) */}
        {activeView === 'Home' ? <HomeContent navigateTo={setActiveView} /> : 
         activeView === '개요' ? <ClanOverview /> : 
         activeView === '가입안내' || activeView === '가입신청' ? <PagePlaceholder title="가입 신청은 방문자 환영 페이지에서 가능합니다." /> :
         activeView === '정회원 전환신청' ? <PagePlaceholder title="정회원 전환 신청은 신입 길드원만 가능합니다." /> :
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

         /* 👑 운영 관리 영역 */
         (activeView === '가입 심사' || activeView === '관리자' || activeView === '운영진게시판' || activeView === '길드원 관리') ? (
           // 임시로 모든 로그인 사용자에게 접근 권한 부여
           (() => {
             console.log('🔍 운영 관리 영역 접근 시도:', {
               activeView,
               user: !!user,
               userEmail: user?.email,
               permissions: {
                 isDeveloper: permissions.isDeveloper,
                 isDevByEmail,
                 canAccessAdmin: permissions.canAccessMenu('관리자'),
                 canAccessGuild: permissions.canAccessMenu('길드원 관리')
               }
             });
             return user;
           })() ? (
             activeView === '가입 심사' ? <ApplicationList /> :
             activeView === '관리자' ? <AdminBoard /> :
             activeView === '길드원 관리' ? <GuildManagement /> : <AdminBoard />
           ) : <PagePlaceholder title="로그인이 필요합니다." />
         ) :

         /* ⚙️ 시스템 개발 영역 */
         activeView === '개발자' ? (
           user ? <DevConsole navigateTo={setActiveView} /> : <PagePlaceholder title="로그인이 필요합니다." />
         ) :

         activeView === '프로필' ? <MyProfile navigateTo={setActiveView} /> :
         activeView === '알림' ? <NotificationCenter /> :
         <PagePlaceholder title={activeView} />}
      </main>
      
      {/* 개발자 설정 패널 - 임시로 모든 사용자에게 표시 */}
      {user && <DevSettingsPanel />}
      
      <Footer />
    </div>
  );
}
