/**
 * @file ToastContainer.js
 *
 * @역할
 *   화면 오른쪽 하단에 잠깐 나타났다 사라지는 알림(토스트, Toast) 메시지를
 *   관리하고 렌더링하는 컴포넌트 모음입니다.
 *
 * @주요기능
 *   - toastStyles(): 토스트 종류(success/warning/error/info)에 따라 색상 클래스 반환
 *   - toastIcon(): 토스트 종류에 맞는 아이콘 문자 반환
 *   - ToastItem: 개별 토스트 하나를 렌더링 (페이드인·페이드아웃 애니메이션, 진행바 포함)
 *   - ToastContainer: 활성 토스트 목록 전체를 화면에 표시하는 루트 컴포넌트
 *
 * @관련컴포넌트
 *   - ToastContext (../context/ToastContext): 토스트 목록·추가·제거 상태 관리
 *   - 루트 layout.js에 한 번만 마운트하면 앱 전체에서 토스트 사용 가능
 *
 * @사용방법
 *   // layout.js 등 최상위 레이아웃에 한 번만 추가:
 *   <ToastContainer />
 *
 *   // 토스트 띄우기 (어느 컴포넌트에서든):
 *   const { addToast } = useToast();
 *   addToast({ type: 'success', message: '저장 완료!', duration: 3000 });
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * 토스트 종류(type)에 따라 배경·테두리·텍스트 색상 Tailwind 클래스를 반환합니다.
 * @param {'success'|'warning'|'error'|'info'} type - 토스트 종류
 * @returns {string} Tailwind CSS 클래스 문자열
 */
/** @param {{ type: import('../context/ToastContext').ToastType }} props */
function toastStyles(type) {
  switch (type) {
    case 'success':
      return 'bg-emerald-900/90 border-emerald-600/60 text-emerald-200';
    case 'warning':
      return 'bg-amber-900/90 border-amber-600/60 text-amber-200';
    case 'error':
      return 'bg-red-900/90 border-red-600/60 text-red-200';
    case 'info':
    default:
      return 'bg-blue-900/90 border-blue-600/60 text-blue-200';
  }
}

/**
 * 토스트 종류(type)에 따라 아이콘 문자를 반환합니다.
 * @param {'success'|'warning'|'error'|'info'} type - 토스트 종류
 * @returns {string} 아이콘 문자 (예: '✓', '⚠', '✕', 'ℹ')
 */
function toastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'warning': return '⚠';
    case 'error':   return '✕';
    case 'info':
    default:        return 'ℹ';
  }
}

/**
 * 개별 토스트 하나를 렌더링하는 컴포넌트입니다.
 * 마운트 시 페이드인, duration 경과 시 페이드아웃 후 자동 제거됩니다.
 * 하단에는 남은 시간을 나타내는 진행바(progress bar)가 표시됩니다.
 *
 * @param {{ toast: import('../context/ToastContext').Toast, onRemove: (id: string) => void }} props
 * @param {object} props.toast - 표시할 토스트 객체 (id, type, message, duration 포함)
 * @param {function} props.onRemove - 토스트를 목록에서 제거하는 콜백 함수
 */
function ToastItem({ toast, onRemove }) {
  /** 토스트의 표시 여부 (true: 보임/페이드인, false: 숨김/페이드아웃) */
  const [visible, setVisible] = useState(false);
  /** 자동 사라짐 타이머 ID를 저장하는 ref (컴포넌트 언마운트 시 정리용) */
  const timerRef = useRef(null);

  /**
   * 컴포넌트 마운트 직후 실행됩니다.
   * requestAnimationFrame을 사용해 다음 프레임에 visible=true로 설정하여
   * CSS 트랜지션 기반의 페이드인 애니메이션이 올바르게 작동하도록 합니다.
   */
  // Fade-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /**
   * 닫기(×) 버튼 클릭 핸들러입니다.
   * 즉시 visible=false로 페이드아웃을 시작하고, 300ms 후 실제로 목록에서 제거합니다.
   * (300ms는 CSS 트랜지션 duration과 맞춰 애니메이션이 끝난 뒤 제거되도록 하기 위함)
   */
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  /**
   * toast.duration이 변경될 때마다 실행됩니다.
   * duration > 0이면, 자동 사라짐 300ms 전에 미리 visible=false를 설정해
   * 페이드아웃 애니메이션이 자연스럽게 재생된 뒤 onRemove가 호출되도록 합니다.
   * 컴포넌트 언마운트 시 타이머를 정리합니다.
   */
  // Allow external removal to trigger fade-out
  useEffect(() => {
    if (toast.duration > 0) {
      // Warn 300 ms before auto-removal so the fade-out animation fires
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, toast.duration - 300);
    }
    return () => clearTimeout(timerRef.current);
  }, [toast.duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg
        transition-all duration-300 ease-in-out max-w-sm w-full
        ${toastStyles(toast.type)}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <span className="text-base leading-none mt-0.5 shrink-0 font-bold">
        {toastIcon(toast.type)}
      </span>
      <p className="text-sm flex-1 leading-snug break-words">{toast.message}</p>
      <button
        onClick={handleClose}
        aria-label="닫기"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity leading-none text-base"
      >
        ×
      </button>
      {toast.duration > 0 && (
        <span
          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-current opacity-40"
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Renders all active toasts in the bottom-right corner of the viewport.
 * Mount once in the root layout.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
        aria-label="알림"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto relative overflow-hidden rounded-lg">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}
