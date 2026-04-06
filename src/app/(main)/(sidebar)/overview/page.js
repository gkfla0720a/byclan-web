/**
 * 파일명: (main)/(sidebar)/overview/page.js
 * 역할: 클랜 개요(소개) 페이지
 * URL 경로: /overview
 * 주요 기능: 클랜의 소개, 목표, 규칙 등 전반적인 정보 표시
 * 접근 권한: 전체 공개
 */
'use client';

import ClanOverview from '../../../pages/ClanOverview';

/** OverviewPage - 클랜 개요 페이지 컴포넌트. ClanOverview를 렌더링합니다. */
export default function OverviewPage() {
  return <ClanOverview />;
}
