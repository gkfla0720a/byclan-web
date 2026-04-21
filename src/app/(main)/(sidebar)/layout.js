/**
 * 파일명: (main)/(sidebar)/layout.js
 * 역할: 사이드바 그룹 라우트 그룹 레이아웃 (pass-through)
 * URL 경로: 사이드바 그룹 하위 경로 (ladder, ranking, members 등)
 *
 * 컨테이너/사이드바/패딩은 상위 root layout.js에서 이미 처리됩니다.
 * 이 파일은 라우트 그룹 구조 유지를 위해 children을 그대로 전달합니다.
 */

export default function SidebarLayout({ children }) {
  return children;
}
