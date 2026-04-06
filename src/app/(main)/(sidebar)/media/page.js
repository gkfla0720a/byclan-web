/**
 * 파일명: (main)/(sidebar)/media/page.js
 * 역할: 미디어 갤러리 페이지
 * URL 경로: /media
 * 주요 기능: 클랜 관련 이미지, 영상 등 미디어 콘텐츠 갤러리 표시
 * 접근 권한: 전체 공개
 */
'use client';

import MediaGallery from '../../../pages/MediaGallery';

/** MediaPage - 미디어 갤러리 페이지 컴포넌트. MediaGallery를 렌더링합니다. */
export default function MediaPage() {
  return <MediaGallery />;
}
