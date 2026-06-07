// 파일명: src/hooks/auth/useAuthMutations.ts

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput } from '@/utils/accountId';
import type { Provider } from '@supabase/supabase-js';

// ── 1. 이메일/비밀번호 로그인 ──────────────────────────
export const usePasswordSignIn = () => {
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const email = getLoginEmailFromInput(userId);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      return data.user;
    },
  });
};

// ── 2. 회원가입 ────────────────────────────────────────
export const usePasswordSignUp = () => {
  return useMutation({
    mutationFn: async ({
      accountId,
      nickname,
      password,
    }: {
      accountId: string;
      nickname: string;
      password: string;
    }) => {
      const systemEmail = buildInternalAuthEmail(accountId);

      const { data, error } = await supabase.auth.signUp({
        email: systemEmail,
        password,
        options: { data: { login_id: accountId, By_Nickname: nickname } },
      });
      if (error) throw error;
      if (!data.user) throw new Error('회원가입에 실패했습니다.');

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        account_id: accountId,
        by_id: `By_${nickname}`,
        role: 'applicant',
        clan_point: 0,
      });
      if (profileError) throw new Error('프로필 생성에 실패했습니다.');

      return data.user;
    },
  });
};

// ── 3. OAuth 로그인 ────────────────────────────────────
export const useOAuthSignIn = () => {
  return useMutation({
    mutationFn: async (provider: Provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
  });
};
