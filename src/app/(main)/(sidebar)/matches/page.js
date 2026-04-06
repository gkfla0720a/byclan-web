/**
 * 파일명: (main)/(sidebar)/matches/page.js
 * 역할: 래더 경기 기록 페이지
 * URL 경로: /matches
 * 주요 기능: 래더 경기 완료·진행 목록 열람
 * 접근 권한: 전체 공개 (비로그인 포함)
 */
'use client';

import MatchRecords from '../../../pages/MatchRecords';

/** MatchesPage - 경기 기록 페이지 컴포넌트. MatchRecords를 렌더링합니다. */
export default function MatchesPage() {
  return <MatchRecords />;
}
