/**
 * 파일명: (main)/profile/page.js
 * 역할: 내 프로필 페이지
 * URL 경로: /profile
 * 주요 기능:
 * - 로그인한 사용자의 프로필 정보 표시 및 편집
 * - 비로그인 시 로그인 안내 메시지 표시
 * - SectionErrorBoundary로 프로필 섹션 에러 격리
 * 접근 권한: 로그인한 사용자만 실제 프로필 이용 가능
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // 💡 홈으로 가기 위해 라우터 추가
import MyProfile from '@/components/MyProfile';
import { useAuthContext } from '@/context/AuthContext';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigate } from '@/hooks/useNavigate';

/**
 * ProfilePage - 내 프로필 페이지 컴포넌트
 * 로그인 여부에 따라 프로필 또는 로그인 안내를 렌더링합니다.
 * visitor를 제외한 모든 로그인 사용자가 자신의 프로필을 볼 수 있습니다.
 */
export default function ProfilePage() {
  // 💡 1. 모든 훅(Hook)과 함수는 컴포넌트 내부에 있어야 합니다!
  const { user, profile, authLoading } = useAuthContext();
  const navigateTo = useNavigate();
  const router = useRouter(); 

  const handleLogin = () => {
    navigateTo('로그인');
  };
  const handleApplicant = () => {
    navigateTo('가입안내');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (authLoading) {
    return (
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-center px-2 sm:px-6 mb-10 max-w-6xl mx-auto min-h-[50vh]">
        <div className="text-gray-500 font-mono animate-pulse font-bold text-lg">
          인증 상태를 확인하고 있습니다...
        </div>
      </main>
    );
  }

  // 비로그인, 방문자 방문 시 로그인 안내
  if (!user || profile?.role === 'visitor') {
    return (
      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-center px-2 sm:px-6 mb-10 max-w-6xl mx-auto min-h-[50vh]">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center animate-fade-in-down">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-600 mb-4">
            클랜원만 이용 가능합니다
          </h2>
          <p className="text-gray-400 mb-6">
            프로필을 확인하고 수정하려면 먼저 로그인 후 [가입안내]를 확인해 주세요.
          </p>
          {/* 💡 2. 버튼들을 가로로 나란히 예쁘게 배치하고 onClick 문법을 고쳤습니다. */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleLogin} 
              className="px-6 py-3 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm hover:bg-cyan-900/50 transition-colors"
            >
              로그인
            </button>
            <button 
              onClick={handleApplicant} 
              className="px-6 py-3 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm hover:bg-cyan-900/50 transition-colors"
            >
              가입안내
            </button>
            <button 
              onClick={handleGoHome}
              className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all border border-gray-600 text-sm"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        <SectionErrorBoundary name="프로필">
          <MyProfile />
        </SectionErrorBoundary>
      </div>
    </main>
  );
}