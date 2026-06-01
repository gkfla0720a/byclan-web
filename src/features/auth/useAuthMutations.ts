// 파일명: src/features/auth/useAuthMutations.ts

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput } from '@/utils/accountId';
import type { Provider, User } from '@supabase/supabase-js';
import type { AccountTypes } from 'src/types/account';

const AuthChecker = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const isNicknameValid = /^[a-zA-Z0-9]{2,20}$/.test(nickname);
  const [accountId, setAccountId] = useState('');
  const [isAccountIdChecked, setIsAccountIdChecked] = useState(false);
  const isAccountIdValid = /^[^0-9]/.test(accountId) && /^[a-zA-Z0-9]{2,20}$/.test(accountId);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const checkAccountDupl = async () => {
    if (!accountId) return alert("계정ID를 입력해 주세요.");
    if (!isAccountIdValid) return alert("형식에 맞지 않는 계정ID입니다. 영문으로 시작하고 영문과 숫자만 사용하여 2~20자로 작성해 주세요.");

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (error) {
      alert("오류 발생: " + error.message);
    } else if (count && count > 0) {
      alert("이미 존재하는 계정ID입니다.");
      setIsAccountIdChecked(false);
    } else {
      alert("사용 가능한 계정ID입니다!");
      setIsAccountIdChecked(true);
    }
  };

  const checkNickDupl = async () => {
    if (!nickname) return alert("닉네임을 입력해 주세요.");
    if (!isNicknameValid) return alert("형식에 맞지 않는 By_닉네임입니다. 영문과 숫자만 사용하여 2~20자로 작성해 주세요.");

    const fullID = `By_${nickname}`;
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('by_id', fullID);

    if (error) {
      alert("오류 발생: " + error.message);
    } else if (count && count > 0) {
      alert("이미 전장에 참여 중인 닉네임입니다.");
      setIsNicknameChecked(false);
    } else {
      alert("사용 가능한 닉네임입니다!");
      setIsNicknameChecked(true);
    }
  };

  const useOAuthSignIn = () => {
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
};
export default AuthChecker;