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
import ClanMembers from './pages/ClanMembers';
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
    password,
    setPassword,
    isAuthorized,
    homeGateReady,
    setIsAuthorized,
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

  if (!homeGateReady) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8 text-center">
          <div className="text-gray-500 text-sm">ByClan 로딩 중...</div>
        </div>
      </div>
    );
  }

  // [홈게이트 메모] 이 비밀번호 게이트('1990')는 실제 서비스 운영 중에는
  // 비활성화되어야 하는 임시 보안문입니다.
  // 코드 점검, 정기 유지보수, 배포 전 사전 확인 등 특정 상황에서만 일시적으로
  // 활성화하여 외부 접근을 차단하는 용도로 사용됩니다.
  // 운영 환경에서는 isAuthorized 초기값을 true로 설정하거나
  // 이 게이트 로직 전체를 조건부로 비활성화해야 합니다.
  const handlePasswordGateSubmit = (e) => {
    e.preventDefault();

    if (password === '1990') {
      setIsAuthorized(true);
      setPassword('');
      return;
    }

    alert('초기 접속 비밀번호가 올바르지 않습니다.');
    setPassword('');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-2xl font-black text-cyan-400 mb-3" style={{ textShadow: '0 0 12px rgba(0,212,255,0.35)' }}>
            ByClan 초기 접속 인증
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            홈페이지 최초 진입 시 보안 비밀번호가 필요합니다.<br />
            인증 후에는 로그인 없이도 홈, 개요, 가입 안내를 둘러볼 수 있습니다.
          </p>
          <form onSubmit={handlePasswordGateSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="초기 비밀번호 입력"
              className="w-full rounded-xl border border-cyan-500/30 bg-[#0d0d14] px-4 py-3 text-center text-white outline-none focus:border-cyan-400"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-xl py-3 font-black btn-neon text-sm"
            >
              ENTER BYCLAN
            </button>
          </form>
          <p className="mt-4 text-[11px] text-gray-600">
            인증 후 방문자 권한으로 둘러보기만 가능하며, 래더 시스템은 별도 권한이 필요합니다.
          </p>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 relative z-10">
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
      <div className="min-h-screen bg-transparent flex flex-col">
        <Header navigateTo={navigateTo} />
        <main className="flex-grow flex flex-col justify-center items-center p-4 relative z-10">
          <div className="cyber-card p-8 rounded-xl max-w-md w-full text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
            <p className="text-gray-300 mb-4">
              가입 신청이 접수되었습니다.<br/>
              테스트 결과를 기다려주세요.
            </p>
            <div className="text-sm text-gray-400 mb-5">
              신청 현황과 운영진 안내는 알림함에서 확인할 수 있으며, 가입 안내에서 절차와 주의사항을 다시 볼 수 있습니다.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigateTo('알림')}
                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors"
              >
                알림함 열기
              </button>
              <button
                onClick={() => navigateTo('가입안내')}
                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                가입 안내 보기
              </button>
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
  const requiresDiscordLink = permissions.can?.requiresDiscordLink;

  // 래더 뷰 접근 제어
  const isLadderView = activeView === '대시보드' || activeView === 'BY래더시스템';

  // 현재 뷰 렌더링 결정
  const renderContent = () => {
    // 홈
    if (activeView === 'Home') return <HomeContent navigateTo={navigateTo} />;

    // 공개 페이지들
    if (activeView === '개요') return <ClanOverview />;
    if (activeView === '클랜원') return <ClanMembers />;
    if (activeView === '가입안내') return <VisitorWelcome user={user} profile={profile} mode="guide" navigateTo={navigateTo} onApplicationSubmit={() => {
      const reload = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      };
      reload();
    }} />;
    if (activeView === '가입신청') return <VisitorWelcome user={user} profile={profile} mode="guide" navigateTo={navigateTo} onApplicationSubmit={() => {}} />;
    if (activeView === '정회원 전환신청') return <PagePlaceholder title="정회원 전환 신청은 신입 길드원만 가능합니다." />;
    if (activeView === '공지사항' || activeView === 'BSL 공지사항' || activeView === '토너먼트 공지') return <NoticeBoard />;
    if (activeView === '자유게시판' || activeView === '클랜원 소식') return <CommunityBoard />;
    if (activeView === '랭킹' || activeView === '시즌별 랭킹') return <RankingBoard />;
    if (activeView === 'BSL 경기일정 및 결과' || activeView === '진행중인 토너먼트') return <ClanTournament />;
    if (activeView === '경기 영상' || activeView === '사진 갤러리') return <MediaGallery />;

    // 래더 시스템 (권한 없으면 미리보기)
    if (isLadderView) {
      if (!canPlayLadder) {
        return (
          <LadderPreview
            navigateTo={navigateTo}
            isGuest={isGuest || isVisitor}
            requiresDiscordLink={requiresDiscordLink}
          />
        );
      }
      return !activeMatchId
        ? <LadderDashboard onMatchEnter={(id) => setActiveMatchId(id)} />
        : <MatchCenter matchId={activeMatchId} onExit={() => setActiveMatchId(null)} />;
    }

    // 운영 관리 영역
    if (activeView === '가입 심사' || activeView === '관리자' || activeView === '운영진게시판' || activeView === '길드원 관리') {
      if (!user) return <PagePlaceholder title="로그인이 필요합니다." />;
      if (activeView === '가입 심사') return <ApplicationList />;
      if (activeView === '관리자') return <AdminBoard navigateTo={navigateTo} />;
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
    if (activeView === '알림') return user ? <NotificationCenter navigateTo={navigateTo} profile={profile} /> : <PagePlaceholder title="로그인이 필요합니다." />;

    return <PagePlaceholder title={activeView} />;
  };

  // 사이드바가 필요한 뷰
  const sidebarViews = ['Home', '개요', '클랜원', '가입안내', '공지사항', 'BSL 공지사항', '토너먼트 공지', '자유게시판', '클랜원 소식', '랭킹', '시즌별 랭킹', '대시보드', 'BY래더시스템', 'BSL 경기일정 및 결과', '진행중인 토너먼트', '경기 영상', '사진 갤러리'];
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
      {permissions.isDeveloper && <DevSettingsPanel />}
      
      <Footer />
    </div>
  );
}
