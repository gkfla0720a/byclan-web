'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/context/ToastContext';
import { formId, formNick } from '@/utils/joinProcess';
// 💡 기존에 작성해두신 백엔드 연동 Mutation 훅들을 그대로 가져옵니다.
import { usePasswordSignIn, usePasswordSignUp, useOAuthSignIn } from '@/hooks/auth/useAuthMutations';
import { AuthFormData } from '@/types';

export const useAuthForm = (onSuccess: (user: any) => void) => {
  const { success: toastSuccess } = useToast();

  // UI 스위칭 상태 관리
  const [isSignUp, setIsSignUp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. 기존 백엔드 Mutation 연결
  const signInMutation = usePasswordSignIn();
  const signUpMutation = usePasswordSignUp();
  const oauthMutation = useOAuthSignIn();

  // 2. React Hook Form 명세 설정
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AuthFormData>({
    defaultValues: {
      accountId: '',
      nickname: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    mode: 'onSubmit', // 첫 제출 전엔 에러 안 띄움 (필요시 'onChange'로 변경 가능)
  });

  // 3. 실시간 값 감시 및 유효성 검사 결과 도출
  const accountId = useWatch({ control, name: 'accountId' });
  const nickname = useWatch({ control, name: 'nickname' });
  const password = useWatch({ control, name: 'password' });
  const termsAccepted = useWatch({ control, name: 'termsAccepted' });

  const isAccountIdValid = formId(accountId);
  const isNicknameValid = formNick(nickname);

  // 4. Mutation들의 상태를 기반으로 통합 로딩 처리
  const loading = signInMutation.isPending || signUpMutation.isPending;
  const discordLoading = oauthMutation.isPending && oauthMutation.variables === 'discord';
  const googleLoading = oauthMutation.isPending && oauthMutation.variables === 'google';

  // 5. 프론트엔드 유효성 + 백엔드 API 에러 문자열 단일 파이프라인 구축
  const error =
    errors.accountId?.message ||
    errors.nickname?.message ||
    errors.password?.message ||
    errors.confirmPassword?.message ||
    errors.termsAccepted?.message ||
    signInMutation.error?.message ||
    signUpMutation.error?.message ||
    oauthMutation.error?.message ||
    null;

  /**
   * 6. 양식 제출 처리 로직 (비즈니스 액션)
   */
  const handleAuth = async (data: AuthFormData) => {
    // 새로운 요청 전 에러 상태 초기화
    signInMutation.reset();
    signUpMutation.reset();

    try {
      if (isSignUp) {
        // 회원가입 프로세스 실행 (Supabase Auth + profiles 인서트가 내부적으로 돌아감)
        await signUpMutation.mutateAsync({
          accountId: data.accountId,
          nickname: data.nickname,
          password: data.password,
        });

        toastSuccess('ByClan에 오신 것을 환영합니다! 로그인을 진행하세요.');
        setIsSignUp(false); // 가입 성공 시 로그인 탭으로 자동 복귀
        reset();            // 폼 필드 초기화
        return;
      }

      // 로그인 프로세스 실행
      const user = await signInMutation.mutateAsync({
        userId: data.accountId,
        password: data.password,
      });

      // 성공 시 상위 컴포넌트로 데이터 인계 (상위에서 useAuth().handleAuthSuccess 호출 목적)
      if (user) onSuccess(user);
    } catch {
      // 에러는 어차피 useMutation의 error 객체(위의 error 변수)에 포착되므로 무시합니다.
    }
  };

  /**
   * 7. 로그인 ↔ 회원가입 탭 전환 시 데이터를 깨끗하게 지워주는 핸들러
   */
  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    signInMutation.reset();
    signUpMutation.reset();
    oauthMutation.reset();
    setShowTerms(false);
    reset(); // 입력했던 폼 데이터 청소
  };

  return {
    isSignUp,
    showTerms,
    setShowTerms,
    showPassword,
    setShowPassword,
    register,
    handleSubmit,
    handleAuth,
    toggleAuthMode,
    // 실시간 상태 값
    accountId,
    nickname,
    password,
    termsAccepted,
    // 유효성 flag
    isAccountIdValid,
    isNicknameValid,
    // 로딩 및 에러
    loading,
    discordLoading,
    googleLoading,
    error,
    // 소셜 로그인 트리거용 mutation 매핑
    oauthMutation,
  };
};