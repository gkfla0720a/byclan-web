/**
 * =====================================================================
 * 파일명: src/app/context/ToastContext.js
 * 역할  : 화면 상단/하단에 잠깐 나타났다 사라지는 알림 메시지(Toast)를
 *         관리하는 Context를 제공합니다.
 *
 * ■ Toast란?
 *   사용자 행동 결과를 잠시 알려주는 팝업 메시지입니다.
 *   예) "저장되었습니다 ✓", "오류가 발생했습니다 ✗"
 *
 * ■ Toast 유형 (type)
 *   success: 초록색 성공 알림
 *   warning: 노란색 경고 알림
 *   error:   빨간색 오류 알림
 *   info:    파란색 정보 알림
 *
 * ■ 구조
 *   ToastProvider: Toast 상태를 관리하고 Context를 제공하는 컴포넌트
 *   useToast:      Toast를 표시하는 함수들을 꺼내는 훅
 *   toastReducer:  Toast 목록을 추가/제거하는 상태 관리 함수
 *
 * ■ 사용 방법 (컴포넌트에서)
 *   import { useToast } from '@/app/context/ToastContext';
 *
 *   function MyComponent() {
 *     const toast = useToast();
 *     const handleSave = () => {
 *       toast.success('저장되었습니다!');      // 4초 후 자동 삭제
 *       toast.error('저장 실패!', 0);         // 0 = 사라지지 않음 (persistent)
 *       toast.warning('주의하세요', 8000);    // 8초 후 삭제
 *     };
 *   }
 * =====================================================================
 */
'use client';

import React, { createContext, useCallback, useContext, useReducer } from 'react';

/** @typedef {'success'|'warning'|'error'|'info'} ToastType */

/**
 * @typedef {Object} Toast
 * @property {string} id
 * @property {ToastType} type
 * @property {string} message
 * @property {number} duration  milliseconds; 0 = persistent
 */

/** @typedef {{ toasts: Toast[] }} ToastState */
/** @typedef {{ type: 'ADD'; toast: Toast } | { type: 'REMOVE'; id: string }} ToastAction */

/**
 * DEFAULT_DURATION
 * - Toast 메시지의 기본 표시 시간(밀리초)입니다.
 * - 4000ms = 4초 후 자동으로 사라집니다.
 * - duration=0으로 설정하면 사라지지 않습니다 (persistent).
 */
const DEFAULT_DURATION = 4000;

/**
 * toastReducer(state, action)
 * - Toast 목록의 상태를 관리하는 리듀서 함수입니다.
 * - useReducer와 함께 사용됩니다.
 *
 * 처리하는 액션:
 *   ADD:    새 Toast를 목록에 추가 (action.toast 포함)
 *   REMOVE: ID에 해당하는 Toast를 목록에서 제거 (action.id 포함)
 *
 * 매개변수:
 *   state:  현재 상태 { toasts: Toast[] }
 *   action: { type: 'ADD', toast } 또는 { type: 'REMOVE', id }
 *
 * 반환값: 새로운 상태 객체
 *
 * @param {ToastState} state @param {ToastAction} action @returns {ToastState}
 */
function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { toasts: [...state.toasts, action.toast] };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

/**
 * ToastContext
 * - Toast 상태와 조작 함수들을 담는 React Context입니다.
 * - 직접 사용하지 말고 useToast() 훅을 통해 접근하세요.
 */
const ToastContext = createContext(null);

/**
 * ToastProvider({ children })
 * - Toast 시스템 전체를 관리하는 Provider 컴포넌트입니다.
 * - 앱의 루트(layout.js)에서 전체 앱을 감쌉니다.
 *
 * 매개변수:
 *   children: 하위 컴포넌트들
 */
export function ToastProvider({ children }) {
  // state: 현재 화면에 표시 중인 Toast 목록 { toasts: [...] }
  // dispatch: 상태 변경을 요청하는 함수 (ADD/REMOVE 액션)
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  /**
   * removeToast(id)
   * - 특정 ID의 Toast를 즉시 제거합니다.
   * - 사용자가 Toast를 직접 닫을 때 호출됩니다.
   *
   * 매개변수:
   *   id: 제거할 Toast의 고유 ID 문자열
   */
  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  /**
   * addToast(type, message, duration)
   * - 새로운 Toast를 화면에 추가합니다.
   * - duration > 0이면 해당 시간 후 자동으로 제거됩니다.
   * - 내부 함수이며, 외부에서는 success/warning/error/info를 사용하세요.
   *
   * 매개변수:
   *   type:     Toast 유형 ('success' | 'warning' | 'error' | 'info')
   *   message:  표시할 메시지 문자열
   *   duration: 표시 시간(ms), 0이면 수동으로 닫아야 함 (기본: 4000ms)
   *
   * 반환값: 생성된 Toast의 고유 ID 문자열
   *
   * @param {ToastType} type
   * @param {string} message
   * @param {number} [duration]
   */
  const addToast = useCallback((type, message, duration = DEFAULT_DURATION) => {
    // 고유 ID 생성: 'toast-' + 현재 시간 + 랜덤 문자열
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: 'ADD', toast: { id, type, message, duration } });

    // duration > 0이면 지정된 시간 후 자동으로 Toast 제거
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
    }

    return id;
  }, []);

  const value = {
    toasts: state.toasts,
    /** @param {string} message @param {number} [duration] */
    success: (message, duration) => addToast('success', message, duration),
    /** @param {string} message @param {number} [duration] */
    warning: (message, duration) => addToast('warning', message, duration),
    /** @param {string} message @param {number} [duration] */
    error: (message, duration) => addToast('error', message, duration),
    /** @param {string} message @param {number} [duration] */
    info: (message, duration) => addToast('info', message, duration),
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Access the Toast API from any component inside ToastProvider.
 * @returns {{ toasts: Toast[], success: Function, warning: Function, error: Function, info: Function, removeToast: Function }}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
