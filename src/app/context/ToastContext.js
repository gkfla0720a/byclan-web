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

const DEFAULT_DURATION = 4000;

/** @param {ToastState} state @param {ToastAction} action @returns {ToastState} */
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

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  /**
   * @param {ToastType} type
   * @param {string} message
   * @param {number} [duration]
   */
  const addToast = useCallback((type, message, duration = DEFAULT_DURATION) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: 'ADD', toast: { id, type, message, duration } });

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
