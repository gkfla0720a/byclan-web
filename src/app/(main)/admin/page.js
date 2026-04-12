/**
 * 파일명: (main)/admin/page.js
 * 역할: 관리자 대시보드 페이지
 * URL 경로: /admin
 * 주요 기능:
 *   - 관리자 전용 대시보드 및 관리 기능 표시
 *   - 기밀 게시판 탭 + 포인트 관리 탭
 *   - 비로그인 시 로그인 안내 메시지 표시
 *   - SectionErrorBoundary로 관리자 섹션 에러 격리
 * 접근 권한: 로그인한 관리자 권한 사용자 (각 컴포넌트 내부에서 추가 권한 체크)
 */
'use client';

import React, { useState } from 'react';
import AdminBoard from '../../components/AdminBoard';
import AdminPointManager from '../../components/AdminPointManager';
import AdminMatchManager from '../../components/AdminMatchManager';
import AdminActivityLogViewer from '../../components/AdminActivityLogViewer';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';
import { SectionErrorBoundary } from '../../components/ErrorBoundary';

const TABS = [
  { id: 'board', label: '🔐 기밀 게시판' },
  { id: 'points', label: '💰 포인트 관리' },
  { id: 'matches', label: '🗂 경기기록 관리' },
  { id: 'activity', label: '🧾 전역 이력 로그' },
];

/**
 * AdminPage - 관리자 페이지 컴포넌트
 * 로그인 여부에 따라 관리자 보드 또는 로그인 안내를 렌더링합니다.
 */
export default function AdminPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('board');

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        {user ? (
          <>
            {/* 탭 네비게이션 */}
            <div className="flex gap-1 mb-6 border-b border-gray-700/50 pb-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-yellow-400 border-yellow-500 bg-gray-900/60'
                      : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <SectionErrorBoundary name="관리자">
              {activeTab === 'board' && <AdminBoard />}
              {activeTab === 'points' && <AdminPointManager />}
              {activeTab === 'matches' && <AdminMatchManager />}
              {activeTab === 'activity' && <AdminActivityLogViewer />}
            </SectionErrorBoundary>
          </>
        ) : (
          <PagePlaceholder title="로그인이 필요합니다." />
        )}
      </div>
    </main>
  );
}

