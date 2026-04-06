/**
 * 파일명: (main)/layout.js
 * 역할: 메인 영역 전체를 감싸는 최상위 레이아웃 컴포넌트
 * URL 경로: / (모든 (main) 그룹 하위 경로에 공통 적용)
 * 주요 기능:
 *   - 모든 페이지에 Header와 Footer를 자동으로 포함
 *   - HomeGate로 인증/접근 제어 처리
 *   - 개발자 권한이 있을 때만 DevSettingsPanel 표시
 * 접근 권한: 전체 공개 (HomeGate 내부에서 세부 접근 제어)
 */
'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeGate from '../components/HomeGate';
import DevSettingsPanel from '../components/DevSettingsPanel';
import { useAuthContext } from '../context/AuthContext';

/**
 * MainLayout - 메인 레이아웃 컴포넌트
 * @param {React.ReactNode} children - 이 레이아웃 안에 렌더링될 하위 페이지 컴포넌트
 */
export default function MainLayout({ children }) {
  const { getPermissions } = useAuthContext();
  const permissions = getPermissions();

  return (
    <HomeGate>
      <div className="min-h-screen flex flex-col bg-[#06060a] text-gray-200 font-semibold relative" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        <Header />
        {children}
        {permissions.isDeveloper && <DevSettingsPanel />}
        <Footer />
      </div>
    </HomeGate>
  );
}
