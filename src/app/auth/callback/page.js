/**
 * 파일명: auth/callback/page.js
 *
 * 역할: Discord OAuth 또는 이메일 인증 후 Supabase가 리다이렉트하는 콜백 페이지입니다.
 * 주요 기능:
 *   - PKCE 흐름: URL의 ?code= 파라미터로 세션 교환 후 목적지로 이동합니다.
 *   - Implicit 흐름: URL hash의 access_token으로 세션을 확인한 뒤 이동합니다.
 *   - open redirect 방지: ?next= 파라미터를 허용 목록(ALLOWED_PATHS)으로 제한합니다.
 *   - 소셜 계정 연동(link_provider): 이미 로그인한 유저가 Discord/Google을 연동할 때
 *     중복 연동 여부를 확인하고, 다른 계정에 이미 연동된 경우 충돌 에러를 반환합니다.
 *   - 에러 발생 시 홈(/?error=...)으로 이동합니다.
 * 사용 방법: Next.js 라우터가 /auth/callback 접근 시 자동으로 렌더링합니다.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

/**
 * 소셜 계정 연동 콜백을 처리합니다.
 *
 * link_provider(discord|google) 파라미터가 있을 때:
 *  1. 방금 연동된 소셜 아이디를 profiles 테이블의 다른 계정과 비교합니다.
 *  2. 충돌이 있으면 방금 추가한 identity를 다시 해제하고 에러 페이지로 이동합니다.
 *  3. 충돌이 없으면 profiles 테이블에 소셜 정보를 저장하고 성공 페이지로 이동합니다.
 *
 * @param {object} user       - supabase.auth.getUser() 결과의 user 객체
 * @param {string} provider   - 'discord' | 'google'
 * @returns {Promise<string>} - 리다이렉트할 경로 (성공 또는 에러)
 */
async function handleLinkCallback(user, provider) {
  const identities = user.identities || [];

  if (provider === 'discord') {
    const identity = identities.find((i) => i.provider === 'discord');
    if (!identity) return '/profile?error=link_failed';

    const discordId =
      identity.identity_data?.sub ||
      identity.identity_data?.provider_id ||
      identity.identity_id ||
      null;
    const discordName =
      identity.identity_data?.preferred_username ||
      identity.identity_data?.full_name ||
      identity.identity_data?.name ||
      'User';

    if (!discordId) return '/profile?error=link_failed';

    // 다른 계정에 이미 연동된 Discord ID인지 확인
    const { data: conflict } = await supabase
      .from('profiles')
      .select('id, ByID')
      .eq('discord_id', discordId)
      .neq('id', user.id)
      .maybeSingle();

    if (conflict) {
      // 방금 연동한 identity를 다시 해제합니다
      if (identities.length > 1) {
        try { await supabase.auth.unlinkIdentity(identity); } catch { /* 무시 */ }
      }
      return '/profile?error=discord_conflict';
    }

    // 충돌 없음 – profiles 테이블에 Discord 정보 저장
    await supabase
      .from('profiles')
      .update({ discord_id: discordId, discord_name: discordName })
      .eq('id', user.id);

    return '/profile?linked=discord';
  }

  if (provider === 'google') {
    const identity = identities.find((i) => i.provider === 'google');
    if (!identity) return '/profile?error=link_failed';

    const googleSub =
      identity.identity_data?.sub ||
      identity.identity_id ||
      null;
    const googleEmail = identity.identity_data?.email || null;
    const googleName =
      identity.identity_data?.full_name ||
      identity.identity_data?.name ||
      null;
    const googleAvatarUrl =
      identity.identity_data?.avatar_url ||
      identity.identity_data?.picture ||
      null;

    if (!googleSub) return '/profile?error=link_failed';

    // 다른 계정에 이미 연동된 Google 계정인지 확인
    const { data: conflict } = await supabase
      .from('profiles')
      .select('id, ByID')
      .eq('google_sub', googleSub)
      .neq('id', user.id)
      .maybeSingle();

    if (conflict) {
      if (identities.length > 1) {
        try { await supabase.auth.unlinkIdentity(identity); } catch { /* 무시 */ }
      }
      return '/profile?error=google_conflict';
    }

    // 충돌 없음 – profiles 테이블에 Google 정보 저장
    const updates = {};
    if (googleSub) updates.google_sub = googleSub;
    if (googleEmail) updates.google_email = googleEmail;
    if (googleName) updates.google_name = googleName;
    if (googleAvatarUrl) updates.google_avatar_url = googleAvatarUrl;
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }

    return '/profile?linked=google';
  }

  return '/profile';
}

/**
 * AuthCallback 컴포넌트
 *
 * OAuth/이메일 인증 콜백을 처리하고 적절한 페이지로 리다이렉트합니다.
 * 처리 중에는 "소셜 로그인 처리 중..." 로딩 화면을 표시합니다.
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
        const linkProvider = params.get('link_provider');
        // 허용된 리다이렉트 경로만 사용 (open redirect 방지)
        const ALLOWED_PATHS = ['/ladder', '/profile', '/dashboard', '/ranking', '/members', '/notice', '/community'];
        const nextPath = (rawNext && ALLOWED_PATHS.includes(rawNext)) ? rawNext : '/';

        if (code) {
          const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            router.push('/?error=auth_callback_error');
            return;
          }

          // 소셜 계정 연동 흐름: link_provider 파라미터가 있으면 충돌 검사 수행
          // exchangeCodeForSession 응답의 user를 재사용하여 불필요한 API 호출을 줄입니다
          if (linkProvider === 'discord' || linkProvider === 'google') {
            const user = sessionData?.user;
            if (user) {
              const redirectTo = await handleLinkCallback(user, linkProvider);
              window.location.replace(redirectTo);
              return;
            }
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
        <div className="text-white text-xl mb-4">소셜 로그인 처리 중...</div>
        <div className="text-gray-400">잠시만 기다려주세요.</div>
      </div>
    </div>
  );
}