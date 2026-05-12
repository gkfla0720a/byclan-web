// 파일명: src/app/layout.js

import "./globals.css";
import { Noto_Sans_KR } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";
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
 */

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"], // Next.js 필수 설정
  weight: ["400", "600", "700"], // 본문용(400), 부제목용(600), 제목용(700) 굵기만 가져와서 용량을 줄입니다.
  display: "swap", // 폰트가 로딩되는 동안 기본 글꼴을 보여주어 깜빡임을 방지합니다.
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className={`${notoSansKr.className} min-h-full flex flex-col bg-[#06060a] text-gray-200 font-semibold relative`}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col relative z-0">
                {children}
              </div>
              <ToastContainer />
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
