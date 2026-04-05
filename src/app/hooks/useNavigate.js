'use client';

import { useRouter } from 'next/navigation';

// 한국어 뷰 이름 → URL 경로 매핑
const VIEW_TO_PATH = {
  'Home': '/',
  '개요': '/overview',
  '클랜원': '/members',
  '가입안내': '/join',
  '가입신청': '/join',
  '정회원 전환신청': '/join/transfer',
  '공지사항': '/notice',
  'BSL 공지사항': '/notice',
  '토너먼트 공지': '/notice',
  '자유게시판': '/community',
  '클랜원 소식': '/community',
  '랭킹': '/ranking',
  '시즌별 랭킹': '/ranking',
  '대시보드': '/ladder',
  'BY래더시스템': '/ladder',
  'BSL 경기일정 및 결과': '/tournament',
  '진행중인 토너먼트': '/tournament',
  '경기 영상': '/media',
  '사진 갤러리': '/media',
  '가입 심사': '/admin/applications',
  '관리자': '/admin',
  '운영진게시판': '/admin',
  '길드원 관리': '/admin/guild',
  '개발자': '/developer',
  '프로필': '/profile',
  '알림': '/notifications',
  '로그인': '/login',
};

// 경로 → 한국어 뷰 이름 매핑 (역방향)
export const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view])
);

export function useNavigate() {
  const router = useRouter();

  const navigateTo = (viewName) => {
    const path = VIEW_TO_PATH[viewName];
    if (path) {
      router.push(path);
    } else {
      // 매핑에 없는 뷰명은 그대로 동적 경로로 처리
      router.push(`/${encodeURIComponent(viewName)}`);
    }
  };

  return navigateTo;
}
