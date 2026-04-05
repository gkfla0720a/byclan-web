'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';
import { ErrorMessage, SkeletonLoader } from './UIStates';

// ── 유효성 검사 헬퍼 ─────────────────────────────────────────────────────────
function validateUserId(id) {
  if (!id) return '아이디를 입력하세요.';
  if (id.length < 3) return '아이디는 최소 3자 이상이어야 합니다.';
  if (id.length > 20) return '아이디는 최대 20자 이하이어야 합니다.';
  if (!/^[a-zA-Z]/.test(id)) return '아이디는 영문자로 시작해야 합니다.';
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(id)) return '아이디는 영문자와 숫자만 사용할 수 있습니다.';
  return null;
}

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
- 클랜 아이디(ByID): 서비스 내 식별자
- 디스코드 계정: 래더 시스템 참여 시 연동 (선택)
수집된 개인정보는 서비스 제공 목적으로만 이용되며 제3자에게 제공되지 않습니다.

제3조 (이용자의 의무)
이용자는 다음 행위를 금지합니다.
- 타인의 개인정보 무단 수집·이용
- 서비스를 이용한 불법 행위
- 클랜 활동에 방해가 되는 행위
- 허위 정보 기재

제4조 (서비스 이용)
가입 완료 시 '준회원' 등급으로 시작합니다.
래더 참여 및 정식 활동은 클랜 가입 절차를 완료한 이후 가능합니다.

제5조 (개인정보 보유 및 파기)
회원 탈퇴 시 관련 정보는 즉시 파기됩니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보존합니다.`;

// ── 이메일 로그인/가입 ────────────────────────────────────────────────────────
function EmailLoginForm({ onSuccess, onSwitchToDiscord }) {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

        const byID = `By_${userId}`;

        // 아이디 중복 확인
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('ByID', byID)
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
              by_id: byID,
              role: 'associate'
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
              discord_name: userId,
              ByID: byID,
              role: 'associate',
              points: 1000,
              race: 'Terran',
              intro: '새로운 클랜원입니다.',
              ladder_points: 1000
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
        <button
          onClick={onSwitchToDiscord}
          className="w-full py-2 bg-indigo-700/30 border border-indigo-600/40 text-indigo-300 font-medium rounded-lg hover:bg-indigo-700/50 transition-colors flex items-center justify-center gap-2"
        >
          <span>🎮</span>
          <span>Discord로 계속하기</span>
        </button>
      </div>
    </div>
  );
}

// ── Discord 로그인 ─────────────────────────────────────────────────────────────
function DiscordLoginForm({ onSuccess, onSwitchToEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiscordLogin = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-8 rounded-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Discord 로그인</h2>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-4">
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full py-3 bg-indigo-700/30 border border-indigo-600/40 text-indigo-300 font-bold rounded-lg hover:bg-indigo-700/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>🎮</span>
          <span>{loading ? '연동 중...' : 'Discord로 로그인'}</span>
        </button>

        <div className="text-center">
          <button
            onClick={onSwitchToEmail}
            className="text-cyan-500 hover:text-cyan-400 text-sm"
          >
            이메일로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 통합 인증 컴포넌트 ──────────────────────────────────────────────────────────
export default function ImprovedAuthForm({ onSuccess }) {
  const [loginMethod, setLoginMethod] = useState('email');

  return (
    <div className="min-h-screen bg-[#06060a] flex flex-col justify-center items-center p-4 relative z-10">
      {/* 배경 그리드 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="mb-10 text-center relative z-10">
        <h1 className="text-5xl font-black text-white italic tracking-tighter">
          BYCLAN <span className="text-yellow-500">NET</span>
        </h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">
          스타크래프트 빠른무한 클랜 관리 시스템
        </p>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {loginMethod === 'email' ? (
          <EmailLoginForm
            onSuccess={onSuccess}
            onSwitchToDiscord={() => setLoginMethod('discord')}
          />
        ) : (
          <DiscordLoginForm
            onSuccess={onSuccess}
            onSwitchToEmail={() => setLoginMethod('email')}
          />
        )}
      </div>
    </div>
  );
}
