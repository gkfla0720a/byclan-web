/**
 * 파일명: (main)/(sidebar)/ranking/page.js
 * 역할: 랭킹 보드 페이지
 * URL 경로: /ranking
 * 주요 기능: 클랜 멤버들의 랭킹(순위) 목록 표시
 * 접근 권한: 전체 공개
 */
'use client';

import RankingBoard from '../../../components/RankingBoard';

/** RankingPage - 랭킹 페이지 컴포넌트. RankingBoard를 렌더링합니다. */
export default function RankingPage() {
  return <RankingBoard />;
}
