/**
 * 파일명: (main)/admin/page.js
 * 역할: 관리자 대시보드 페이지
 * URL 경로: /admin
 * 주요 기능:
 *   - 관리자 전용 대시보드 및 관리 기능 표시
 *   - 비로그인 시 로그인 안내 메시지 표시
 *   - SectionErrorBoundary로 관리자 섹션 에러 격리
 * 접근 권한: 로그인한 관리자 권한 사용자 (AdminBoard 내부에서 추가 권한 체크)
 */
'use client';

import React from 'react';
import AdminBoard from '../../components/AdminBoard';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';
import { SectionErrorBoundary } from '../../components/ErrorBoundary';

/**
 * AdminPage - 관리자 페이지 컴포넌트
 * 로그인 여부에 따라 관리자 보드 또는 로그인 안내를 렌더링합니다.
 */
export default function AdminPage() {
  // 현재 로그인한 사용자 정보 가져오기
  const { user } = useAuthContext();

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        <SectionErrorBoundary name="관리자">
          {user
            ? <AdminBoard />
            : <PagePlaceholder title="로그인이 필요합니다." />}
        </SectionErrorBoundary>
      </div>
    </main>
  );
}
