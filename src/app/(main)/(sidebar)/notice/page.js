/**
 * 파일명: (main)/(sidebar)/notice/page.js
 * 역할: 공지사항 게시판 페이지
 * URL 경로: /notice
 * 주요 기능: 클랜 공지사항 목록 및 상세 내용 표시
 * 접근 권한: 전체 공개
 */
'use client';

import NoticeBoard from '../../../components/NoticeBoard';

/** NoticePage - 공지사항 페이지 컴포넌트. NoticeBoard를 렌더링합니다. */
export default function NoticePage() {
  return <NoticeBoard />;
}
