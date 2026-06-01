// 파일명: src/components/ImprovedAuthForm.tsx

'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { isLegacyEmailLogin } from '@/utils/accountId';
import { TERMS_OF_SERVICE } from '@/utils/docsData';
import { formId, formNick } from '@/utils/joinProcess';
import { AuthChecker } from '@/features/auth/useAuthMutations';
import { ErrorMessage, SkeletonLoader } from './UIStates';



// ── 3. 내장 아이디/비밀번호 인증 폼 컴포넌트 ─────────────────────────────────
const EmailLoginForm = ({ onSuccess }: { onSuccess: (user: any) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 백엔드 mutation 훅들 연동
  const signInMutation = usePasswordSignIn();
  const signUpMutation = usePasswordSignUp();
  const oauthMutation = useOAuthSignIn();

  // 리액트 훅 폼의 세련된 수첩 관리 기술 도입
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      accountId: '',
      nickname: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    mode: 'onSubmit',
  });

  // 실시간 타이핑 감시 스파이 장착
  const accountId = useWatch({ control, name: 'accountId' });
  const nickname = useWatch({ control, name: 'nickname' });
  const password = useWatch({ control, name: 'password' });
  const termsAccepted = useWatch({ control, name: 'termsAccepted' });

  // 유효성 판정 메커니즘 가동
  const isAccountIdValid = formId(accountId);
  const isNicknameValid = formNick(nickname);

  const loading = signInMutation.isPending || signUpMutation.isPending;
  const discordLoading = oauthMutation.isPending && oauthMutation.variables === 'discord';
  const googleLoading = oauthMutation.isPending && oauthMutation.variables === 'google';

  // 에러 메시지 통합 처리 센터
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

  const { addToast } = useToast();

  /**
   * 최종 양식 제출 처리기 (Submit Handler)
   */
  const handleAuth = async (data: any) => {
    signInMutation.reset();
    signUpMutation.reset();
    oauthMutation.reset();

    if (isSignUp) {
      // 회원가입 프로세스 작동 (가짜 시스템 이메일 변환은 usePasswordSignUp 훅 내부 혹은 껍데기에서 처리됩니다)
      await signUpMutation.mutateAsync({
        accountId: data.accountId,
        nickname: data.nickname,
        password: data.password
      });
      addToast({ type: 'success', message: 'ByClan에 오신 것을 환영합니다! 로그인을 진행하세요.', duration: 3000 });

      setIsSignUp(false);
      reset();
      return;
    }

    // 로그인 프로세스 작동
    const user = await signInMutation.mutateAsync({
      userId: data.accountId, // 훅 스펙에 따라 맵핑
      password: data.password,
    });
    onSuccess(user);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-[2.5rem] border border-gray-700 shadow-2xl relative overflow-hidden">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tighter">
        {isSignUp ? 'JOIN BYCLAN' : 'BATTLE-NET LOGIN'}
      </h2>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit(handleAuth)} className="space-y-5">

        {/* ── 계정 ID 입력 칸 ── */}
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">계정 ID</label>
          <div className={`flex items-center bg-gray-900 border rounded-2xl overflow-hidden transition-all mt-1 ${isSignUp && accountId && !isAccountIdValid ? 'border-red-500' : 'border-gray-700 focus-within:border-yellow-500'
            }`}>
            <input
              type="text"
              placeholder="계정 ID (영문 시작, 2~20자)"
              className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold"
              maxLength={20}
              {...register('accountId', {
                required: '계정ID를 입력해 주세요.',
                validate: (val) => !isAccountIdValid && '형식에 맞지 않는 계정ID입니다.',
              })}
            />
          </div>
          {accountId && !isAccountIdValid && (
            <p className="text-[11px] text-red-400 mt-2 ml-1 font-bold animate-pulse">
              영문 시작, 영문+숫자 조합의 2~20자여야 합니다.
            </p>
          )}
        </div>

        {/* ── 클랜 닉네임 입력 칸 (가입 시에만 등장) ── */}
        {isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">By_닉네임</label>
            <div className={`flex items-center bg-gray-900 border rounded-2xl overflow-hidden transition-all mt-1 ${nickname && !isNicknameValid ? 'border-red-500' : 'border-gray-700 focus-within:border-yellow-500'
              }`}>
              <span className="px-4 text-yellow-500 font-black text-sm bg-gray-800/50 h-full flex items-center border-r border-gray-700">By_</span>
              <input
                type="text"
                placeholder="영문+숫자, 2~20자"
                className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold"
                maxLength={20}
                {...register('nickname', {
                  required: isSignUp ? '닉네임을 입력해 주세요.' : false,
                  validate: (val) => !isNicknameValid && '형식에 맞지 않는 닉네임입니다.',
                })}
              />
            </div>
            {nickname && !isNicknameValid && (
              <p className="text-[11px] text-red-400 mt-2 ml-1 font-bold animate-pulse">
                영문+숫자, 2~20자로 작성해주세요.
              </p>
            )}
          </div>
        )}

        {/* ── 비밀번호 입력 칸 ── */}
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500"
            {...register('password', {
              required: '비밀번호를 입력해 주세요.',
              minLength: { value: 8, message: '비밀번호는 최소 8자 이상이어야 합니다.' },
              validate: (val) => {
                if (!/[a-zA-Z]/.test(val)) return '비밀번호에 영문자가 포함되어야 합니다.';
                if (!/[0-9]/.test(val)) return '비밀번호에 숫자가 포함되어야 합니다.';
                return true;
              }
            })}
          />
          {isSignUp && password && (
            <div className="mt-2 flex gap-3 text-[11px] ml-1">
              <span className={password.length >= 8 ? 'text-emerald-400 font-bold' : 'text-gray-600'}>✓ 8자 이상</span>
              <span className={/[a-zA-Z]/.test(password) ? 'text-emerald-400 font-bold' : 'text-gray-600'}>✓ 영문 포함</span>
              <span className={/[0-9]/.test(password) ? 'text-emerald-400 font-bold' : 'text-gray-600'}>✓ 숫자 포함</span>
            </div>
          )}
        </div>

        {/* ── 비밀번호 확인 입력 칸 (가입 시에만 등장) ── */}
        {isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Confirm Password</label>
            <input
              type="password"
              placeholder="비밀번호 확인"
              className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500"
              {...register('confirmPassword', {
                required: isSignUp ? '비밀번호 확인을 입력해 주세요.' : false,
                validate: (val) => !isSignUp || val === password || '비밀번호가 서로 일치하지 않습니다.',
              })}
            />
          </div>
        )}

        {/* ── 약관 동의 및 슬라이드형 모달 연동 구역 (가입 시에만 등장) ── */}
        {isSignUp && (
          <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  id="tos-check"
                  type="checkbox"
                  className="mt-1 w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                  {...register('termsAccepted', {
                    validate: (val) => !isSignUp || val || '이용약관에 동의해야 가입할 수 있습니다.',
                  })}
                />
                <label htmlFor="tos-check" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer">
                  <span className="text-yellow-500 font-black">[필수]</span> 이용약관 및 개인정보 동의
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-[10px] text-gray-500 hover:text-yellow-500 font-bold underline shrink-0 mt-0.5"
              >
                약관보기
              </button>
            </div>

            {/* 숨겨진 톱니바퀴 스위치(showTerms)가 켜지면 나타나는 약관 뷰어 */}
            {showTerms && (
              <div className="mt-2 rounded-xl bg-gray-950 p-3 border border-gray-800 text-[11px] text-gray-400 max-h-32 overflow-y-auto whitespace-pre-line leading-relaxed relative">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-white font-bold"
                >
                  ✕
                </button>
                {TERMS_OF_SERVICE}
              </div>
            )}
          </div>
        )}

        {/* ── 메인 제출 버튼 ── */}
        <button
          type="submit"
          disabled={loading || (isSignUp && !termsAccepted)}
          className="w-full py-4 mt-4 font-black rounded-2xl transition-all shadow-xl text-sm tracking-widest bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? <SkeletonLoader count={1} /> : (isSignUp ? 'REGISTER ACCOUNT' : 'LOGIN SYSTEM')}
        </button>
      </form>

      {/* ── 모드 전환 스위치 버튼 ── */}
      <div className="mt-8 text-center border-t border-gray-700 pt-6">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            signInMutation.reset();
            signUpMutation.reset();
            oauthMutation.reset();
            setShowTerms(false);
            reset();
          }}
          className="text-xs text-gray-500 font-bold hover:text-yellow-500 uppercase tracking-tighter"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'No account yet? Register Here'}
        </button>
      </div>

      {/* ── 하단 소셜 로그인(OAuth) 연동 구역 ── */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-center text-gray-600 text-xs font-bold mb-3 uppercase tracking-widest">OR</div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => oauthMutation.mutate('discord')}
            disabled={discordLoading}
            className="w-full py-3 bg-indigo-700/20 border border-indigo-600/30 text-indigo-300 font-black rounded-2xl text-xs tracking-wider hover:bg-indigo-700/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>{discordLoading ? 'CONNECTED...' : 'DISCORD AUTHENTICATION'}</span>
          </button>
          <button
            type="button"
            onClick={() => oauthMutation.mutate('google')}
            disabled={googleLoading}
            className="w-full py-3 bg-white/5 border border-gray-700 text-gray-300 font-black rounded-2xl text-xs tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🌐</span>
            <span>{googleLoading ? 'CONNECTED...' : 'GOOGLE OAUTH LOGIN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 4. 최상위 레이아웃 배치 컨테이너 (기본 내보내기 부품) ───────────────────────
export default function ImprovedAuthForm({ onSuccess }: { onSuccess: (user: any) => void }) {
  return (
    <div className="w-full max-w-5xl relative z-10">
      <div className="absolute -inset-2 rounded-[28px] bg-[radial-gradient(circle_at_25%_20%,rgba(234,179,8,0.1)_0%,transparent_72%)] pointer-events-none" />

      <div className="relative overflow-hidden rounded-3xl border border-gray-700 bg-gray-900/90 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">

          {/* 사이드 대문 비주얼 영역 */}
          <section className="hidden lg:flex flex-col justify-between p-12 border-r border-gray-800 bg-[linear-gradient(145deg,rgba(17,24,39,0.6)_0%,rgba(3,7,18,0.95)_100%)]">
            <div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none">
                BYCLAN <span className="text-yellow-500">NET</span>
              </h1>
              <p className="text-gray-500 text-xs mt-3 uppercase tracking-[0.2em] font-bold">
                스타크래프트 No.1 빠른무한 클랜
              </p>
            </div>
          </section>

          {/* 실질적 로그인 폼 바디 영역 */}
          <section className="p-6 sm:p-8 flex items-center justify-center bg-gray-900/40">
            <div className="w-full">
              <div className="mb-6 text-center lg:hidden">
                <h1 className="text-4xl font-black text-white italic tracking-tight">
                  BYCLAN <span className="text-yellow-500">NET</span>
                </h1>
                <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.18em] font-bold">
                  스타크래프트 No.1 빠른무한 클랜
                </p>
              </div>

              <EmailLoginForm onSuccess={onSuccess} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}