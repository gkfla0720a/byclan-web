/**
 * =====================================================================
 * 파일명: src/app/layout.js
 * 역할  : Next.js 앱 전체의 최상위 레이아웃(Root Layout)입니다.
 *         모든 페이지를 감싸는 공통 HTML 구조, Provider, 전역 CSS를 설정합니다.
 *         Header와 Footer를 포함하여 모든 페이지에서 표시합니다.
 *
 * ■ 적용되는 Provider 계층 구조 (아래에서 위 순서로 감쌈)
 *   ErrorBoundary  → 예기치 못한 오류를 잡아 대체 UI 표시
 *   ToastProvider  → 앱 전체에 Toast 알림 시스템 제공
 *   AuthProvider   → 앱 전체에 로그인/프로필/권한 상태 제공
 *   ToastContainer → 실제 Toast 메시지들을 화면에 렌더링
 *
 * ■ metadata
 *   SEO(검색엔진 최적화)용 페이지 제목과 설명을 설정합니다.
 *   브라우저 탭 제목과 검색 결과 미리보기에 표시됩니다.
 *
 * ■ 전역 스타일
 *   globals.css가 여기서 import되어 모든 페이지에 적용됩니다.
 *   배경색: #06060a (매우 진한 검정)
 *   텍스트: text-gray-200 (밝은 회색)
 * =====================================================================
 */
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next";

/**
 * metadata
 * - Next.js가 자동으로 <head> 태그에 삽입하는 메타데이터입니다.
 * - title:       브라우저 탭과 검색 결과에 표시되는 제목
 * - description: 검색 엔진 결과 페이지의 페이지 설명 문구
 */
export const metadata = {
  title: "ByClan NET – 스타크래프트 빠른무한 클랜",
  description: "ByClan 클랜 공식 홈페이지. 래더 시스템, 토너먼트, 클랜원 커뮤니티.",
};

/**
 * RootLayout({ children })
 * - 모든 페이지를 감싸는 최상위 레이아웃 컴포넌트입니다.
 * - Next.js App Router의 루트 레이아웃으로, src/app/layout.js가 이 파일입니다.
 *
 * 매개변수:
 *   children: 현재 경로에 해당하는 페이지 컴포넌트가 여기에 렌더링됩니다.
 *
 * 렌더링 구조:
 *   <html lang="ko">          ← 한국어 페이지임을 브라우저/스크린리더에 알림
 *     <body>                  ← 전체 배경색, 글자색, flex 레이아웃 설정
 *       <ErrorBoundary>       ← 오류 발생 시 앱 전체가 터지지 않도록 보호
 *         <ToastProvider>     ← Toast 알림 기능 활성화
 *           <AuthProvider>    ← 로그인 상태 및 프로필 공유
 *             <Header />      ← 모든 페이지 상단 내비게이션 (개발 모드)
 *             {children}      ← 실제 페이지 내용
 *             <Footer />      ← 모든 페이지 하단 푸터 (개발 모드)
 *           </AuthProvider>
 *           <ToastContainer/> ← Toast 메시지 화면 표시
 *         </ToastProvider>
 *       </ErrorBoundary>
 *     </body>
 *   </html>
 * 
 * ■ 변경사항 (2026-04-22)
 *   - Header/Footer 추가: 모든 페이지에서 표시되도록 수정
 *   - 홈게이트 제거: 프로덕션 배포 시 불필요한 임시 구조
 *   - 모든 사용자가 홈컨텐츠에 직접 접속 가능
 * 
 * ■ 주의: Root Layout은 Server Component이므로 'use client' 미사용
 *   Provider들(AuthProvider, ToastProvider 등)은 이 파일 내에서
 *   클라이언트 컴포넌트이므로 정상 작동합니다.
 */

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#06060a] text-gray-200">
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <Header />
              <main className="flex-grow w-full">
                {children}
              </main>
              <Footer />
              <ToastContainer />
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
