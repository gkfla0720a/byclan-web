'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_callback_error');
          return;
        }

        if (data.session) {
          // 로그인 성공 시 메인 페이지로 리디렉션
          router.push('/');
        } else {
          // 세션이 없으면 로그인 페이지로
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