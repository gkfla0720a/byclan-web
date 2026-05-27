// 파일명: src/app/(main)/(sidebar)/layout.tsx

'use client';

import ProfileSidebar from '@/components/ProfileSidebar';
import { useAuthContext } from '@/context/AuthContext';
import type { ReactNode } from 'react';

export default function SidebarLayout({ children }: { children: ReactNode }) {
  const { user, profile, needsSetup, authLoading } = useAuthContext();

  // 💡 1. 로딩 중: 레이아웃이 널뛰기하는 것을 방지하기 위해 뼈대만 유지하거나 빈 화면 반환
  if (authLoading) {
    return (
      <div className="w-full flex justify-center py-20">
        <span className="text-cyan-500/50 font-mono animate-pulse font-bold text-sm">
          [ AUTHENTICATING... ]
        </span>
      </div>
    );
  }

  // 💡 2. 초기 닉네임 설정 중: 중앙 정렬 레이아웃 (사이드바 숨김)
  if (user && needsSetup) {
    return (
      <div className="w-full flex justify-center">
        {children}
      </div>
    );
  }

  // 💡 3. 일반 홈 화면: 사이드바 + 콘텐츠 레이아웃
  return (
    <div className="w-full flex flex-col md:flex-row gap-4 lg:gap-6 mt-4">
      
      {/* 왼쪽 사이드바 (Header 로고와 동일한 반응형 너비 적용) */}
      <aside className="hidden md:block w-64 lg:w-72 xl:w-80 shrink-0 transition-all duration-300">
        <ProfileSidebar profile={profile} user={user} />
      </aside>

      {/* 오른쪽 콘텐츠 */}
      <section className="flex-1 min-w-0 transition-all duration-300">
        {children}
      </section>
      
    </div>
  );
}