'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';
import { ErrorMessage, SkeletonLoader } from './UIStates';

// 이메일 로그인 컴포넌트
function EmailLoginForm({ onSuccess, onSwitchToDiscord }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              by_id: `By_${Date.now()}`, // 임시 클랜 ID
              role: 'associate' // 기본 역할
            }
          }
        });

        if (error) throw error;
        
        // 프로필 생성
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              discord_name: email.split('@')[0], // 임시 이름
              ByID: `By_${Date.now()}`,
              role: 'associate',
              points: 1000,
              race: 'Terran',
              intro: '새로운 클랜원입니다.'
            });

          if (profileError) throw profileError;
        }

        alert('회원가입 완료! 이메일을 확인해주세요.');
        setIsSignUp(false);
      } else {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        onSuccess(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isSignUp ? '클랜 가입' : '로그인'}
      </h2>
      
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <SkeletonLoader count={1} />
          ) : (
            isSignUp ? '가입하기' : '로그인'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-yellow-500 hover:text-yellow-400 text-sm"
        >
          {isSignUp ? '이미 계정이 있으신가요?' : '새로 가입하시겠어요?'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-center text-gray-400 text-sm mb-3">또는</div>
        <button
          onClick={onSwitchToDiscord}
          className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
        >
          <span>🎮</span>
          <span>Discord로 계속하기</span>
        </button>
      </div>
    </div>
  );
}

// Discord 로그인 컴포넌트
function DiscordLoginForm({ onSuccess, onSwitchToEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiscordLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Discord 로그인
      </h2>
      
      {error && <ErrorMessage message={error} />}

      <div className="space-y-4">
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>🎮</span>
          <span>{loading ? '연동 중...' : 'Discord로 로그인'}</span>
        </button>

        <div className="text-center">
          <button
            onClick={onSwitchToEmail}
            className="text-yellow-500 hover:text-yellow-400 text-sm"
          >
            이메일로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

// 통합 로그인 컴포넌트
export default function AuthForm({ onSuccess }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'discord'

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white italic tracking-tighter">
          BYCLAN <span className="text-yellow-500">NET</span>
        </h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">
          스타크래프트 빠른무한 클랜 관리 시스템
        </p>
      </div>

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
  );
}
