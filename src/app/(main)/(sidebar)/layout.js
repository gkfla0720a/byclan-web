// src/app/(main)/(sidebar)/layout.js
'use client';

import React from 'react';
import ProfileSidebar from '@/app/components/ProfileSidebar';
import { useAuthContext } from '@/app/context/AuthContext';

export default function SidebarLayout({ children }) {
  const { user, profile, needsSetup, authLoading } = useAuthContext();

  // 🛠️ 추가: 신규 가입자 설정 중이거나 가입 심사 대기 중일 때는 사이드바 없이 내용만 렌더링합니다.
  if (!authLoading && user && (needsSetup || profile?.role === 'applicant')) {
    return <div className="w-full flex justify-center">{children}</div>;
  }

  // 일반 홈 화면일 때만 사이드바 렌더링
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