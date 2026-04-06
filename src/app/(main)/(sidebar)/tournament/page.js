/**
 * 파일명: (main)/(sidebar)/tournament/page.js
 * 역할: 토너먼트(대회) 페이지
 * URL 경로: /tournament
 * 주요 기능: 클랜 내부 토너먼트 정보 및 대진표 표시
 * 접근 권한: 전체 공개
 */
'use client';

import ClanTournament from '../../../pages/ClanTournament';

/** TournamentPage - 토너먼트 페이지 컴포넌트. ClanTournament를 렌더링합니다. */
export default function TournamentPage() {
  return <ClanTournament />;
}
