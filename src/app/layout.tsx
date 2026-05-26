// 파일명: src/app/layout.tsx

import "./globals.css";
import Providers from "@/app/providers";
import { Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { type ReactNode } from 'react';

export const metadata = {
  title: "ByClan NET – 스타크래프트 빠른무한 클랜",
  description: "ByClan 클랜 공식 홈페이지. 래더 시스템, 토너먼트, 클랜원 커뮤니티.",
};
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"], // Next.js 필수 설정
  weight: ["400", "600", "700"], // 본문용(400), 부제목용(600), 제목용(700) 굵기만 가져와서 용량을 줄입니다.
  display: "swap", // 폰트가 로딩되는 동안 기본 글꼴을 보여주어 깜빡임을 방지합니다.
});

export default function RootLayout({ children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className={`${notoSansKr.className} min-h-full flex flex-col bg-(--bg-primary) text-gray-200 font-semibold relative`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
