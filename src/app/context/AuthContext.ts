'use client';

import React, { createContext, useContext } from 'react';
import { useAuth, UseAuthReturn } from '../hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
