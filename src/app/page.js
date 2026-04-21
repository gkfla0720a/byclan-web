/**
 * =====================================================================
 * 파일명: src/app/page.js
 * 역할  : ByClan 웹사이트의 홈 페이지('/' 경로)를 담당합니다.
 *
 * ■ 화면 분기 로직
 *   1. 신규 가입 → 프로필 설정이 필요한 경우: AuthDashboard 표시
 *   2. 그 외 모든 사용자(방문자·가입 대기자·클랜원 전부): ProfileSidebar + HomeContent
 *      - 가입 대기 안내는 HomeContent 내부 또는 Toast로 노출
 *
 * ■ Header / Footer / DevConditional
 *   root layout.js 에서 공통 처리합니다.
 * =====================================================================
 */
'use client';

import React from 'react';

import ProfileSidebar from './components/ProfileSidebar';
import AuthDashboard from './components/AuthDashboard';
import HomeContent from './pages/HomeContent';
import { useAuthContext } from './context/AuthContext';

export default function Home() {
  const {
    user,
    profile,
    needsSetup,
    authLoading,
    handleSetupComplete,
  } = useAuthContext();

  // 신규 OAuth 가입 → 프로필 설정 화면 (가입 완료 전 단계)
  if (!authLoading && user && needsSetup) {
    return <AuthDashboard user={user} onSetupComplete={handleSetupComplete} />;
  }

  // 방문자·가입 대기자·클랜원 모두 동일하게 홈 화면 표시
  return (
    <div className="w-full flex gap-4 mt-0">
      <ProfileSidebar />
      <div className="flex-1 min-w-0">
        <HomeContent profile={profile} user={user} />
      </div>
    </div>
  );
}
