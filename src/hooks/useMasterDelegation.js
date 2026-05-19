'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/supabase';
import { hasPermission } from '@/utils/permissions';
import { delegateMaster } from '@/services/memberService';

const DELEGATION_VERIFY_WINDOW_MS = 5 * 60 * 1000;

const createVerificationState = (email = '', phone = '') => ({
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

/**
 * 마스터 위임 모달 및 본인 재인증(비밀번호/이메일 OTP) 로직을 관리하는 훅입니다.
 *
 * @param {object} currentManager - 현재 관리자 정보 { id, role, email, authEmail, phone }
 * @param {Array} members - 현재 클랜원 목록 (현 마스터 탐색용)
 * @param {function} onDelegateSuccess - 위임 성공 후 목록 갱신 콜백
 * @returns {{
 *   masterDelegation: object,
 *   delegationVerification: object,
 *   isDelegationVerified: boolean,
 *   canDelegateMaster: boolean,
 *   openDelegationModal: function,
 *   closeDelegationModal: function,
 *   handlePasswordVerification: function,
 *   handleSendOtp: function,
 *   handleVerifyOtp: function,
 *   handleMasterDelegation: function,
 *   setDelegationVerification: function,
 * }}
 */
export function useMasterDelegation(currentManager, members, onDelegateSuccess) {
  const [masterDelegation, setMasterDelegation] = useState({ isOpen: false, member: null });
  const [delegationVerification, setDelegationVerification] = useState(createVerificationState());

  const canDelegateMaster = hasPermission(currentManager.role || 'visitor', 'master.delegate');

  const isDelegationVerified = Boolean(
    delegationVerification.verifiedAt &&
    Date.now() - delegationVerification.verifiedAt <= DELEGATION_VERIFY_WINDOW_MS
  );

  const openDelegationModal = useCallback((member) => {
    setMasterDelegation({ isOpen: true, member });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  }, [currentManager.email, currentManager.phone]);

  const closeDelegationModal = useCallback(() => {
    setMasterDelegation({ isOpen: false, member: null });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  }, [currentManager.email, currentManager.phone]);

  const handlePasswordVerification = useCallback(async () => {
    if (!delegationVerification.password) {
      setDelegationVerification(prev => ({ ...prev, error: '현재 계정 비밀번호를 입력하세요.', success: '' }));
      return;
    }

    const identifier = currentManager.authEmail || currentManager.phone;
    if (!identifier) {
      setDelegationVerification(prev => ({
        ...prev,
        error: '현재 계정에 이메일 또는 전화번호가 연결되어 있지 않아 비밀번호 재인증을 진행할 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification(prev => ({ ...prev, verifying: true, error: '', success: '' }));

      const credentials = currentManager.authEmail
        ? { email: currentManager.authEmail, password: delegationVerification.password }
        : { phone: currentManager.phone, password: delegationVerification.password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (data.user?.id !== currentManager.id) throw new Error('현재 로그인 계정과 일치하지 않는 인증 결과입니다.');

      setDelegationVerification(prev => ({
        ...prev,
        password: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'password',
        verifying: false,
        error: '',
        success: '비밀번호 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification(prev => ({
        ...prev,
        verifying: false,
        error: error.message || '비밀번호 재인증에 실패했습니다.',
        success: '',
      }));
    }
  }, [delegationVerification.password, currentManager]);

  const handleSendOtp = useCallback(async () => {
    if (!currentManager.email) {
      setDelegationVerification(prev => ({
        ...prev,
        error: '현재 계정에 이메일이 연결되어 있지 않아 이메일 인증을 보낼 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification(prev => ({ ...prev, sendingOtp: true, error: '', success: '' }));
      const { error } = await supabase.auth.signInWithOtp({
        email: currentManager.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setDelegationVerification(prev => ({
        ...prev,
        otpSent: true,
        sendingOtp: false,
        error: '',
        success: '인증 코드를 현재 계정 이메일로 전송했습니다. 메일에 도착한 코드를 입력해 확인하세요.',
      }));
    } catch (error) {
      setDelegationVerification(prev => ({
        ...prev,
        sendingOtp: false,
        error: error.message || '이메일 인증 코드 전송에 실패했습니다.',
        success: '',
      }));
    }
  }, [currentManager.email]);

  const handleVerifyOtp = useCallback(async () => {
    if (!delegationVerification.otp) {
      setDelegationVerification(prev => ({ ...prev, error: '이메일로 받은 인증 코드를 입력하세요.', success: '' }));
      return;
    }

    try {
      setDelegationVerification(prev => ({ ...prev, verifying: true, error: '', success: '' }));
      const { data, error } = await supabase.auth.verifyOtp({
        email: currentManager.email,
        token: delegationVerification.otp,
        type: 'email',
      });
      if (error) throw error;
      if (data.user?.id !== currentManager.id) throw new Error('현재 로그인 계정과 일치하지 않는 이메일 인증 결과입니다.');

      setDelegationVerification(prev => ({
        ...prev,
        otp: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'email',
        verifying: false,
        error: '',
        success: '이메일 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification(prev => ({
        ...prev,
        verifying: false,
        error: error.message || '이메일 인증 확인에 실패했습니다.',
        success: '',
      }));
    }
  }, [delegationVerification.otp, currentManager]);

  const handleMasterDelegation = useCallback(async (targetId) => {
    if (!canDelegateMaster) {
      alert('현재 계정에는 마스터 위임 권한이 없습니다.');
      return;
    }
    if (!isDelegationVerified) {
      alert('마스터 위임 전 본인 재인증을 완료해야 합니다.');
      return;
    }

    try {
      const currentMaster = members.find(m => m.role === 'master');
      await delegateMaster(currentMaster?.id ?? null, targetId);
      await onDelegateSuccess();
      closeDelegationModal();
      alert('마스터 위임이 완료되었습니다.');
    } catch (error) {
      alert('마스터 위임 실패: ' + error.message);
    }
  }, [canDelegateMaster, isDelegationVerified, members, onDelegateSuccess, closeDelegationModal]);

  return {
    masterDelegation,
    delegationVerification,
    isDelegationVerified,
    canDelegateMaster,
    openDelegationModal,
    closeDelegationModal,
    handlePasswordVerification,
    handleSendOtp,
    handleVerifyOtp,
    handleMasterDelegation,
    setDelegationVerification,
  };
}
