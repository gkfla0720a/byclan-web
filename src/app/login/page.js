/**
 * 파일명: login/page.js
 *
 * 역할: /login 경로의 Next.js 페이지 컴포넌트입니다.
 * 이미 로그인한 사용자는 홈(/) 또는 요청한 이전 경로로 자동 리다이렉트하고,
 * 비로그인 사용자에게 ImprovedAuthForm을 보여줍니다.
 */
'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ImprovedAuthForm from '@/components/ImprovedAuthForm';
import { useAuthContext } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 💡 URL의 쿼리(?redirect=...)를 읽기 위한 훅
  const { user, handleAuthSuccess } = useAuthContext();

  // 💡 URL에서 돌아갈 주소(redirect)를 가져옵니다. 없다면 기본값은 홈('/')
  const redirectUrl = searchParams.get('redirect') || '/';

  /** user가 존재할 때(이미 로그인) 원래 가려던 곳으로 리다이렉트합니다 */
  useEffect(() => {
    if (user) {
      router.replace(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-transparent flex flex-col items-center px-4 py-8 sm:py-10 relative z-10">
      <ImprovedAuthForm
        onSuccess={(u) => {
          handleAuthSuccess(u);
          // 💡 로그인에 성공하면 무조건 홈('/')이 아니라, 원래 있던 곳(redirectUrl)으로 보냅니다!
          router.replace(redirectUrl);
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

/**
 * Next.js 13+ 규칙: useSearchParams를 사용하는 컴포넌트는 반드시 Suspense로 감싸야 합니다.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500 font-mono">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}