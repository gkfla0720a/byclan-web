  /**
 * 파일명: src/app/page.js
 * 역할  : ByClan 웹사이트의 홈 페이지
 * 변경사항: 
 * - 신규 가입자/대기자의 전체 화면 차단(Blocking) 로직 제거
 * - 모든 사용자가 홈 콘텐츠를 볼 수 있도록 구조 단일화
 */
'use client';

import React from 'react';
import ProfileSidebar from './components/ProfileSidebar';
import HomeContent from './pages/HomeContent';
import { useAuthContext } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import DevSettingsPanel from './components/DevSettingsPanel';
import { ROLE_PERMISSIONS } from './utils/permissions';

export default function Home() {
  const {
    user,
    profile,
    authLoading,
  } = useAuthContext();

  const userPermissions = ROLE_PERMISSIONS[profile?.role] || {};

  // 1. 인증 로딩 중일 때만 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 2. 이제 누구나 거실(Home)에 들어올 수 있습니다.
  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <Header />
        {/* 사이드바에서 본인의 상태(대기중 등)를 확인할 수 있습니다 */}
        <ProfileSidebar profile={profile} user={user} />
          <HomeContent profile={profile} user={user} />
          {userPermissions.isDeveloper && <DevSettingsPanel />}
      <Footer />
    </main>
  );
  }