/**
 * =====================================================================
 * 파일명: src/app/(main)/(sidebar)/page.js
 * 역할  : ByClan 웹사이트의 홈 페이지('/' 경로)를 담당합니다.
 *         Header와 Footer가 포함된 (main) 레이아웃에 감싸집니다.
 *
 * ■ 화면 분기 로직
 *   1. 프로필 설정이 필요한 경우 → AuthDashboard 표시
 *   2. 역할이 'applicant'(가입 대기)인 경우 → 대기 안내 화면
 *   3. 그 외(방문자 포함) → ProfileSidebar + HomeContent
 *
 * ■ HomeGate / Header / Footer
 *   (main)/layout.js 에서 공통 처리합니다.
 *   Header / Footer 는 자동으로 렌더링됩니다.
 *   모든 사용자는 홈컨텐츠에 직접 접속할 수 있습니다.
 * =====================================================================
 */
'use client';

import React from 'react';
import AuthDashboard from '../../components/AuthDashboard';
import HomeContent from '../../pages/HomeContent';
import { useAuthContext } from '../../context/AuthContext';

export default function Home() {
  const {
    user,
    profile,
    needsSetup,
    authLoading,
    handleSetupComplete,
  } = useAuthContext();

  // 신규 가입자 프로필 설정 화면
  if (!authLoading && user && needsSetup) {
    return <AuthDashboard user={user} onSetupComplete={handleSetupComplete} />;
  }

  // 일반 홈 화면
  return <HomeContent profile={profile} user={user} />;
}
