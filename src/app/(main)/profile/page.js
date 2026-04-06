/**
 * 파일명: (main)/profile/page.js
 * 역할: 내 프로필 페이지
 * URL 경로: /profile
 * 주요 기능:
 *   - 로그인한 사용자의 프로필 정보 표시 및 편집
 *   - 비로그인 시 로그인 안내 메시지 표시
 *   - SectionErrorBoundary로 프로필 섹션 에러 격리
 * 접근 권한: 로그인한 사용자만 실제 프로필 이용 가능
 */
'use client';

import React from 'react';
import MyProfile from '../../components/MyProfile';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';
import { SectionErrorBoundary } from '../../components/ErrorBoundary';

/**
 * ProfilePage - 내 프로필 페이지 컴포넌트
 * 로그인 여부에 따라 프로필 또는 로그인 안내를 렌더링합니다.
 */
export default function ProfilePage() {
  // 현재 로그인한 사용자 정보 가져오기 (없으면 null)
  const { user } = useAuthContext();

  if (!user) {
    return (
      <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
        <div className="w-full mt-8">
          <PagePlaceholder title="로그인이 필요합니다." />
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
