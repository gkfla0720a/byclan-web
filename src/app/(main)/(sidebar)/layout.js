/**
 * 파일명: (main)/(sidebar)/layout.js
 * 역할: 사이드바가 있는 페이지들의 공통 레이아웃
 * URL 경로: 사이드바 그룹 하위 경로 (ladder, ranking, members 등)
 * 주요 기능:
 *   - 왼쪽에 ProfileSidebar(프로필 사이드바)를 고정 표시
 *   - 오른쪽에 각 페이지의 콘텐츠(children)를 표시
 * 접근 권한: 전체 공개 (사이드바는 로그인 여부와 무관하게 표시)
 */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ProfileSidebar from '../../components/ProfileSidebar';
import { useAuthContext } from '../../context/AuthContext';

/**
 * SidebarLayout - 사이드바 레이아웃 컴포넌트
 * @param {React.ReactNode} children - 사이드바 오른쪽에 렌더링될 페이지 내용
 */
export default function SidebarLayout({ children }) {
  const { profile, user } = useAuthContext();
  const pathname = usePathname();

  const hideProfileSidebar = ['/ladder', '/ranking', '/matches'].some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className={`w-full flex mt-4 ${hideProfileSidebar ? '' : 'gap-4'}`}>
        {!hideProfileSidebar && <ProfileSidebar profile={profile} user={user} />}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
