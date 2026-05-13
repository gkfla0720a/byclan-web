/**
 * 파일명: src/app/(main)/(sidebar)/page.jsx
 * 역할  : ByClan 웹사이트의 홈 페이지('/' 경로)를 담당합니다.
 */

import HomeContent from '@/views/HomeContent';

export const metadata = {
  title: "홈 | ByClan",
  description: "바이클랜 스타크래프트 길드 홈 화면입니다.",
};

export default function Home() {
  return <HomeContent />;
}