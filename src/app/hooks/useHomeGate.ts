// 파일명: src/app/hooks/useHomeGate.ts
import { useState, useSyncExternalStore } from 'react';

// ─── HomeGate external store (전역 상태 관리) ─────────────────────────────
// SSR(서버 사이드 렌더링) 환경에서 에러가 나지 않도록 클라이언트/서버 스냅샷을 분리합니다.

let _homeGateAuthorized = false;
let _homeGateInitialized = false;
const _homeGateListeners = new Set<() => void>();

function _subscribeHomeGate(listener: () => void): () => void {
  _homeGateListeners.add(listener);
  return () => { _homeGateListeners.delete(listener); };
}

function _getHomeGateSnapshot(): boolean {
  if (typeof window === 'undefined') return false; // 안전장치
  if (!_homeGateInitialized) {
    _homeGateInitialized = true;
    _homeGateAuthorized = window.sessionStorage.getItem('byclan_home_gate') === 'authorized';
    if (!_homeGateAuthorized) {
      window.localStorage.removeItem('byclan_home_gate');
    }
  }
  return _homeGateAuthorized;
}

function _getHomeGateServerSnapshot(): boolean {
  return false; // 서버에서는 무조건 닫혀있음
}

function _updateHomeGateStore(value: boolean): void {
  _homeGateAuthorized = value;
  _homeGateInitialized = true;
  _homeGateListeners.forEach(l => l());
}

const _noopSubscribe = () => () => {};

// 💡 핵심: Auth 훅이나 외부에서 "로그인했으니 프리패스로 통과시켜!" 할 때 쓰는 유틸 함수
export const ensureHomeGateAuthorized = () => {
  if (typeof window === 'undefined') return;
  if (window.sessionStorage.getItem('byclan_home_gate') !== 'authorized') {
    window.sessionStorage.setItem('byclan_home_gate', 'authorized');
    _updateHomeGateStore(true);
  }
};

// ─── 메인 커스텀 훅 ────────────────────────────────────────────────────────
export function useHomeGate() {
  const [password, setPassword] = useState('');

  const isAuthorized = useSyncExternalStore(
    _subscribeHomeGate,
    _getHomeGateSnapshot,
    _getHomeGateServerSnapshot,
  );

  const homeGateReady = useSyncExternalStore(
    _noopSubscribe,
    () => true,
    () => false,
  );

  const setIsAuthorized = (value: boolean) => {
    _updateHomeGateStore(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.sessionStorage.setItem('byclan_home_gate', 'authorized');
        window.localStorage.removeItem('byclan_home_gate');
      } else {
        window.sessionStorage.removeItem('byclan_home_gate');
        window.localStorage.removeItem('byclan_home_gate');
      }
    }
  };

  return {
    password,
    setPassword,
    isAuthorized,
    homeGateReady,
    setIsAuthorized,
  };
}