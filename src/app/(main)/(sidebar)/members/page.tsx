// 파일명: src/app/(main)/(sidebar)/members/page.tsx

/**
 * 역할: 클랜 멤버 목록 페이지
 * URL 경로: /members
 * 주요 기능: 클랜에 소속된 멤버 목록 표시
 * 접근 권한: 전체 공개
 */

'use client';

import MemberList from '@/views/MemberList';

/** MembersPage - 멤버 목록 페이지 컴포넌트. MemberList를 렌더링합니다. */
export default function MembersPage() {
  return <MemberList />;
}
