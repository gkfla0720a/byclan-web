/**
 * 파일명: ImprovedAuthForm.js
 *
 * 역할:
 *   이메일/비밀번호 로그인·회원가입과 Discord OAuth 로그인을 모두 지원하는
 *   통합 인증 폼 컴포넌트 모음입니다.
 *
 * 주요 기능:
 *   - EmailLoginForm: 이메일+비밀번호 로그인 및 회원가입 폼 (아이디 유효성 검사, 중복 확인, 이용약관 포함)
 *   - DiscordLoginForm: Discord OAuth 로그인 버튼 폼
 *   - ImprovedAuthForm: 위 두 폼을 loginMethod 상태로 전환하는 최상위 컨테이너
 *   - 회원가입 시 profiles 테이블에 기본 프로필을 자동 생성합니다.
 *
 * 사용 방법:
 *   import ImprovedAuthForm from './ImprovedAuthForm';
 *   <ImprovedAuthForm onSuccess={(user) => console.log('로그인 성공', user)} />
 */
'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';
import { ErrorMessage, SkeletonLoader } from './UIStates';

// ── 유효성 검사 헬퍼 ─────────────────────────────────────────────────────────
/**
 * 클랜 아이디(userId) 유효성을 검사합니다.
 * @param {string} id - 사용자가 입력한 아이디 (By_ 접두사 제외)
 * @returns {string|null} 오류 메시지 문자열, 또는 유효하면 null
 */
function validateUserId(id) {
  if (!id) return '아이디를 입력하세요.';
  if (id.length < 3) return '아이디는 최소 3자 이상이어야 합니다.';
  if (id.length > 20) return '아이디는 최대 20자 이하이어야 합니다.';
  if (!/^[a-zA-Z]/.test(id)) return '아이디는 영문자로 시작해야 합니다.';
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(id)) return '아이디는 영문자와 숫자만 사용할 수 있습니다.';
  return null;
}

/**
 * 비밀번호 유효성을 검사합니다.
 * @param {string} pw - 사용자가 입력한 비밀번호
 * @returns {string|null} 오류 메시지 문자열, 또는 유효하면 null
 */
function validatePassword(pw) {
  if (!pw) return '비밀번호를 입력하세요.';
  if (pw.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  if (!/[a-zA-Z]/.test(pw)) return '비밀번호에 영문자가 포함되어야 합니다.';
  if (!/[0-9]/.test(pw)) return '비밀번호에 숫자가 포함되어야 합니다.';
  return null;
}

// ── 이용약관 내용 ──────────────────────────────────────────────────────────────
const TERMS_OF_SERVICE = `ByClan 서비스 이용약관

제1조 (목적)
본 약관은 ByClan(이하 "클랜") 홈페이지 서비스 이용과 관련하여 클랜과 이용자 간의 권리·의무 및 책임사항을 규정하는 것을 목적으로 합니다.

제2조 (개인정보 수집 및 이용)
클랜은 서비스 제공을 위하여 다음 정보를 수집합니다.
- 이메일 주소: 계정 인증 및 안내 메일 발송
- 클랜 아이디(by_id): 서비스 내 식별자
- 디스코드 계정: 래더 시스템 참여 시 연동 (선택)
수집된 개인정보는 서비스 제공 목적으로만 이용되며 제3자에게 제공되지 않습니다.

제3조 (이용자의 의무)
이용자는 다음 행위를 금지합니다.
- 타인의 개인정보 무단 수집·이용
- 서비스를 이용한 불법 행위
- 클랜 활동에 방해가 되는 행위
- 허위 정보 기재

제4조 (서비스 이용)
가입 완료 시 '테스트신청자' 등급으로 시작합니다.
래더 참여 및 정식 활동은 클랜 가입 절차를 완료한 이후 가능합니다.

제5조 (개인정보 보유 및 파기)
회원 탈퇴 시 관련 정보는 즉시 파기됩니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보존합니다.`;

// ── 이메일 로그인/가입 ────────────────────────────────────────────────────────
/**
 * EmailLoginForm 컴포넌트
 *
 * 이메일+비밀번호로 로그인하거나 새 계정을 가입하는 폼입니다.
 * isSignUp 상태로 로그인 모드와 가입 모드를 전환합니다.
 * 폼 하단에 Discord OAuth 로그인 버튼이 함께 표시됩니다.
 *
 * @param {function} onSuccess - 로그인 성공 시 호출되는 콜백. 인자로 user 객체를 전달합니다.
 * @returns {JSX.Element} 이메일 인증 폼 UI (Discord 로그인 옵션 포함)
 */
function EmailLoginForm({ onSuccess }) {
  /** 클랜 아이디 입력값 (가입 시에만 사용, By_ 접두사 제외) */
  const [userId, setUserId] = useState('');
  /** 이메일 입력값 */
  const [email, setEmail] = useState('');
  /** 비밀번호 입력값 */
  const [password, setPassword] = useState('');
  /** API 요청 처리 중 여부 (true: 버튼 비활성화) */
  const [loading, setLoading] = useState(false);
  /** 에러 메시지 (null: 에러 없음) */
  const [error, setError] = useState(null);
  /** true면 회원가입 모드, false면 로그인 모드 */
  const [isSignUp, setIsSignUp] = useState(false);
  /** 이용약관 동의 여부 (가입 시 필수) */
  const [termsAccepted, setTermsAccepted] = useState(false);
  /** 이용약관 전문 표시 여부 (현재 UI에서 미사용, 확장용) */
  const [showTerms, setShowTerms] = useState(false);
  /** Discord OAuth 연동 처리 중 여부 */
  const [discordLoading, setDiscordLoading] = useState(false);
  /** Google OAuth 연동 처리 중 여부 */
  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * 폼 제출 핸들러입니다.
   * - isSignUp이 true면 아이디 중복 확인 → 회원가입 → 프로필 생성 순으로 처리합니다.
   * - isSignUp이 false면 이메일+비밀번호로 로그인합니다.
   * @param {React.FormEvent} e - 폼 submit 이벤트
   */
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 유효성 검사
        const userIdErr = validateUserId(userId);
        if (userIdErr) { setError(userIdErr); setLoading(false); return; }

        const pwErr = validatePassword(password);
        if (pwErr) { setError(pwErr); setLoading(false); return; }

        if (!termsAccepted) {
          setError('이용약관에 동의해야 가입할 수 있습니다.');
          setLoading(false);
          return;
        }

        const byId = `By_${userId}`;

        // 아이디 중복 확인
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('by_id', byId)
          .maybeSingle();

        if (existing) {
          setError('이미 사용 중인 아이디입니다. 다른 아이디를 선택하세요.');
          setLoading(false);
          return;
        }

        // 회원가입
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              by_id: byId,
              role: 'applicant'
            }
          }
        });

        if (signUpError) throw signUpError;

        // 프로필 생성
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              by_id: byId,
              role: 'applicant',
              clan_point: 0,
              race: 'Terran',
              intro: '새로운 클랜원입니다.'
            });

          if (profileError) {
            console.error('프로필 생성 실패:', profileError);
          }
        }

        alert('회원가입이 완료되었습니다! 이메일 인증 후 로그인하세요.');
        setIsSignUp(false);
        setUserId('');
        setPassword('');
        setTermsAccepted(false);
      } else {
        // 로그인
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Discord OAuth 로그인을 시작합니다.
   * Supabase가 Discord 인증 페이지로 리다이렉트하고,
   * 인증 완료 후 /auth/callback으로 돌아옵니다.
   */
  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message);
      setDiscordLoading(false);
    }
  };

  /**
   * Google OAuth 로그인을 시작합니다.
   * Supabase Authentication > Providers > Google 설정 필요.
   */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="cyber-card p-8 rounded-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isSignUp ? '클랜 가입' : '로그인'}
      </h2>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleAuth} className="space-y-4">
        {/* 아이디 필드 (가입 시만) */}
        {isSignUp && (
          <div>
            <label htmlFor="clan-user-id" className="block text-gray-300 text-sm font-medium mb-1">
              클랜 아이디 <span className="text-gray-500 text-xs">(영문 필수, 숫자 조합 선택, 3~20자)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold text-sm pointer-events-none">By_</span>
              <input
                id="clan-user-id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="YourID"
                className="w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                maxLength={20}
                required
              />
            </div>
            {userId && (
              <p className="text-xs mt-1 text-gray-400">
                클랜 아이디: <span className="text-cyan-400 font-bold">By_{userId}</span>
              </p>
            )}
          </div>
        )}

        {/* 이메일 */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">
            비밀번호
            {isSignUp && <span className="text-gray-500 text-xs ml-1">(8자 이상, 영문+숫자 필수)</span>}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            required
            minLength={isSignUp ? 8 : 1}
          />
          {isSignUp && password && (
            <div className="mt-1.5 flex gap-2 text-xs">
              <span className={password.length >= 8 ? 'text-green-400' : 'text-gray-600'}>✓ 8자 이상</span>
              <span className={/[a-zA-Z]/.test(password) ? 'text-green-400' : 'text-gray-600'}>✓ 영문 포함</span>
              <span className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-600'}>✓ 숫자 포함</span>
            </div>
          )}
        </div>

        {/* 이용약관 동의 (가입 시만) */}
        {isSignUp && (
          <div className="space-y-2">
            <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-900/60 border border-gray-700 p-3 text-xs text-gray-400 whitespace-pre-line leading-relaxed">
              {TERMS_OF_SERVICE}
            </div>
            <label htmlFor="tos-accept" className="flex items-start gap-2 cursor-pointer">
              <input
                id="tos-accept"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 accent-cyan-500 w-4 h-4 shrink-0"
              />
              <span className="text-sm text-gray-300">
                위 이용약관 및 개인정보 수집·이용에 동의합니다.{' '}
                <span className="text-red-400 font-bold">*</span>
              </span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (isSignUp && !termsAccepted)}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 0 14px rgba(0,212,255,0.2)' }}
        >
          {loading ? <SkeletonLoader count={1} /> : (isSignUp ? '가입하기' : '로그인')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setTermsAccepted(false); }}
          className="text-cyan-500 hover:text-cyan-400 text-sm"
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '아직 계정이 없으신가요? 가입하기'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-center text-gray-500 text-sm mb-3">또는</div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDiscordLogin}
            disabled={discordLoading}
            className="w-full py-2 bg-indigo-700/30 border border-indigo-600/40 text-indigo-300 font-medium rounded-lg hover:bg-indigo-700/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>{discordLoading ? '연동 중...' : 'Discord로 로그인'}</span>
          </button>
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-2 bg-white/5 border border-gray-600/50 text-gray-200 font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
              <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
              <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
              <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
            </svg>
            <span>{googleLoading ? '연동 중...' : 'Google로 로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 통합 인증 컴포넌트 ──────────────────────────────────────────────────────────
/**
 * ImprovedAuthForm 컴포넌트 (기본 내보내기)
 *
 * 이메일/비밀번호 로그인과 Discord 로그인 옵션이 한 화면에 표시되는 인증 컨테이너입니다.
 * 배경 그라디언트와 브랜드 헤더가 포함된 전체 화면 레이아웃을 제공합니다.
 *
 * @param {function} onSuccess - 인증 성공 시 호출되는 콜백. 인자로 user 객체를 전달합니다.
 * @returns {JSX.Element} 전체 화면 인증 UI
 */
export default function ImprovedAuthForm({ onSuccess }) {
  return (
    <div className="w-full max-w-5xl relative z-10">
      <div className="absolute -inset-2 rounded-[28px] bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.18)_0%,rgba(8,47,73,0.06)_40%,transparent_72%)] pointer-events-none" />

      <div className="relative overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#06060a]/85 shadow-[0_30px_80px_rgba(5,10,18,0.55)]">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <section className="hidden lg:flex flex-col justify-between p-8 border-r border-cyan-400/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.32)_0%,rgba(2,6,23,0.92)_65%)]">
            <div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none">
                BYCLAN <span className="text-yellow-500">NET</span>
              </h1>
              <p className="text-gray-400 text-xs mt-3 uppercase tracking-[0.2em] font-bold">
                스타크래프트 빠른무한 클랜 관리 시스템
              </p>
            </div>

            <div className="space-y-2 text-xs text-cyan-100/80">
              <p>• 래더 운영, 전적, 포인트를 한 번에 관리</p>
              <p>• 모바일/데스크톱 모두 동일한 인증 경험</p>
              <p>• 로그인 후 개인화된 프로필 데이터 자동 연결</p>
            </div>
          </section>

          <section className="p-4 sm:p-6 lg:p-8">
            <div className="mb-5 text-center lg:hidden">
              <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tight">
                BYCLAN <span className="text-yellow-500">NET</span>
              </h1>
              <p className="text-gray-500 text-[11px] mt-2 uppercase tracking-[0.18em] font-bold">
                스타크래프트 빠른무한 클랜 관리 시스템
              </p>
            </div>

            <EmailLoginForm onSuccess={onSuccess} />
          </section>
        </div>
      </div>
    </div>
  );
}
