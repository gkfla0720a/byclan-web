// 파일명: src/stores/useAuthStore.ts

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { AuthProfile } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthStoreState {
  user: User | null;
  profile: AuthProfile | null; // models.ts에서 정의한 AuthProfile 사용
  status: AuthStatus;
  authError: string | null;
  setAuthSnapshot: (snapshot: {
    user: User | null;
    profile: AuthProfile | null;
    authLoading: boolean;
    authError: string | null;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  profile: null,
  status: 'loading',
  authError: null,
  setAuthSnapshot: ({ user, profile, authLoading, authError }) => {
    set({
      user,
      profile,
      status: authLoading ? 'loading' : user ? 'authenticated' : 'anonymous',
      authError,
    });
  },
  clearAuth: () => {
    set({ user: null, profile: null, status: 'anonymous', authError: null });
  },
}));
