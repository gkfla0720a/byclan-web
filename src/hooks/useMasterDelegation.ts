// 파일명: src/hooks/useMasterDelegation.ts
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/supabase';
import { hasPermission } from '@/types/permissions';
import { delegateMaster } from '@/services/memberService';
import type { UserRole } from '@/types';

interface Manager {
  id: string;
  role: UserRole | null;
  email: string;
  authEmail: string;
  phone: string;
}

interface VerificationState {
  method: 'password' | 'email';
  password: string;
  otp: string;
  email: string;
  phone: string;
  otpSent: boolean;
  verifiedAt: number | null;
  verifiedMethod: string;
  sendingOtp: boolean;
  verifying: boolean;
  error: string;
  success: string;
}

const DELEGATION_VERIFY_WINDOW_MS = 5 * 60 * 1000;

const createVerificationState = (email = '', phone = ''): VerificationState => ({
  method: 'password',
  password: '',
  otp: '',
  email,
  phone,
  otpSent: false,
  verifiedAt: null,
  verifiedMethod: '',
  sendingOtp: false,
  verifying: false,
  error: '',
  success: '',
});

export function useMasterDelegation(
  currentManager: Manager, 
  members: any[], 
  onDelegateSuccess: () => Promise<void>
) {
  const [masterDelegation, setMasterDelegation] = useState<{ isOpen: boolean; member: any | null }>({ isOpen: false, member: null });
  const [delegationVerification, setDelegationVerification] = useState<VerificationState>(
    createVerificationState(currentManager.email, currentManager.phone)
  );

  const canDelegateMaster = hasPermission(currentManager.role || 'guest', 'master.delegate');

  const isDelegationVerified = Boolean(
    delegationVerification.verifiedAt &&
    Date.now() - delegationVerification.verifiedAt <= DELEGATION_VERIFY_WINDOW_MS
  );

  const openDelegationModal = useCallback((member: any) => {
    setMasterDelegation({ isOpen: true, member });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  }, [currentManager.email, currentManager.phone]);

  const closeDelegationModal = useCallback(() => {
    setMasterDelegation({ isOpen: false, member: null });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  }, [currentManager.email, currentManager.phone]);

  const handlePasswordVerification = useCallback(async () => {
    if (!delegationVerification.password) {
      setDelegationVerification(prev => ({ ...prev, error: '비밀번호를 입력하세요.', success: '' }));
      return;
    }

    try {
      setDelegationVerification(prev => ({ ...prev, verifying: true }));
      const credentials = currentManager.authEmail
        ? { email: currentManager.authEmail, password: delegationVerification.password }
        : { phone: currentManager.phone, password: delegationVerification.password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (data.user?.id !== currentManager.id) throw new Error('계정이 일치하지 않습니다.');

      setDelegationVerification(prev => ({
        ...prev,
        password: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'password',
        verifying: false,
        error: '',
        success: '재인증 완료되었습니다.',
      }));
    } catch (err: any) {
      setDelegationVerification(prev => ({
        ...prev,
        verifying: false,
        error: err.message || '인증 실패',
      }));
    }
  }, [delegationVerification.password, currentManager]);

  // handleSendOtp, handleVerifyOtp 등도 위와 같은 방식(prev => ({...prev}))으로 수정 가능합니다.
  
  // ... (나머지 로직도 동일한 타입 패턴 적용)

  return {
    masterDelegation,
    delegationVerification,
    isDelegationVerified,
    canDelegateMaster,
    openDelegationModal,
    closeDelegationModal,
    handlePasswordVerification,
    // ...
    setDelegationVerification,
  };
}