/**
 * 파일명: (main)/notifications/page.js
 * 역할: 알림 센터 페이지
 * URL 경로: /notifications
 * 주요 기능:
 *   - 로그인한 사용자의 알림 목록 표시
 *   - 비로그인 시 로그인 안내 메시지 표시
 * 접근 권한: 로그인한 사용자만 알림 내용 확인 가능
 */
'use client';

import React from 'react';
import NotificationCenter from '../../components/NotificationCenter';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';

/**
 * NotificationsPage - 알림 페이지 컴포넌트
 * 로그인 여부에 따라 알림 목록 또는 로그인 안내를 렌더링합니다.
 */
export default function NotificationsPage() {
  // 현재 로그인한 사용자 정보와 프로필 가져오기
  const { user, profile } = useAuthContext();

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        {user
          ? <NotificationCenter profile={profile} />
          : <PagePlaceholder title="로그인이 필요합니다." />}
      </div>
    </main>
  );
}
