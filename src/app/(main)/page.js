/**
 * =====================================================================
 * 파일명: src/app/(main)/page.js
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
import { useRouter } from 'next/navigation';

import ProfileSidebar from '../components/ProfileSidebar';
import AuthDashboard from '../components/AuthDashboard';
import HomeContent from '../pages/HomeContent';
import { useAuthContext } from '../context/AuthContext';

export default function Home() {
  const router = useRouter();
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

  // 가입 대기 중인 경우 (applicant)
  if (!authLoading && user && profile?.role === 'applicant') {
    return (
      <main className="flex-grow flex flex-col justify-center items-center p-4 relative z-10">
        <div className="cyber-card p-8 rounded-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
          <p className="text-gray-300 mb-4">
            가입 신청이 접수되었습니다.<br />
            테스트 결과를 기다려주세요.
          </p>
          <div className="text-sm text-gray-400 mb-5">
            신청 현황과 운영진 안내는 알림함에서 확인할 수 있으며,
            가입 안내에서 절차와 주의사항을 다시 볼 수 있습니다.
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/profile/notifications')}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors"
            >
              알림함 열기
            </button>
            <button
              onClick={() => router.push('/join')}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              가입 안내 보기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 일반 홈 화면
  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full flex gap-4 mt-4">
        <ProfileSidebar profile={profile} user={user} />
        <div className="flex-1 min-w-0">
          <HomeContent profile={profile} user={user} />
        </div>
      </div>
    </main>
  );
}
