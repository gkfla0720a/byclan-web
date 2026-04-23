/**
 * @file HomeGate.js
 *
 * @역할
 *   홈페이지 최초 진입 시 비밀번호 인증을 처리하는 게이트(관문) 컴포넌트입니다.
 *   개발자 옵션에서 홈게이트를 on/off로 토글할 수 있습니다.
 *   - homeGateEnabled=true: 모든 사용자에게 비밀번호 인증 요구 (개발/점검 모드)
 *   - homeGateEnabled=false: 비밀번호 인증 건너뜀 (정상 운영)
 *
 * @주요기능
 *   - 개발자 설정 확인 → homeGateEnabled 값으로 게이트 활성화 여부 결정
 *   - 인증 준비 전(homeGateReady=false): 로딩 화면 표시
 *   - 미인증(isAuthorized=false): 비밀번호 입력 폼 표시
 *   - 인증 완료(isAuthorized=true): 자식 컴포넌트(children)를 그대로 렌더링
 *
 * @관련컴포넌트
 *   - AuthContext (../context/AuthContext): 인증 상태·비밀번호 관리
 *   - DevSettingsPanel (./DevSettingsPanel): 홈게이트 on/off 토글
 *   - 루트 layout.js 또는 최상위 페이지에서 감싸서 사용
 *
 * @사용방법
 *   <HomeGate>
 *     <App />  ← 인증 후 보여줄 컴포넌트를 자식으로 전달
 *   </HomeGate>
 */
'use client';

import React, { useSyncExternalStore } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { loadDevSettings, DEV_SETTINGS } from '../utils/permissions';

// ─── Dev Settings 외부 스토어 ─────────────────────────────────────────────
// HomeGate에서 현재 개발자 설정을 읽을 수 있도록 합니다.
let _devSettingsValue = DEV_SETTINGS;
let _devSettingsInitialized = false;
const _devSettingsListeners = new Set();

function _subscribeToDevSettings(listener) {
  _devSettingsListeners.add(listener);
  return () => _devSettingsListeners.delete(listener);
}

function _getDevSettingsSnapshot() {
  if (!_devSettingsInitialized) {
    _devSettingsInitialized = true;
    _devSettingsValue = loadDevSettings();
  }
  return _devSettingsValue;
}

function _getDevSettingsServerSnapshot() {
  return DEV_SETTINGS;
}

/**
 * HomeGate 컴포넌트
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

  // 개발자 설정에서 홈게이트 활성화 상태 읽음
  const devSettings = useSyncExternalStore(
    _subscribeToDevSettings,
    _getDevSettingsSnapshot,
    _getDevSettingsServerSnapshot,
  );
  
  const homeGateEnabled = devSettings.homeGateEnabled;

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

  // 홈게이트가 비활성화되면 자식 컴포넌트를 바로 렌더링
  if (!homeGateEnabled) {
    return children;
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
            ByClan 임시 점검 중
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            현재 사이트 정비 및 개선 작업 중입니다.<br />
            보안 비밀번호를 입력하여 진행해주세요.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
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
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
