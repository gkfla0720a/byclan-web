// 파일명: src/hooks/useNavigate.ts
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * VIEW_TO_PATH
 * - 한국어 뷰 이름과 실제 URL 경로를 매핑하는 객체입니다.
 * - 'as const'를 붙여 이 객체의 내용이 영원히 변하지 않는 고정값임을 선언합니다.
 */
export const VIEW_TO_PATH = {
  'Home': '/',
  '가입안내': '/join',
  '정회원 전환신청': '/join/transfer',
  '개요': '/overview',
  '클랜원': '/members',
  '랭킹': '/ranking',
  'BY래더': '/ladder',
  '경기기록': '/matches',
  'BSL 공지사항': '/notice',
  'BSL 경기일정 및 결과': '/tournament',
  '토너먼트 공지': '/notice',
  '진행중인 토너먼트': '/tournament',
  '공지사항': '/notice',
  '자유게시판': '/community',
  '포인트 상점': '/points/shop',
  '포인트 내역': '/points/history',
  '알림': '/admin/notifications',
  '내 프로필': '/profile',
  '운영진게시판': '/admin',
  '가입 심사 관리': '/admin/applications',
  '클랜원 관리': '/admin/guild',
  '경기 관리': '/admin/matches',
  '래더/경기 운영': '/admin/matches',
  '콘텐츠 관리': '/admin/content',
  '관리설정': '/admin-settings',
  '개발자': '/developer',
  '로그인': '/login',
} as const;

export type MenuName = keyof typeof VIEW_TO_PATH;

export const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view])
) as Record<string, MenuName>;

export function useNavigate() {
  const router = useRouter();

  // 매개변수 viewName에 우리가 방금 만든 MenuName 타입을 강제합니다!
  const navigateTo = useCallback((viewName: MenuName) => {
    const path = VIEW_TO_PATH[viewName];
    if (path) {
      router.push(path);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useNavigate] Unmapped view name: "${viewName}".`);
      }
      router.push(`/${encodeURIComponent(viewName)}`);
    }
  }, [router]);

  return navigateTo;
}