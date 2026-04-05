'use client';

import React from 'react';
import { useAuthContext } from '../context/AuthContext';

export default function HomeGate({ children }) {
  const {
    password,
    setPassword,
    isAuthorized,
    homeGateReady,
    setIsAuthorized,
  } = useAuthContext();

  if (!homeGateReady) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8 text-center">
          <div className="text-gray-500 text-sm">ByClan 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (password === '1990') {
        setIsAuthorized(true);
        setPassword('');
        return;
      }
      alert('초기 접속 비밀번호가 올바르지 않습니다.');
      setPassword('');
    };

    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h1
            className="text-2xl font-black text-cyan-400 mb-3"
            style={{ textShadow: '0 0 12px rgba(0,212,255,0.35)' }}
          >
            ByClan 초기 접속 인증
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            홈페이지 최초 진입 시 보안 비밀번호가 필요합니다.<br />
            인증 후에는 로그인 없이도 홈, 개요, 가입 안내를 둘러볼 수 있습니다.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="초기 비밀번호 입력"
              className="w-full rounded-xl border border-cyan-500/30 bg-[#0d0d14] px-4 py-3 text-center text-white outline-none focus:border-cyan-400"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-xl py-3 font-black btn-neon text-sm"
            >
              ENTER BYCLAN
            </button>
          </form>
          <p className="mt-4 text-[11px] text-gray-600">
            인증 후 방문자 권한으로 둘러보기만 가능하며, 래더 시스템은 별도 권한이 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
