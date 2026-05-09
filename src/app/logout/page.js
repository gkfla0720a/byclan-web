'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// useSearchParams를 사용할 때는 Suspense로 감싸주는 것이 Next.js 13+의 규칙입니다.
function LogoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 '?from=/ladder' 같은 값을 읽어옵니다. 없으면 기본값은 홈('/')
  const returnUrl = searchParams.get('from') || '/';

  const handleReLogin = () => {
    // 다시 로그인 페이지로 갈 때, '로그인 끝나면 여기로 돌려보내줘'라는 꼬리표를 달아 보냅니다.
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-center px-2 sm:px-6 mb-10 max-w-6xl mx-auto min-h-[50vh]">
      <div className="bg-gray-900/80 p-10 rounded-3xl border border-gray-700/50 shadow-2xl text-center animate-fade-in-down backdrop-blur-xl">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
          안전하게 로그아웃 되었습니다
        </h2>
        <p className="text-gray-400 mb-8 text-sm sm:text-base">
          기기가 공용 PC라면 브라우저를 완전히 종료해 주시는 것이 좋습니다.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button 
            onClick={handleReLogin} 
            className="px-6 py-3.5 border border-cyan-500/40 rounded-xl text-cyan-300 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-black hover:bg-cyan-900/50 hover:border-cyan-400 transition-all"
          >
            기존 페이지로 다시 로그인
          </button>
          <button 
            onClick={handleGoHome}
            className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all border border-gray-700 hover:border-gray-500"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500 font-mono">로딩 중...</div>}>
      <LogoutContent />
    </Suspense>
  );
}