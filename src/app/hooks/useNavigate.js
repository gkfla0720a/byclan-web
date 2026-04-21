/**
 * =====================================================================
 * 파일명: src/app/hooks/useNavigate.js
 * 역할  : 한국어 뷰(페이지) 이름을 실제 URL 경로로 변환하여 페이지를 이동시키는
 *         커스텀 훅(hook)입니다.
 *
 * ■ 배경
 *   사이드바, 헤더 등의 UI 컴포넌트에서 '개요', '랭킹', '대시보드' 같은
 *   한국어 이름으로 페이지를 참조하는데, 이를 실제 URL로 변환해 줍니다.
 *
 * ■ 사용 방법
 *   import { useNavigate } from '@/app/hooks/useNavigate';
 *
 *   function MyComponent() {
 *     const navigateTo = useNavigate();
 *     return <button onClick={() => navigateTo('랭킹')}>랭킹 보기</button>;
 *   }
 *
 * ■ 매핑 테이블 (VIEW_TO_PATH)
 *   '랭킹' → '/ranking'
 *   '대시보드' → '/ladder'
 *   '관리자' → '/admin'
 *   등 (아래 VIEW_TO_PATH 객체 참고)
 * =====================================================================
 */
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * VIEW_TO_PATH
 * - 한국어 뷰 이름(사이드바 메뉴 이름)과 실제 URL 경로를 매핑하는 객체입니다.
 * - 새로운 페이지를 추가할 때 여기에 항목을 추가해야 합니다.
 * - 같은 경로를 여러 이름으로 접근할 수 있습니다 (예: '가입안내'와 '가입신청' → '/join')
 */
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
  '포인트 상점': '/points/shop',
  '포인트 내역': '/points/history',
  '경기기록': '/matches',
  '로그인': '/login',
  '외부 레더 랭킹': '/ladder/external-ranking',
  '외부 레더 기록': '/ladder/external-records',
  '승률 시뮬레이터': '/simulator'
};

/**
 * PATH_TO_VIEW
 * - VIEW_TO_PATH의 역방향 매핑입니다 (URL 경로 → 한국어 뷰 이름).
 * - 현재 URL을 보고 어떤 메뉴가 활성화되었는지 표시할 때 사용합니다.
 * - Object.fromEntries()로 VIEW_TO_PATH를 뒤집어 자동 생성됩니다.
 *
 * 예시:
 *   PATH_TO_VIEW['/ranking']  → '랭킹'
 *   PATH_TO_VIEW['/ladder']   → 'BY래더시스템' (마지막 매핑이 우선)
 */
export const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view])
);

/**
 * useNavigate()
 * - 한국어 뷰 이름을 받아 해당 URL로 페이지를 이동시키는 함수를 반환하는 훅입니다.
 * - Next.js의 useRouter를 내부적으로 사용합니다.
 *
 * 반환값: navigateTo 함수
 *
 * 사용 예시:
 *   const navigateTo = useNavigate();
 *   navigateTo('랭킹');    // → /ranking 으로 이동
 *   navigateTo('대시보드'); // → /ladder 로 이동
 */
export function useNavigate() {
  const router = useRouter();

  /**
   * navigateTo(viewName)
   * - 뷰 이름에 해당하는 URL로 페이지를 이동합니다.
   * - VIEW_TO_PATH에 없는 이름이면 개발 환경에서 경고를 출력하고 URL 인코딩하여 이동합니다.
   *
   * 매개변수:
   *   viewName: 이동할 페이지의 한국어 이름 (예: '랭킹', '관리자')
   */
  const navigateTo = useCallback((viewName) => {
    const path = VIEW_TO_PATH[viewName];
    if (path) {
      router.push(path);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useNavigate] Unmapped view name: "${viewName}". Add it to VIEW_TO_PATH in hooks/useNavigate.js.`);
      }
      router.push(`/${encodeURIComponent(viewName)}`);
    }
  }, [router]);

  return navigateTo;
}
