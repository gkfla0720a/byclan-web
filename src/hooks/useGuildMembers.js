'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabase';
import { isInternalAuthEmail } from '@/utils/accountId';
import {
  fetchMembers,
  updateMemberRole,
  expelMember,
  forcePromoteToMember,
  checkAndSendRookieNotifications,
} from '@/services/memberService';

/**
 * 클랜원 목록 및 역할 변경/제명/즉시 승급 로직을 관리하는 훅입니다.
 * DB 접근은 memberService를 통해서만 이루어집니다.
 *
 * @returns {{
 *   members: Array,
 *   loading: boolean,
 *   currentManager: object,
 *   loadMembers: function,
 *   handleRoleChange: function,
 *   handleRemoveMember: function,
 *   handleForcePromote: function,
 * }}
 */
export function useGuildMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentManager, setCurrentManager] = useState({
    id: null, role: null, email: '', authEmail: '', phone: '',
  });

  const loadMembers = useCallback(async () => {
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (error) {
      console.error('클랜원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

      const role = profile?.role || null;
      const authEmail = user.email || '';
      const hasPublicEmail = authEmail && !isInternalAuthEmail(authEmail);

      setCurrentManager({
        id: user.id,
        role,
        email: hasPublicEmail ? authEmail : '',
        authEmail,
        phone: user.phone || '',
      });

      if (['admin', 'master', 'developer'].includes(role)) {
        await checkAndSendRookieNotifications(user.id);
      }
    } catch (error) {
      console.error('관리자 정보 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadCurrentManager(), loadMembers()]);
  }, [loadCurrentManager, loadMembers]);

  const handleRoleChange = useCallback(async (memberId, newRole, previousRole) => {
    if (newRole === 'master') {
      alert('마스터 지정은 재인증 후 마스터 위임으로만 처리할 수 있습니다.');
      return false;
    }
    try {
      await updateMemberRole(memberId, newRole, previousRole);
      await loadMembers();
      return true;
    } catch (error) {
      alert('등급 변경 실패: ' + error.message);
      return false;
    }
  }, [loadMembers]);

  const handleRemoveMember = useCallback(async (memberId) => {
    try {
      await expelMember(memberId);
      await loadMembers();
      return true;
    } catch (error) {
      alert('제명 처리 실패: ' + error.message);
      return false;
    }
  }, [loadMembers]);

  const handleForcePromote = useCallback(async (member) => {
    if (!window.confirm(`${member.by_id}님을 수습 기간에 관계없이 즉시 정회원으로 승급하시겠습니까?`)) return false;
    try {
      await forcePromoteToMember(member.id, Boolean(member.is_test_account));
      await loadMembers();
      alert(`${member.by_id}님이 정회원으로 승급되었습니다.`);
      return true;
    } catch (error) {
      alert('승급 실패: ' + error.message);
      return false;
    }
  }, [loadMembers]);

  return {
    members,
    loading,
    currentManager,
    loadMembers,
    handleRoleChange,
    handleRemoveMember,
    handleForcePromote,
  };
}
