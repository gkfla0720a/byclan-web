/**
 * 파일명: auth/callback/page.js
 *
 * 역할: Discord OAuth 또는 이메일 인증 후 Supabase가 리다이렉트하는 콜백 페이지입니다.
 * 주요 기능:
 *   - PKCE 흐름: URL의 ?code= 파라미터로 세션 교환 후 목적지로 이동합니다.
 *   - Implicit 흐름: URL hash의 access_token으로 세션을 확인한 뒤 이동합니다.
 *   - open redirect 방지: ?next= 파라미터를 허용 목록(ALLOWED_PATHS)으로 제한합니다.
 *   - 에러 발생 시 홈(/?error=...)으로 이동합니다.
 * 사용 방법: Next.js 라우터가 /auth/callback 접근 시 자동으로 렌더링합니다.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

/**
 * AuthCallback 컴포넌트
 *
 * OAuth/이메일 인증 콜백을 처리하고 적절한 페이지로 리다이렉트합니다.
 * 처리 중에는 "Discord 로그인 처리 중..." 로딩 화면을 표시합니다.
 *
 * @returns {JSX.Element} 로딩 화면 UI
 */
export default function AuthCallback() {
  /** Next.js 라우터 (에러 시 홈으로 이동에 사용) */
  const router = useRouter();

  /** 컴포넌트 마운트 시 즉시 인증 콜백 처리를 시작합니다 */
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // PKCE 흐름: URL에 code 쿼리 파라미터가 있으면 코드 교환
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const rawNext = params.get('next');
        // 허용된 리다이렉트 경로만 사용 (open redirect 방지)
        const ALLOWED_PATHS = ['/ladder', '/profile', '/dashboard', '/ranking', '/members', '/notice', '/community'];
        const nextPath = (rawNext && ALLOWED_PATHS.includes(rawNext)) ? rawNext : '/';

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            router.push('/?error=auth_callback_error');
            return;
          }
          window.location.replace(nextPath);
          return;
        }

        // Implicit 흐름: hash에 access_token이 있으면 Auth 서버 기준으로 사용자 검증
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_callback_error');
          return;
        }

        if (data.user) {
          window.location.replace(nextPath);
        } else {
          router.push('/?error=no_session');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="text-white text-xl mb-4">Discord 로그인 처리 중...</div>
        <div className="text-gray-400">잠시만 기다려주세요.</div>
      </div>
    </div>
  );
}