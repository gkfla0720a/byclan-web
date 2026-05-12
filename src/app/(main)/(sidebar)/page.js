/**
 * =====================================================================
 * 파일명: src/app/(main)/(sidebar)/page.js
 * 역할  : ByClan 웹사이트의 홈 페이지('/' 경로)를 담당합니다.
 *         Header와 Footer가 포함된 (main) 레이아웃에 감싸집니다.
 *
 * ■ HomeGate / Header / Footer
 *   (main)/layout.js 에서 공통 처리합니다.
 *   Header / Footer 는 자동으로 렌더링됩니다.
 *   모든 사용자는 홈컨텐츠에 직접 접속할 수 있습니다.
 * =====================================================================
 */
'use client';

import React from 'react';
import HomeContent from '@/views/HomeContent';
import { useAuthContext } from '@/context/AuthContext';

export default function Home() {
  const { user, profile } = useAuthContext();

  return <HomeContent profile={profile} user={user} />;
}