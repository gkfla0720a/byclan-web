/**
 * 파일명: login/page.js
 *
 * 역할: /login 경로의 Next.js 페이지 컴포넌트입니다.
 *       이미 로그인한 사용자는 홈(/)으로 자동 리다이렉트하고,
 *       비로그인 사용자에게 ImprovedAuthForm을 보여줍니다.
 * 주요 기능: 로그인 상태 감지 후 리다이렉트, 인증 성공 시 홈 이동, 뒤로가기 버튼
 * 사용 방법: Next.js 라우터가 자동으로 렌더링합니다. (/login 접근 시)
 */
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImprovedAuthForm from '../components/ImprovedAuthForm';
import { useAuthContext } from '../context/AuthContext';

/**
 * LoginPage 컴포넌트
 *
 * 로그인 페이지 진입점입니다.
 * 이미 로그인된 상태라면 즉시 홈(/)으로 이동합니다.
 *
 * @returns {JSX.Element|null} 인증 폼 UI, 또는 이미 로그인 시 null
 */
export default function LoginPage() {
  /** Next.js 라우터 (페이지 이동에 사용) */
  const router = useRouter();
  /** AuthContext에서 가져온 현재 사용자 정보와 로그인 성공 핸들러 */
  const { user, handleAuthSuccess } = useAuthContext();

  /** user가 존재할 때(이미 로그인) 홈으로 리다이렉트합니다 */
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-transparent flex flex-col items-center px-4 py-8 sm:py-10 relative z-10">
      <ImprovedAuthForm
        onSuccess={(u) => {
          handleAuthSuccess(u);
          router.replace('/');
        }}
      />
      <button
        onClick={() => router.back()}
        className="mt-5 text-gray-500 hover:text-gray-300 text-sm underline underline-offset-4"
      >
        ← 돌아가기
      </button>
    </div>
  );
}
