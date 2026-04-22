/**
 * @file HomeGate.js
 *
 * @역할
 *   홈페이지 최초 진입 시 비밀번호 인증을 처리하는 게이트(관문) 컴포넌트입니다.
 *   올바른 비밀번호를 입력해야 사이트 내용을 볼 수 있도록 막아주는 역할을 합니다.
 *   
 *   NEXT_PUBLIC_HOME_GATE_ENABLED 환경변수로 게이트 활성화 여부 제어 가능합니다.
 *   (비활성화 시 자식 컴포넌트를 바로 렌더링, 향후 대문 제거 시 용이)
 *
 * @주요기능
 *   - 환경변수 확인 (HOME_GATE_ENABLED)
 *   - 초기 인증 여부(homeGateReady) 확인 → 로딩 화면 표시
 *   - 비밀번호 미인증 상태 → 비밀번호 입력 폼 표시
 *   - 인증 완료 → 자식 컴포넌트(children)를 그대로 렌더링
 *
 * @관련컴포넌트
 *   - AuthContext (../context/AuthContext): 인증 상태·비밀번호 관리
 *   - 루트 layout.js 또는 최상위 페이지에서 감싸서 사용
 *
 * @사용방법
 *   <HomeGate>
 *     <App />  ← 인증 후 보여줄 컴포넌트를 자식으로 전달
 *   </HomeGate>
 * 
 * @환경변수
 *   NEXT_PUBLIC_HOME_GATE_ENABLED: "true" | "false" 
 *     - true: HomeGate 활성화 (임시 대문 사용)
 *     - false: HomeGate 비활성화 (서버 배포 후 대문 제거 시 사용)
 */
'use client';

import React from 'react';
import { useAuthContext } from '../context/AuthContext';

/**
 * HomeGate 컴포넌트
 *
 * 사이트 최초 진입 시 비밀번호 인증을 요구하는 게이트(관문) 컴포넌트입니다.
 * NEXT_PUBLIC_HOME_GATE_ENABLED 환경변수가 false면 인증 없이 바로 자식을 렌더링합니다.
 * 
 * - 비활성화(false): 자식 컴포넌트를 바로 렌더링 (대문 없음)
 * - 활성화(true) & 인증 준비 전(homeGateReady=false): 로딩 화면 표시
 * - 활성화(true) & 미인증(isAuthorized=false): 비밀번호 입력 폼 표시
 * - 활성화(true) & 인증 완료(isAuthorized=true): 자식 컴포넌트를 그대로 렌더링
 *
 * @param {{ children: React.ReactNode }} props
 * @param {React.ReactNode} props.children - 인증 후 표시할 자식 컴포넌트
 * @returns {JSX.Element} 상황에 맞는 화면 (로딩 / 비밀번호 폼 / 자식 컴포넌트)
 */
export default function HomeGate({ children }) {
  const {
    /** 비밀번호 입력창의 현재 값 */
    password,
    /** 비밀번호 입력 값을 업데이트하는 함수 */
    setPassword,
    /** 현재 사용자가 인증되었는지 여부 (true: 인증 완료) */
    isAuthorized,
    /** AuthContext 초기화가 완료되었는지 여부 (true: 준비 완료) */
    homeGateReady,
    /** 인증 상태를 변경하는 함수 */
    setIsAuthorized,
  } = useAuthContext();

  // ====================================================================
  // HomeGate 활성화 여부 확인
  // ====================================================================
  const homeGateEnabled = process.env.NEXT_PUBLIC_HOME_GATE_ENABLED === 'true';
  
  // HomeGate가 비활성화되면 자식 컴포넌트를 바로 렌더링 (대문 없음)
  if (!homeGateEnabled) {
    return children;
  }

  // ====================================================================
  // 아래부터는 HomeGate가 활성화된 경우의 로직
  // ====================================================================

  /** homeGateReady가 false이면 AuthContext가 아직 초기화 중이므로 로딩 화면을 표시합니다 */
  if (!homeGateReady) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8 text-center">
          <div className="text-gray-500 text-sm">ByClan 로딩 중...</div>
        </div>
      </div>
    );
  }

  /** 미인증 상태: 비밀번호 입력 폼을 표시합니다 */
  if (!isAuthorized) {
    /**
     * 비밀번호 폼 제출 핸들러
     * 입력값이 '1990'이면 인증을 허용하고, 그렇지 않으면 경고창을 띄웁니다.
     * @param {React.FormEvent<HTMLFormElement>} e - 폼 제출 이벤트
     */
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
