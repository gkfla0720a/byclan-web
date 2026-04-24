/**
 * 파일명: (main)/layout.js
 * 역할: 메인 영역 전체를 감싸는 레이아웃 컴포넌트
 * URL 경로: /(main)/* (모든 (main) 그룹 하위 경로에 공통 적용)
 * 
 * 주요 기능:
 *   - Header와 Footer 표시 (메인 페이지들에만)
 *   - 개발자 권한이 있을 때만 DevSettingsPanel 표시
 * 
 * 참고:
 *   - Root layout은 로그인/인증 페이지를 포함한 모든 페이지에 적용됨
 *   - 이 레이아웃은 (main) 그룹의 페이지에만 Header/Footer를 추가함
 *   - 로그인/인증 페이지에는 Header/Footer가 표시되지 않음
 *
 * 변경사항 (2026-04-22):
 *   - Header/Footer 추가 (Root layout에서 이동)
 *   - 로그인 페이지 분리로 사용자 경험 개선
 */
'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DevSettingsPanel from '../components/DevSettingsPanel';
import { useAuthContext } from '../context/AuthContext';

/**
 * MainLayout - 메인 레이아웃 컴포넌트
 * @param {React.ReactNode} children - 이 레이아웃 안에 렌더링될 하위 페이지 컴포넌트
 * 
 * 렌더링 구조:
 *   <Header />        - 상단 내비게이션
 *   <main>            - 페이지 내용
 *     {children}
 *   </main>
 *   <Footer />        - 하단 푸터
 *   <DevSettings />   - 개발자 전용 패널 (권한이 있을 때만)
 */
export default function MainLayout({ children }) {
  const { getPermissions } = useAuthContext();
  const permissions = getPermissions();

  return (
    <div className="min-h-screen flex flex-col bg-[#06060a]">
      <Header />
        <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 mb-10 relative z-10">
          {children}
          {permissions.isDeveloper && <DevSettingsPanel />}
        </main>
      <Footer />
    </div>
  );
}
