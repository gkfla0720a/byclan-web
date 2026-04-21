/**
 * =====================================================================
 * 파일명: src/app/layout.js
 * 역할  : Next.js 앱 전체의 최상위 레이아웃(Root Layout)입니다.
 *         모든 페이지를 감싸는 공통 HTML 구조, Provider, 전역 CSS를 설정합니다.
 *
 * ■ Provider 계층 구조
 *   ErrorBoundary  → 예기치 못한 오류를 잡아 대체 UI 표시
 *   ToastProvider  → 앱 전체에 Toast 알림 시스템 제공
 *   AuthProvider   → 앱 전체에 로그인/프로필/권한 상태 제공
 *   ToastContainer → 실제 Toast 메시지들을 화면에 렌더링
 *
 * ■ 레이아웃 구조
 *   Header  → 모든 페이지 공통 상단 네비게이션
 *   main    → 페이지 본문 (max-w-6xl, px 패딩)
 *   Footer  → 모든 페이지 공통 하단
 *
 * ■ DevConditional → 개발자 계정일 때만 DevSettingsPanel 렌더링
 * =====================================================================
 */

import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import { Analytics } from "@vercel/analytics/next";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DevConditional from "./components/DevConditional";

export const metadata = {
  title: "ByClan NET – 스타크래프트 빠른무한 클랜",
  description: "ByClan 클랜 공식 홈페이지. 래더 시스템, 토너먼트, 클랜원 커뮤니티.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#06060a] text-gray-200">
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-grow w-full max-w-6xl mx-auto px-2 sm:px-6 mt-4 mb-10">
                  {children}
                </main>

                <Footer />
              </div>

              {/* 개발자 계정일 때만 렌더링 */}
              <DevConditional />
            </AuthProvider>
            <ToastContainer />
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
