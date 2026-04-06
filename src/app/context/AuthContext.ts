/**
 * =====================================================================
 * 파일명: src/app/context/AuthContext.ts
 * 역할  : useAuth 훅의 결과값을 React Context로 앱 전체에 공유합니다.
 *         이 파일을 통해 어떤 컴포넌트에서든 로그인 상태와 프로필에 접근할 수 있습니다.
 *
 * ■ 구조
 *   AuthProvider : useAuth() 훅을 실행하고 결과를 Context에 제공하는 컴포넌트
 *   useAuthContext : Context 값을 꺼내 쓰는 커스텀 훅
 *
 * ■ 사용 방법
 *   1. 루트 레이아웃(layout.js)에서 <AuthProvider>로 앱을 감싼다 (이미 설정됨)
 *   2. 어떤 컴포넌트에서든 useAuthContext()로 인증 정보에 접근한다
 *
 *   import { useAuthContext } from '@/app/context/AuthContext';
 *
 *   function MyComponent() {
 *     const { profile, getPermissions, reloadProfile } = useAuthContext();
 *     const perms = getPermissions();
 *     if (perms.can.playLadder) {
 *       // 래더 플레이 가능한 경우
 *     }
 *   }
 *
 * ■ Context에 포함된 주요 값
 *   profile:         현재 로그인한 사용자의 프로필 (UserProfile 타입)
 *   user:            Supabase Auth 사용자 객체
 *   authLoading:     인증 로딩 중 여부
 *   getPermissions(): 권한 정보 반환 함수
 *   reloadProfile():  프로필 새로고침 함수
 *   → 전체 목록은 UseAuthReturn 타입 참고 (useAuth.ts)
 * =====================================================================
 */
'use client';

import React, { createContext, useContext } from 'react';
import { useAuth, UseAuthReturn } from '../hooks/useAuth';

/**
 * AuthContext
 * - useAuth() 훅의 반환값을 담는 React Context 객체입니다.
 * - 초기값은 null이며, AuthProvider가 실제 값을 주입합니다.
 * - 직접 사용하지 말고 useAuthContext() 훅을 통해 접근하세요.
 */
const AuthContext = createContext<UseAuthReturn | null>(null);

/**
 * AuthProvider({ children })
 * - useAuth() 훅을 실행하여 인증 상태를 관리하고, 하위 컴포넌트에 Context를 제공합니다.
 * - 앱의 루트 레이아웃(src/app/layout.js)에서 이 컴포넌트로 전체 앱을 감쌉니다.
 *
 * 매개변수:
 *   children: 이 Provider 안에 렌더링될 자식 컴포넌트들
 *
 * 사용 예시 (layout.js에서):
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

/**
 * useAuthContext()
 * - AuthContext에서 인증 정보를 꺼내는 커스텀 훅입니다.
 * - 반드시 AuthProvider 내부에서만 호출해야 합니다.
 * - AuthProvider 밖에서 호출하면 에러를 던집니다.
 *
 * 반환값: UseAuthReturn 타입의 객체 (profile, user, getPermissions 등)
 *
 * 사용 예시:
 *   const { profile, authLoading, getPermissions } = useAuthContext();
 */
export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
