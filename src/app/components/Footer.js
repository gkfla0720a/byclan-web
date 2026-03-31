'use client';

import React from 'react';

// 로고를 푸터에서도 쓰기 위해 컴포넌트 안에 간단히 포함했습니다
function ByClanLogo() {
  const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <img src={logoUrl} alt="ByClan Logo" className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" style={{ filter: "drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.6))" }} />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-gray-950 border-t border-gray-800 mt-16 py-8 sm:py-12 px-4 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-3">
            <ByClanLogo />
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700">ByClan</span>
          </div>
          <p className="text-gray-500 text-sm">스타크래프트 리마스터 빠른무한 공식 길드</p>
          <p className="text-gray-600 text-xs mt-1">© 2026 ByClan. All rights reserved.</p>
        </div>
        
        <div className="flex gap-8 text-sm text-gray-400">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-gray-200 font-bold mb-1">지원</span>
            <a href="#" className="hover:text-yellow-500 transition-colors">가입 신청</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">운영진 문의</a>
          </div>
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-gray-200 font-bold mb-1">규칙</span>
            <a href="#" className="hover:text-yellow-500 transition-colors">클랜 회칙</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">매너 규정</a>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end">
          <span className="text-gray-300 font-bold mb-3">공식 커뮤니티 참가</span>
          <button className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-transform hover:scale-105">
            Discord 입장
          </button>
        </div>
      </div>
    </footer>
  );
}
