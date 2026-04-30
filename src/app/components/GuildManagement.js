/**
 * @file GuildManagement.js
 * @역할 길드원(클랜원) 관리 페이지 컴포넌트
 * @주요기능
 *   - 길드원 목록 조회 및 등급 변경 (applicant/rookie/member/elite/admin)
 *   - 길드원 제명 처리 (role을 'expelled'로 변경)
 *   - 마스터 위임 기능: 비밀번호 재인증 또는 이메일 OTP 인증 후 위임 가능
 *   - 테스트 계정 필터링 지원 (profile_meta 조인 후 클라이언트 측 필터링)
 *   - 역할별 색상/아이콘 표시 (ROLE_PERMISSIONS 기반)
 * @사용방법
 *   member.manage 권한을 가진 운영진만 접근할 수 있습니다.
 *   마스터 위임은 추가적으로 master.delegate 권한과 본인 재인증이 필요합니다.
 * @관련컴포넌트 AdminBoard.js (기밀 게시판), ApplicationList.js (가입 심사)
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { isInternalAuthEmail } from '@/app/utils/accountId';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';
import { grantRankPromotionBonus } from '../utils/pointSystem';
import { isCurrentViewerTestAccount, isMarkedTestAccount } from '@/app/utils/testData';

/** 마스터 위임 재인증의 유효 시간: 5분 (밀리초 단위) */
const DELEGATION_VERIFY_WINDOW_MS = 5 * 60 * 1000;

/**
 * 마스터 위임 재인증 상태 초기값을 생성합니다.
 * @param {string} email - 현재 관리자의 이메일
 * @param {string} phone - 현재 관리자의 전화번호
 * @returns {object} 초기화된 재인증 상태 객체
 */
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

// 사이버틱 길드원 관리 컴포넌트
/**
 * GuildManagement 컴포넌트
 * 길드원 목록을 관리하고 등급 변경/제명/마스터 위임 기능을 제공합니다.
 */
export default function GuildManagement() {
  /** 길드원 목록 (visitor, expelled 제외) */
  const [members, setMembers] = useState([]);
  /** 데이터를 불러오는 중인지 여부 */
  const [loading, setLoading] = useState(true);
  /** 현재 로그인한 관리자 정보 (id, role, 공개 이메일, 내부 인증 이메일, phone) */
  const [currentManager, setCurrentManager] = useState({ id: null, role: null, email: '', authEmail: '', phone: '' });
  /**
   * 등급 변경 또는 제명 모달 상태
   * - isOpen: 모달 열림 여부
   * - action: 'role'(등급 변경) 또는 'remove'(제명)
   * - member: 처리 대상 길드원 객체
   */
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', member: null });
  /**
   * 마스터 위임 모달 상태
   * - isOpen: 모달 열림 여부
   * - member: 위임 대상 길드원 객체
   */
  const [masterDelegation, setMasterDelegation] = useState({ isOpen: false, member: null });
  /** 등급 변경 모달에서 선택 중인 새 역할값 */
  const [pendingRole, setPendingRole] = useState('member');
  /** 마스터 위임 전 본인 재인증 상태 (비밀번호/OTP 방식 모두 포함) */
  const [delegationVerification, setDelegationVerification] = useState(createVerificationState());

  /**
   * 수습 기간(2주)이 경과했지만 아직 운영진에게 검토 알림이 발송되지 않은
   * 신입 길드원(rookie)을 찾아 admin 이상 전체에게 알림을 보냅니다.
   * 중복 발송을 막기 위해 알림 제목에 rookie ID를 포함하여 존재 여부를 확인합니다.
   * @async
   * @param {string} currentUserId - 현재 로그인한 관리자 ID
   */
  const checkRookieReviewNotifications = async (currentUserId) => {
    try {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // 2주 이상 된 rookie 목록 조회
      const { data: rookies } = await supabase
        .from('profiles')
        .select('id, by_id, rookie_since')
        .eq('role', 'rookie')
        .not('rookie_since', 'is', null)
        .lte('rookie_since', twoWeeksAgo);

      if (!rookies?.length) return;

      // admin+ 운영진 전체 목록 조회
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'master', 'developer']);

      if (!admins?.length) return;

      for (const rookie of rookies) {
        // 이미 이 rookie에 대한 검토 알림이 현재 관리자에게 발송됐는지 확인
        const notifTitle = `🔔 수습기간완료:${rookie.id}`;
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('title', notifTitle)
          .limit(1);

        if (existing?.length) continue; // 이미 발송됨

        // 아직 발송되지 않은 경우 admin+ 전원에게 알림 발송
        const notifRows = admins.map((admin) => ({
          user_id: admin.id,
          title: notifTitle,
          message: `신입 길드원 ${rookie.by_id}님의 2주 수습 기간이 완료되었습니다.\n클랜 생활 지속 여부를 결정해주세요.\n\n• 승인 → 길드원 관리에서 등급 변경\n• 거부 → 길드원 관리에서 제명 처리`,
        }));

        await supabase.from('notifications').insert(notifRows);
      }
    } catch (err) {
      console.error('수습 기간 알림 확인 실패:', err);
    }
  };

  /**
   * 현재 로그인한 관리자의 프로필과 이메일/전화번호를 불러와 상태에 저장합니다.
   * 위임 재인증 초기값도 이 함수에서 설정합니다.
   * 데이터 로드 후 2주 수습 기간이 경과한 신입에 대한 운영진 알림을 확인합니다.
   * @async
   */
  const loadCurrentManager = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const role = profile?.role?.trim?.().toLowerCase?.() || null;
      const authEmail = user.email || '';
      const hasPublicEmail = authEmail && !isInternalAuthEmail(authEmail);

      setCurrentManager({
        id: user.id,
        role,
        email: hasPublicEmail ? authEmail : '',
        authEmail,
        phone: user.phone || '',
      });
      setDelegationVerification(createVerificationState(hasPublicEmail ? authEmail : '', user.phone || ''));

      // admin 이상 직급이면 수습 기간 알림 확인
      if (['admin', 'master', 'developer'].includes(role)) {
        await checkRookieReviewNotifications(user.id);
      }
    } catch (error) {
      console.error('관리자 정보 로드 실패:', error);
    }
  }, []);

  /**
   * Supabase에서 길드원 목록을 불러옵니다.
   * visitor와 expelled 역할은 제외하며, 테스트 계정도 필터링됩니다.
   * @async
   */
  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, by_id, role, created_at, profile_oauth(discord_id), profile_meta(is_test_account, is_test_account_active)')
        .neq('role', 'visitor')
        .neq('role', 'expelled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const isTestViewer = isCurrentViewerTestAccount();
      const flat = (data || []).map(m => ({
        ...m,
        discord_id: m.profile_oauth?.discord_id ?? null,
        is_test_account: m.profile_meta?.is_test_account ?? null,
        is_test_account_active: m.profile_meta?.is_test_account_active ?? null,
      })).filter(m => isTestViewer
        ? (m.is_test_account === true && m.is_test_account_active === true)
        : (!m.is_test_account)
      );
      setMembers(flat);
    } catch (error) {
      console.error('길드원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 컴포넌트가 처음 마운트될 때 관리자 정보와 길드원 목록을 병렬로 불러옵니다.
   * 데이터 로드 완료 후 수습 기간 알림을 자동으로 확인합니다.
   */
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadCurrentManager(), fetchMembers()]);
    };

    initialize();
  }, [loadCurrentManager, fetchMembers]);

  /**
   * 특정 길드원의 역할(등급)을 변경합니다.
   * 'master' 역할로의 직접 변경은 허용되지 않습니다. (위임 절차 사용)
   * rookie로 진입하면 rookie_since를 현재 시각으로 기록하고,
   * rookie에서 다른 역할로 이동하면 rookie_since를 초기화합니다.
   * @async
   * @param {string} memberId - 등급을 변경할 길드원의 ID
   * @param {string} newRole - 새로 적용할 역할 문자열
   * @param {string} [previousRole] - 변경 전 역할 (rookie_since 처리에 사용)
   */
  const handleRoleChange = async (memberId, newRole, previousRole) => {
    if (newRole === 'master') {
      alert('마스터 지정은 재인증 후 마스터 위임으로만 처리할 수 있습니다.');
      return;
    }

    try {
      // 역할 변경은 RPC를 통해서만 허용 (클라이언트 직접 UPDATE 금지)
      const { data, error } = await supabase.rpc('rpc_update_profile_role', {
        p_target_id: memberId,
        p_new_role: newRole,
        p_note: `등급 변경: ${previousRole} → ${newRole}`,
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || '역할 변경 실패');

      // 직급 승급 포인트 보상
      const promotionRoles = ['rookie', 'member', 'elite', 'admin'];
      if (promotionRoles.includes(newRole)) {
        const { data: targetMeta } = await supabase
          .from('profile_meta')
          .select('is_test_account')
          .eq('user_id', memberId)
          .maybeSingle();
        await grantRankPromotionBonus(
          supabase,
          memberId,
          newRole,
          Boolean(targetMeta?.is_test_account),
        );
      }

      await fetchMembers();
      setPendingRole('member');
      setActionModal({ isOpen: false, action: '', member: null });
      alert('등급이 변경되었습니다.');
    } catch (error) {
      alert('등급 변경 실패: ' + error.message);
    }
  };

  /**
   * master 전용: 수습 기간 조건에 관계없이 rookie를 즉시 정회원(member)으로 승급합니다.
   * @async
   * @param {object} member - 승급 대상 길드원 객체
   */
  const handleForcePromoteToMember = async (member) => {
    if (!window.confirm(`${member.by_id}님을 수습 기간에 관계없이 즉시 정회원으로 승급하시겠습니까?`)) return;
    try {
      const { data, error } = await supabase.rpc('rpc_update_profile_role', {
        p_target_id: member.id,
        p_new_role: 'member',
        p_note: '마스터 즉시 승급 (수습 기간 면제)',
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || '승급 실패');

      // 정회원 승급 포인트 보상
      await grantRankPromotionBonus(
        supabase,
        member.id,
        'member',
        Boolean(member?.is_test_account),
      );

      await supabase.from('notifications').insert({
        user_id: member.id,
        title: '🎉 정회원 승급 알림',
        message: `마스터에 의해 즉시 정회원으로 승급되었습니다. ByClan의 정식 길드원이 된 것을 축하합니다!`,
      });

      await fetchMembers();
      alert(`${member.by_id}님이 정회원으로 승급되었습니다.`);
    } catch (error) {
      alert('승급 실패: ' + error.message);
    }
  };


  /**
   * 특정 길드원을 제명 처리합니다.
   * 제명은 role을 'expelled'로 변경하는 방식으로 처리됩니다.
   * @async
   * @param {string} memberId - 제명할 길드원의 ID
   */
  const handleRemoveMember = async (memberId) => {
    try {
      const { data, error } = await supabase.rpc('rpc_update_profile_role', {
        p_target_id: memberId,
        p_new_role: 'expelled',
        p_note: '제명 처리',
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || '제명 처리 실패');

      await fetchMembers();
      setActionModal({ isOpen: false, action: '', member: null });
      alert('제명 처리되었습니다.');
    } catch (error) {
      alert('제명 처리 실패: ' + error.message);
    }
  };

  /**
   * 현재 마스터를 admin으로 강등하고, 대상 길드원을 새 마스터로 승급합니다.
   * master.delegate 권한과 5분 이내 재인증이 반드시 필요합니다.
   * @async
   * @param {string} targetId - 마스터로 위임할 길드원의 ID
   */
  const handleMasterDelegation = async (targetId) => {
    const now = Date.now();

    if (!PermissionChecker.hasPermission(currentManager.role, 'master.delegate')) {
      alert('현재 계정에는 마스터 위임 권한이 없습니다.');
      return;
    }

    if (!delegationVerification.verifiedAt || now - delegationVerification.verifiedAt > DELEGATION_VERIFY_WINDOW_MS) {
      alert('마스터 위임 전 본인 재인증을 완료해야 합니다.');
      return;
    }

    try {
      // 현재 마스터 → admin 강등, 대상 → master 승격 (RPC 사용)
      const currentMaster = members.find(m => m.role === 'master');
      if (currentMaster) {
        await supabase.rpc('rpc_update_profile_role', {
          p_target_id: currentMaster.id,
          p_new_role: 'admin',
          p_note: '마스터 위임 — 전임 마스터 admin 강등',
        });
      }

      // master 변경은 특별히 직접 UPDATE 허용 (위임 전용 로직)
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'master' })
        .eq('id', targetId);

      if (error) throw error;
      
      await fetchMembers();
      setMasterDelegation({ isOpen: false, member: null });
      setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
      alert('마스터 위임이 완료되었습니다.');
    } catch (error) {
      alert('마스터 위임 실패: ' + error.message);
    }
  };

  /**
   * 비밀번호를 이용한 본인 재인증을 수행합니다.
   * Supabase signInWithPassword를 호출하여 현재 계정인지 확인합니다.
   * 성공하면 verifiedAt 타임스탬프를 저장합니다.
   * @async
   */
  const handlePasswordVerification = async () => {
    if (!delegationVerification.password.trim()) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정 비밀번호를 입력하세요.',
        success: '',
      }));
      return;
    }

    const identifier = currentManager.authEmail || currentManager.phone;
    if (!identifier) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정에 이메일 또는 전화번호가 연결되어 있지 않아 비밀번호 재인증을 진행할 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, verifying: true, error: '', success: '' }));

      const credentials = currentManager.authEmail
        ? { email: currentManager.authEmail, password: delegationVerification.password }
        : { phone: currentManager.phone, password: delegationVerification.password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) throw error;
      if (data.user?.id !== currentManager.id) {
        throw new Error('현재 로그인 계정과 일치하지 않는 인증 결과입니다.');
      }

      setDelegationVerification((prev) => ({
        ...prev,
        password: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'password',
        verifying: false,
        error: '',
        success: '비밀번호 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        verifying: false,
        error: error.message || '비밀번호 재인증에 실패했습니다.',
        success: '',
      }));
    }
  };

  /**
   * 이메일 OTP 인증 코드를 현재 관리자의 이메일로 발송합니다.
   * @async
   */
  const handleSendOtp = async () => {
    if (!currentManager.email) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정에 이메일이 연결되어 있지 않아 이메일 인증을 보낼 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, sendingOtp: true, error: '', success: '' }));

      const { error } = await supabase.auth.signInWithOtp({
        email: currentManager.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setDelegationVerification((prev) => ({
        ...prev,
        otpSent: true,
        sendingOtp: false,
        error: '',
        success: '인증 코드를 현재 계정 이메일로 전송했습니다. 메일에 도착한 코드를 입력해 확인하세요.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        sendingOtp: false,
        error: error.message || '이메일 인증 코드 전송에 실패했습니다.',
        success: '',
      }));
    }
  };

  /**
   * 이메일로 받은 OTP 코드를 검증합니다.
   * 검증 성공 시 verifiedAt 타임스탬프를 저장합니다.
   * @async
   */
  const handleVerifyOtp = async () => {
    if (!delegationVerification.otp.trim()) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '이메일로 받은 인증 코드를 입력하세요.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, verifying: true, error: '', success: '' }));

      const { data, error } = await supabase.auth.verifyOtp({
        email: currentManager.email,
        token: delegationVerification.otp.trim(),
        type: 'email',
      });

      if (error) throw error;
      if (data.user?.id !== currentManager.id) {
        throw new Error('현재 로그인 계정과 일치하지 않는 이메일 인증 결과입니다.');
      }

      setDelegationVerification((prev) => ({
        ...prev,
        otp: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'email',
        verifying: false,
        error: '',
        success: '이메일 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        verifying: false,
        error: error.message || '이메일 인증 확인에 실패했습니다.',
        success: '',
      }));
    }
  };

  /**
   * 마스터 위임 모달을 열고 재인증 상태를 초기화합니다.
   * @param {object} member - 위임 대상 길드원 객체
   */
  const openMasterDelegationModal = (member) => {
    setMasterDelegation({ isOpen: true, member });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  };

  /**
   * 마스터 위임 모달을 닫고 재인증 상태를 초기화합니다.
   */
  const closeMasterDelegationModal = () => {
    setMasterDelegation({ isOpen: false, member: null });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  };

  /** 재인증이 유효한지 여부: verifiedAt이 있고 5분 이내인 경우 true */
  const isDelegationVerified = Boolean(
    delegationVerification.verifiedAt &&
    Date.now() - delegationVerification.verifiedAt <= DELEGATION_VERIFY_WINDOW_MS
  );

  /** 현재 관리자가 길드원 관리 권한을 가지고 있는지 여부 */
  const canManageMembers = PermissionChecker.hasPermission(currentManager.role, 'member.manage');
  /** 현재 관리자가 마스터 위임 권한을 가지고 있는지 여부 */
  const canDelegateMaster = PermissionChecker.hasPermission(currentManager.role, 'master.delegate');

  /**
   * 역할에 해당하는 색상 코드를 반환합니다.
   * @param {string} role - 역할 문자열
   * @returns {string} 색상 코드 (hex)
   */
  const getRoleColor = (role) => {
    return ROLE_PERMISSIONS[role]?.color || '#C7CEEA';
  };

  /**
   * 역할에 해당하는 이모지 아이콘을 반환합니다.
   * @param {string} role - 역할 문자열
   * @returns {string} 이모지 아이콘
   */
  const getRoleIcon = (role) => {
    return ROLE_PERMISSIONS[role]?.icon || '👤';
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-cyan-400 font-mono">
        [ LOADING GUILD DATA... ]
      </div>
    );
  }

  if (!canManageMembers) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4">
        <div className="rounded-3xl border border-red-500/30 bg-gray-950/80 px-8 py-12 text-center shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-3xl font-black text-red-400 mb-4">길드원 관리 권한 없음</h2>
          <p className="text-gray-300">현재 계정에는 길드원 관리 권한이 없어 이 화면에 접근할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-2">
          길드원 관리
        </h1>
        <p className="text-gray-400">길드원 등급 변경, 제명, 마스터 위임 등의 관리 기능</p>
      </div>

      {/* 길드원 목록 */}
      <div className="bg-gray-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-cyan-500/30">
              <tr>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">이름</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">직책</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">가입일</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">권한 설명</th>
                <th className="px-6 py-4 text-center text-cyan-400 font-bold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRoleIcon(member.role)}</span>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">{member.by_id}{isMarkedTestAccount(member) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}</div>
                        <div className="text-gray-400 text-sm">{member.discord_id || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ 
                        backgroundColor: getRoleColor(member.role) + '20',
                        color: getRoleColor(member.role),
                        border: `1px solid ${getRoleColor(member.role)}50`
                      }}
                    >
                      {ROLE_PERMISSIONS[member.role]?.name || member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(member.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {ROLE_PERMISSIONS[member.role]?.description || '권한 정보 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {/* 개발자는 제외 */}
                      {member.role !== 'developer' && (
                        <>
                          <button
                            onClick={() => {
                              setPendingRole(member.role);
                              setActionModal({ isOpen: true, action: 'role', member });
                            }}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
                          >
                            등급
                          </button>
                          <button
                            onClick={() => setActionModal({ isOpen: true, action: 'remove', member })}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            제명
                          </button>
                          {/* master 전용: rookie를 즉시 정회원으로 승급 */}
                          {member.role === 'rookie' && currentManager.role === 'master' && (
                            <button
                              onClick={() => handleForcePromoteToMember(member)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
                              title="수습 기간에 관계없이 즉시 정회원으로 승급 (마스터 전용)"
                            >
                              즉시 승급
                            </button>
                          )}
                          {member.role !== 'master' && canDelegateMaster && (
                            <button
                              onClick={() => openMasterDelegationModal(member)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
                            >
                              위임
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 관리 모달 */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
              {actionModal.action === 'role' ? '등급 변경' : '제명 처리'}
            </h3>
            
            {actionModal.action === 'role' ? (
              <div className="space-y-3">
                <p className="text-gray-300">
                  {actionModal.member.by_id}님의 등급을 변경합니다.
                </p>
                <select 
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  value={pendingRole}
                  onChange={(event) => setPendingRole(event.target.value)}
                >
                   <option value="applicant">신규 가입자</option>
                  <option value="member">일반 클랜원</option>
                  <option value="rookie">신입 길드원</option>
                  <option value="elite">정예 길드원</option>
                  <option value="admin">관리자</option>
                </select>
                <p className="text-xs text-yellow-300/80">
                  마스터 지정은 이 메뉴가 아니라 아래의 재인증 기반 위임 절차로만 처리됩니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRoleChange(actionModal.member.id, pendingRole, actionModal.member.role)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold transition-colors"
                  >
                    변경
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: '', member: null })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-300">
                  {actionModal.member.by_id}님을 제명하시겠습니까?
                  <br />
                  <span className="text-red-400">이 작업은 되돌릴 수 없습니다.</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemoveMember(actionModal.member.id)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold transition-colors"
                  >
                    제명
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: '', member: null })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 마스터 위임 모달 */}
      {masterDelegation.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">👑 마스터 위임</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              <span className="text-white font-semibold">{masterDelegation.member?.by_id || '[by_id 없음]'}</span> 님에게 마스터 권한을 위임합니다.
              <br />
              <span className="text-yellow-400">위임 전에 현재 로그인한 운영 계정으로 본인 재인증을 완료해야 합니다.</span>
            </p>

            <div className="rounded-xl border border-yellow-500/20 bg-black/20 p-4 space-y-4 mb-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setDelegationVerification((prev) => ({ ...prev, method: 'password', error: '', success: '' }))}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${delegationVerification.method === 'password' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  비밀번호 확인
                </button>
                <button
                  onClick={() => setDelegationVerification((prev) => ({ ...prev, method: 'email', error: '', success: '' }))}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${delegationVerification.method === 'email' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  disabled={!currentManager.email}
                >
                  이메일 인증
                </button>
              </div>

              {delegationVerification.method === 'password' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    현재 로그인 계정의 비밀번호를 다시 입력해야 위임을 진행할 수 있습니다.
                  </p>
                  <input
                    type="password"
                    value={delegationVerification.password}
                    onChange={(event) => setDelegationVerification((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="현재 계정 비밀번호 입력"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handlePasswordVerification}
                    disabled={delegationVerification.verifying}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
                  >
                    {delegationVerification.verifying ? '확인 중...' : '비밀번호로 재인증'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    인증 코드를 <span className="text-cyan-300">{currentManager.email || '연결된 이메일 없음'}</span> 으로 보냅니다.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={delegationVerification.otp}
                      onChange={(event) => setDelegationVerification((prev) => ({ ...prev, otp: event.target.value }))}
                      placeholder="이메일 인증 코드 입력"
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={delegationVerification.sendingOtp || !currentManager.email}
                      className="rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white px-4 py-2 font-bold transition-colors whitespace-nowrap"
                    >
                      {delegationVerification.sendingOtp ? '전송 중...' : delegationVerification.otpSent ? '재전송' : '코드 전송'}
                    </button>
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={delegationVerification.verifying || !delegationVerification.otp.trim()}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
                  >
                    {delegationVerification.verifying ? '확인 중...' : '이메일 코드 확인'}
                  </button>
                </div>
              )}

              {delegationVerification.error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {delegationVerification.error}
                </div>
              )}

              {delegationVerification.success && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {delegationVerification.success}
                </div>
              )}

              <div className="text-xs text-gray-500">
                인증 성공 후 5분 안에만 위임을 실행할 수 있습니다.
                {isDelegationVerified && delegationVerification.verifiedMethod && (
                  <span className="text-emerald-300"> 현재 {delegationVerification.verifiedMethod === 'password' ? '비밀번호' : '이메일'} 재인증이 완료된 상태입니다.</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleMasterDelegation(masterDelegation.member?.id)}
                disabled={!isDelegationVerified}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-yellow-600 text-white py-2 rounded font-bold transition-colors"
              >
                위임 실행
              </button>
              <button
                onClick={closeMasterDelegationModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
