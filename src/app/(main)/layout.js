/**
 * 파일명: (main)/layout.js
 * 역할: 메인 영역 전체를 감싸는 레이아웃 컴포넌트 (선택사항)
 * URL 경로: / (모든 (main) 그룹 하위 경로에 공통 적용)
 * 주요 기능:
 *   - 개발자 권한이 있을 때만 DevSettingsPanel 표시
 * 
 * 참고:
 *   - Header와 Footer는 루트 layout.js에서 모든 페이지에 적용됩니다.
 *   - 이 레이아웃은 추가 스타일이나 로직이 필요한 경우만 사용합니다.
 *
 * 변경사항:
 *   - HomeGate 제거 (임시 구조, 프로덕션에 부적절)
 *   - Header/Footer 제거 (루트 layout에서 처리)
 *   - 모든 사용자가 홈컨텐츠로 직접 접근 가능
 */
'use client';

import React from 'react';
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
    <>
      {children}
      {permissions.isDeveloper && <DevSettingsPanel />}
    </>
  );
}
