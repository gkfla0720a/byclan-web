'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';

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
 * Single toast item with progress bar.
 * @param {{ toast: import('../context/ToastContext').Toast; onRemove: (id: string) => void }} props
 */
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  // Fade-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

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
