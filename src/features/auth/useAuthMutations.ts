// 파일명: src/features/auth/useAuthMutations.ts

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput } from '@/utils/accountId';
import type { Provider, User } from '@supabase/supabase-js';

interface SignInParams {
  userId: string;
  password?: string;
}

interface SignUpParams {
  normalizedUserId: string;
  password?: string;
}

export function usePasswordSignIn() {
  return useMutation({
    mutationFn: async ({ userId, password }: SignInParams): Promise<User> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: getLoginEmailFromInput(userId),
        password: password || '',
      });

      if (error) throw error;
      if (!data.user) throw new Error('인증 결과에 사용자 정보가 없습니다.');
      return data.user;
    },
  });
}

export function usePasswordSignUp() {
  return useMutation({
    mutationFn: async ({ normalizedUserId, password }: SignUpParams): Promise<User> => {
      const byId = `By_${normalizedUserId}`;
      const internalEmail = buildInternalAuthEmail(normalizedUserId);

      // 이미 있는 By_ID인지 체크
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('by_id', byId)
        .maybeSingle();

      if (existing) {
        throw new Error('이미 사용 중인 아이디입니다. 다른 아이디를 선택하세요.');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: internalEmail,
        password: password || '',
        options: {
          data: {
            login_id: normalizedUserId,
            by_id: byId,
            role: 'applicant', // 👈 새로 바뀐 직급 체계
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('회원가입 실패: 사용자 정보가 반환되지 않았습니다.');

      // 회원가입 직후 프로필 데이터 생성 (동기화)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          by_id: byId,
          role: 'applicant',
          clan_point: 0,
          race: 'Terran', // 또는 미지정
          intro: '새로운 클랜원입니다.',
        });

      if (profileError) throw profileError;

      return data.user;
    },
  });
}

export function useOAuthSignIn() {
  return useMutation({
    mutationFn: async (provider: Provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    },
  });
}