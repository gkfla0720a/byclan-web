/**
 * =====================================================================
 * 파일명: src/app/page.js
 * 역할  : ByClan 웹사이트의 홈 페이지('/' 경로)를 담당합니다.
 *         로그인 상태와 사용자 역할에 따라 다른 UI를 표시합니다.
 *
 * ■ 화면 분기 로직
 *   1. 로딩 중이고, 프로필 설정이 필요한 경우
 *      → AuthDashboard 표시 (초기 설정 화면)
 *
 *   2. 로그인 했고, 역할이 'applicant'(신규 가입 대기)인 경우
 *      → "테스트 대기 중" 안내 화면 표시
 *
 *   3. 그 외 (방문자 포함 일반 화면)
 *      → Header + ProfileSidebar + HomeContent + Footer 표시
 *      → 개발자인 경우 DevSettingsPanel도 함께 표시
 *
 * ■ 홈 게이트(HomeGate)
 *   이 페이지는 HomeGate로 감싸져 있습니다.
 *   HomeGate는 비밀번호 인증이 완료된 경우에만 내부 컨텐츠를 표시합니다.
 *   (로그인한 사용자는 자동으로 통과됩니다)
 *
 * ■ 관련 컴포넌트
 *   Header, Footer, HomeGate, ProfileSidebar, HomeContent,
 *   AuthDashboard, DevSettingsPanel
 * =====================================================================
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import Header from './components/Header';
import Footer from './components/Footer';
import HomeGate from './components/HomeGate';
import ProfileSidebar from './components/ProfileSidebar';
import AuthDashboard from './components/AuthDashboard';
import DevSettingsPanel from './components/DevSettingsPanel';
import HomeContent from './pages/HomeContent';
import { useAuthContext } from './context/AuthContext';

/**
 * Home()
 * - 홈 페이지 컴포넌트입니다. '/' 경로에서 렌더링됩니다.
 * - useAuthContext()로 로그인 상태를 읽어 조건부 렌더링을 수행합니다.
 *
 * 내부 변수:
 *   router:      Next.js 라우터 (페이지 이동에 사용)
 *   user:        로그인한 Supabase 사용자 객체 (null이면 비로그인)
 *   profile:     사용자 클랜 프로필 (역할, 포인트 등)
 *   needsSetup:  프로필 초기 설정이 필요한지 여부
 *   authLoading: 인증 상태 로딩 중 여부
 *   getPermissions(): 현재 사용자의 권한 정보 반환 함수
 *   permissions: getPermissions()의 결과값 (isDeveloper 등 포함)
 */
export default function Home() {
  const router = useRouter();
  const {
    user,
    profile,
    needsSetup,
    authLoading,
    getPermissions,
    handleSetupComplete,
    reloadProfile,
  } = useAuthContext();

  const permissions = getPermissions();

  // 신규 가입자 프로필 설정
  if (!authLoading && user && needsSetup) {
    return <AuthDashboard user={user} onSetupComplete={handleSetupComplete} />;
  }

  // 신청 대기 중인 경우 (applicant)
  if (!authLoading && user && profile && profile.role === 'applicant') {
    return (
      <HomeGate>
        <div className="min-h-screen bg-transparent flex flex-col">
          <Header />
          <main className="flex-grow flex flex-col justify-center items-center p-4 relative z-10">
            <div className="cyber-card p-8 rounded-xl max-w-md w-full text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
              <p className="text-gray-300 mb-4">
                가입 신청이 접수되었습니다.<br />
                테스트 결과를 기다려주세요.
              </p>
              <div className="text-sm text-gray-400 mb-5">
                신청 현황과 운영진 안내는 알림함에서 확인할 수 있으며, 가입 안내에서 절차와 주의사항을 다시 볼 수 있습니다.
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/notifications')}
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
          <Footer />
        </div>
      </HomeGate>
    );
  }

  return (
    <HomeGate>
      <div className="min-h-screen flex flex-col bg-[#06060a] text-gray-200 font-semibold relative" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        <Header />
        <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
          <div className="w-full flex gap-4 mt-4">
            <ProfileSidebar profile={profile} user={user} />
            <div className="flex-1 min-w-0">
              <HomeContent />
            </div>
          </div>
        </main>
        {permissions.isDeveloper && <DevSettingsPanel />}
        <Footer />
      </div>
    </HomeGate>
  );
}

