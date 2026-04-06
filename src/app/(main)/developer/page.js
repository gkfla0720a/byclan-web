/**
 * 파일명: (main)/developer/page.js
 * 역할: 개발자 전용 콘솔 페이지
 * URL 경로: /developer
 * 주요 기능:
 *   - 개발자용 디버깅 및 관리 콘솔 표시
 *   - 비로그인 시 로그인 안내 메시지 표시
 * 접근 권한: 로그인한 개발자 권한 사용자 (DevConsole 내부에서 추가 권한 체크)
 */
'use client';

import React from 'react';
import DevConsole from '../../components/DevConsole';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';

/**
 * DeveloperPage - 개발자 콘솔 페이지 컴포넌트
 * 로그인 여부에 따라 개발자 콘솔 또는 로그인 안내를 렌더링합니다.
 */
export default function DeveloperPage() {
  // 현재 로그인한 사용자 정보 가져오기
  const { user } = useAuthContext();

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        {user
          ? <DevConsole />
          : <PagePlaceholder title="로그인이 필요합니다." />}
      </div>
    </main>
  );
}
