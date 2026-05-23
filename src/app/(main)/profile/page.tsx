// 파일명: src/app/(main)/profile/page.tsx

/**
 * 역할: 내 프로필 페이지
 * URL 경로: /profile
 * 주요 기능:
 * - 로그인한 사용자의 프로필 정보 표시 및 편집
 * - 비로그인 시 로그인 안내 메시지 표시
 * - SectionErrorBoundary로 프로필 섹션 에러 격리
 * 접근 권한: 로그인한 사용자만 실제 프로필 이용 가능
 */

'use client';

import MyProfile from '@/components/MyProfile';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

function ProfileAccessFallback() {
  return (
    <main className="grow w-full relative z-10 flex flex-col items-center justify-center px-2 sm:px-6 mb-10 max-w-6xl mx-auto min-h-[50vh]">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center animate-fade-in-down">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-600 mb-4">
          클랜원만 이용 가능합니다
        </h2>
        <p className="text-gray-400 mb-6">
          프로필을 확인하고 수정하려면 먼저 로그인 후 [가입안내]를 확인해 주세요.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login?redirect=%2Fprofile"
            className="px-6 py-3 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm hover:bg-cyan-900/50 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/join"
            className="px-6 py-3 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm hover:bg-cyan-900/50 transition-colors"
          >
            가입안내
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all border border-gray-600 text-sm"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}

/**
 * ProfilePage - 내 프로필 페이지 컴포넌트
 * 로그인 여부에 따라 프로필 또는 로그인 안내를 렌더링합니다.
 * guest를 제외한 모든 로그인 사용자가 자신의 프로필을 볼 수 있습니다.
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute fallback={<ProfileAccessFallback />}>
      <main className="grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
        <div className="w-full mt-4">
          <SectionErrorBoundary name="프로필">
            <MyProfile />
          </SectionErrorBoundary>
        </div>
      </main>
    </ProtectedRoute>
  );
}
