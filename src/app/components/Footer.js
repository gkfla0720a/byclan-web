/**
 * =====================================================================
 * 파일명: src/app/components/Footer.js
 * 역할  : 웹사이트 최하단에 표시되는 푸터(Footer) 컴포넌트입니다.
 *         로고, 빠른 링크, Discord 입장 버튼을 포함합니다.
 *
 * ■ 표시 내용
 *   왼쪽:  ByClan 로고 + 클랜 소개 문구 + 저작권 표시
 *   중앙:  빠른 링크 (지원: 가입 신청, 건의사항 / 규칙: 클랜 회칙, 매너 규정)
 *   오른쪽: Discord 커뮤니티 입장 버튼
 *
 * ■ 스타일
 *   배경: bg-gray-950 (매우 진한 검정)
 *   상단 경계: border-t border-gray-800
 *   반응형: 모바일(세로), 데스크톱(가로 배치)
 * =====================================================================
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { useNavigate } from '../hooks/useNavigate';

/**
 * ByClanLogo()
 * - Footer용 ByClan 로고 이미지 컴포넌트입니다.
 * - Header의 ByClanLogo와 동일한 디자인입니다.
 */
// === 로고 컴포넌트 === 
function ByClanLogo() {
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <Image 
        src="/ByClanLogo_WebP.webp" 
        alt="ByClan Logo" 
        width={48}
        height={48}
        priority={true}
        unoptimized={true}
        className="object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" 
      />
    </div>
  );
}

/**
 * Footer()
 * - 모든 페이지 하단에 표시되는 푸터 컴포넌트입니다.
 * - 클랜 정보, 빠른 링크, Discord 입장 버튼을 3단 구조로 표시합니다.
 */
export default function Footer() {
  const navigateTo = useNavigate();

  return (
    <footer className="w-full bg-gray-950 border-t border-gray-800 mt-16 py-8 sm:py-12 px-4 relative z-10">
      <div className="mx-auto space-y-8">

        {/* 메인 3단 영역 */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">

          {/* 왼쪽: 로고 + 후원계좌 */}
          <div className="hidden md:block w-52 lg:w-64 xl:w-80 shrink-0 flex flex-col items-center jestify-center md:items-start text-center md:text-left gap-4">
            {/* 로고 + 클랜명 */}
            <div className="flex items-baseline gap-3 cursor-pointer group" onClick={() => navigateTo('Home')}>
              <div className="self-center">
                <ByClanLogo />
              </div>
              <span
                className="text-3xl sm:text-4xl font-black tracking-widest shrink-0 transition-all duration-300 group-hover:brightness-110 pb-1"
                style={{
                  background: "linear-gradient(155deg, #FFE8C6 0%, #B89C60 20%, #C8A266 40%, #45372A 50%, #5E462E 60%, #B89C60 80%, #2E241C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "brightness(1.2)",
                  textShadow: "0px 1px 1px rgba(200, 162, 102, 0.4), 0px 1px 0px rgba(0, 0, 0, 0.3)"
                }}
              >
                ByClan
              </span>
            </div>
            <p className="text-gray-500 text-sm">스타크래프트 리마스터 빠른무한 공식 길드</p>
            <p className="text-gray-600 text-xs">© 2026 ByClan. All rights reserved.</p>

            {/* 후원 계좌 박스 */}
            <div className="w-full md:w-auto flex flex-col items-center md:items-start bg-gray-900 border border-yellow-600/30 rounded-xl px-5 py-3 gap-1 min-w-50">
              <span className="text-yellow-500 text-s font-bold tracking-widest uppercase">By후원계좌</span>
              <span className="text-gray-200 text-sm font-semibold tracking-wider">예금주: 신한캐피탈(주)</span>
              <span className="text-gray-400 text-sm">우리은행 1002-738-934965</span>
            </div>
          </div>

          {/* 중앙: 빠른 링크 */}
          <div className="flex gap-8 text-sm text-gray-400">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <span className="text-gray-200 font-bold mb-1">지원</span>
              <button
                onClick={() => navigateTo('가입안내')}
                className="hover:text-yellow-500 transition-colors text-left"
              >
                가입 신청
              </button>
              <a
                href="https://discord.gg/byclan"
                target="_blank"
                rel="noreferrer"
                className="hover:text-yellow-500 transition-colors text-left"
              >
                건의사항
              </a>
              <a
                href="https://discord.gg/byclan"
                target="_blank"
                rel="noreferrer"
                className="hover:text-yellow-500 transition-colors text-left"
              >
                운영진 문의
              </a>
            </div>
            <div className="flex flex-col gap-2 text-center md:text-left">
              <span className="text-gray-200 font-bold mb-1">규칙</span>
              <button
                onClick={() => navigateTo('공지사항')}
                className="hover:text-yellow-500 transition-colors text-left"
              >
                클랜 회칙
              </button>
              <button
                onClick={() => navigateTo('공지사항')}
                className="hover:text-yellow-500 transition-colors text-left"
              >
                매너 규정
              </button>
            </div>
          </div>

          {/* 오른쪽: Discord 참여 */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <span className="text-gray-300 font-bold mb-3">공식 커뮤니티 참가</span>
            <a
              href="https://discord.gg/byclan"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-transform hover:scale-105"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Discord 입장
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}