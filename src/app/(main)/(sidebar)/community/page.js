/**
 * 파일명: (main)/(sidebar)/community/page.js
 * 역할: 커뮤니티 게시판 페이지
 * URL 경로: /community
 * 주요 기능: 클랜 멤버들의 자유로운 소통을 위한 커뮤니티 게시판 표시
 * 접근 권한: 전체 공개 (글 작성은 로그인 필요)
 */
'use client';

import CommunityBoard from '../../../components/CommunityBoard';

/** CommunityPage - 커뮤니티 페이지 컴포넌트. CommunityBoard를 렌더링합니다. */
export default function CommunityPage() {
  return <CommunityBoard />;
}
