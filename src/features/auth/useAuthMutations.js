import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput } from '@/utils/accountId';

export function usePasswordSignIn() {
  return useMutation({
    mutationFn: async ({ userId, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: getLoginEmailFromInput(userId),
        password,
      });

      if (error) throw error;
      return data.user;
    },
  });
}

export function usePasswordSignUp() {
  return useMutation({
    mutationFn: async ({ normalizedUserId, password }) => {
      const byId = `By_${normalizedUserId}`;
      const internalEmail = buildInternalAuthEmail(normalizedUserId);

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
        password,
        options: {
          data: {
            login_id: normalizedUserId,
            by_id: byId,
            role: 'applicant',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            by_id: byId,
            role: 'applicant',
            clan_point: 0,
            race: 'Terran',
            intro: '새로운 클랜원입니다.',
          });

        if (profileError) throw profileError;
      }

      return data.user;
    },
  });
}

export function useOAuthSignIn() {
  return useMutation({
    mutationFn: async (provider) => {
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
