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
import LadderPreview from './components/LadderPreview';
import ProfileSidebar from './components/ProfileSidebar';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const {
    profile,
    setProfile,
    activeMatchId,
    setActiveMatchId,
    user,
    needsSetup,
    authLoading,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete
  } = useAuth();

  // navigateTo 래퍼: '로그인' 뷰는 모달로 처리
  const navigateTo = (view) => {
    if (view === '로그인') {
      setShowAuthModal(true);
      return;
    }
    setActiveView(view);
    setShowAuthModal(false);
  };

  // 로그인 모달 표시
  if (showAuthModal && !user) {
    return (
      <div className="min-h-screen bg-[#06060a] flex flex-col justify-center items-center p-4 relative z-10">
        <ImprovedAuthForm onSuccess={(u) => { handleAuthSuccess(u); setShowAuthModal(false); }} />
        <button
          onClick={() => setShowAuthModal(false)}
          className="mt-4 text-gray-500 hover:text-gray-300 text-sm underline"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  // 프로필 설정이 필요한 경우 (신규 가입)
  if (!authLoading && user && needsSetup) {
    return <AuthDashboard user={user} onSetupComplete={handleSetupComplete} />;
  }

  // 신청 대기 중인 경우 (applicant)
  if (!authLoading && user && profile && profile.role === 'applicant') {
    return (
      <div className="min-h-screen bg-[#06060a] flex flex-col">
        <Header navigateTo={navigateTo} />
        <main className="flex-grow flex flex-col justify-center items-center p-4 relative z-10">
          <div className="cyber-card p-8 rounded-xl max-w-md w-full text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
            <p className="text-gray-300 mb-4">
              가입 신청이 접수되었습니다.<br/>
              테스트 결과를 기다려주세요.
            </p>
            <div className="text-sm text-gray-400">
              신청 현황은 &apos;가입 신청&apos; 메뉴에서 확인할 수 있습니다.
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- [권한 로직] ---
  const permissions = getPermissions();
  const isGuest = !user;
  const isVisitor = user && profile && profile.role === 'visitor';
  // 래더 플레이 가능 여부
  const canPlayLadder = permissions.can?.playLadder;

  // 래더 뷰 접근 제어
  const isLadderView = activeView === '대시보드' || activeView === 'BY래더시스템';

  // 현재 뷰 렌더링 결정
  const renderContent = () => {
    // 홈
    if (activeView === 'Home') return <HomeContent navigateTo={navigateTo} />;

    // 공개 페이지들
    if (activeView === '개요') return <ClanOverview />;
    if (activeView === '가입안내') return <VisitorWelcome user={user} onApplicationSubmit={() => {
      const reload = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      };
      reload();
    }} />;
    if (activeView === '가입신청') {
      if (!user) {
        return (
          <div className="w-full max-w-5xl mx-auto mt-8 text-center">
            <div className="cyber-card p-8 rounded-xl inline-block">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-gray-300 mb-4">가입 신청은 로그인 후 이용 가능합니다.</p>
              <button onClick={() => setShowAuthModal(true)} className="px-6 py-2.5 rounded-lg font-bold btn-neon text-sm">
                로그인 / 회원가입
              </button>
            </div>
          </div>
        );
      }
      return <VisitorWelcome user={user} onApplicationSubmit={() => {}} />;
    }
    if (activeView === '정회원 전환신청') return <PagePlaceholder title="정회원 전환 신청은 신입 길드원만 가능합니다." />;
    if (activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지') return <NoticeBoard />;
    if (activeView === '자유게시판' || activeView === '클랜원 소식') return <CommunityBoard />;
    if (activeView === '랭킹' || activeView === '시즌별 랭킹') return <RankingBoard />;
    if (activeView === 'BSL 경기일정 및 결과' || activeView === '진행중인 토너먼트') return <ClanTournament />;
    if (activeView === '경기 영상' || activeView === '사진 갤러리') return <MediaGallery />;

    // 래더 시스템 (권한 없으면 미리보기)
    if (isLadderView) {
      if (!canPlayLadder) {
        return <LadderPreview navigateTo={navigateTo} isGuest={isGuest || isVisitor} />;
      }
      return !activeMatchId
        ? <LadderDashboard onMatchEnter={(id) => setActiveMatchId(id)} />
        : <MatchCenter matchId={activeMatchId} onExit={() => setActiveMatchId(null)} />;
    }

    // 운영 관리 영역
    if (activeView === '가입 심사' || activeView === '관리자' || activeView === '운영진게시판' || activeView === '길드원 관리') {
      if (!user) return <PagePlaceholder title="로그인이 필요합니다." />;
      if (activeView === '가입 심사') return <ApplicationList />;
      if (activeView === '관리자') return <AdminBoard />;
      if (activeView === '길드원 관리') return <GuildManagement />;
      return <AdminBoard />;
    }

    // 개발자 콘솔
    if (activeView === '개발자') {
      return user ? <DevConsole navigateTo={navigateTo} /> : <PagePlaceholder title="로그인이 필요합니다." />;
    }

    // 프로필 / 알림
    if (activeView === '프로필') {
      if (!user) {
        return (
          <div className="w-full max-w-5xl mx-auto mt-8 text-center">
            <div className="cyber-card p-8 rounded-xl inline-block">
              <div className="text-4xl mb-4">👤</div>
              <p className="text-gray-300 mb-4">프로필은 로그인 후 이용 가능합니다.</p>
              <button onClick={() => setShowAuthModal(true)} className="px-6 py-2.5 rounded-lg font-bold btn-neon text-sm">
                로그인
              </button>
            </div>
          </div>
        );
      }
      return <MyProfile navigateTo={navigateTo} />;
    }
    if (activeView === '알림') return user ? <NotificationCenter /> : <PagePlaceholder title="로그인이 필요합니다." />;

    return <PagePlaceholder title={activeView} />;
  };

  // 사이드바가 필요한 뷰
  const sidebarViews = ['Home', '개요', '가입안내', '가입신청', '공지사항', 'BSL 공지사항', '토너먼트 공지', '자유게시판', '클랜원 소식', '랭킹', '시즌별 랭킹', '대시보드', 'BY래더시스템', 'BSL 경기일정 및 결과', '진행중인 토너먼트', '경기 영상', '사진 갤러리'];
  const showSidebar = sidebarViews.includes(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-[#06060a] text-gray-200 font-semibold relative" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <Header navigateTo={navigateTo} />
      
      <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
        {showSidebar ? (
          <div className="w-full flex gap-4 mt-4">
            {/* 좌측 프로필 사이드바 */}
            <ProfileSidebar profile={profile} user={user} navigateTo={navigateTo} />
            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className="w-full">
            {renderContent()}
          </div>
        )}
      </main>
      
      {/* 개발자 설정 패널 */}
      {user && <DevSettingsPanel />}
      
      <Footer />
    </div>
  );
}
