'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // PKCE 흐름: URL에 code 쿼리 파라미터가 있으면 코드 교환
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            router.push('/?error=auth_callback_error');
            return;
          }
          const next = params.get('next');
          window.location.replace(next && next.startsWith('/') ? next : '/');
          return;
        }

        // Implicit 흐름: hash에 access_token이 있으면 세션 확인
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_callback_error');
          return;
        }

        if (data.session) {
          const next = params.get('next');
          window.location.replace(next && next.startsWith('/') ? next : '/');
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