// 파일명: src/hooks/useGuildMembers.ts
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

// fetchMembers의 리턴 타입을 추론하여 완벽한 타이핑 적용
type MemberType = Awaited<ReturnType<typeof fetchMembers>>[0];

export function useGuildMembers() {
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 객체 프로퍼티의 초기값을 명확히 잡아줍니다.
  const [currentManager, setCurrentManager] = useState<{
    id: string | null; role: string | null; email: string; authEmail: string; phone: string;
  }>({ id: null, role: null, email: '', authEmail: '', phone: '' });

  const loadMembers = useCallback(async (isMountedRef?: { current: boolean }) => {
    try {
      const data = await fetchMembers();
      if (isMountedRef && !isMountedRef.current) return;
      setMembers(data);
    } catch (error) {
      console.error('클랜원 목록 로드 실패:', error);
    } finally {
      if (isMountedRef && !isMountedRef.current) return;
      setLoading(false);
    }
  }, []);

  const loadCurrentManager = useCallback(async (isMountedRef?: { current: boolean }) => {
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

      if (isMountedRef && !isMountedRef.current) return;
      setCurrentManager({
        id: user.id,
        role,
        email: hasPublicEmail ? authEmail : '',
        authEmail,
        phone: user.phone || '',
      });

      if (['admin', 'master', 'developer'].includes(role || '')) {
        await checkAndSendRookieNotifications(user.id);
      }
    } catch (error) {
      console.error('관리자 정보 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    const isMountedRef = { current: true };
    const initialize = async () => {
      await Promise.all([loadCurrentManager(isMountedRef), loadMembers(isMountedRef)]);
    };

    void initialize();
    return () => { isMountedRef.current = false; };
  }, [loadCurrentManager, loadMembers]);

  // 파라미터에 명확한 타입 적용
  const handleRoleChange = useCallback(async (memberId: string, newRole: string, previousRole: string) => {
    if (newRole === 'master') {
      alert('마스터 지정은 재인증 후 마스터 위임으로만 처리할 수 있습니다.');
      return false;
    }
    try {
      await updateMemberRole(memberId, newRole, previousRole);
      await loadMembers();
      return true;
    } catch (error: any) {
      alert('등급 변경 실패: ' + error.message);
      return false;
    }
  }, [loadMembers]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    try {
      await expelMember(memberId);
      await loadMembers();
      return true;
    } catch (error: any) {
      alert('제명 처리 실패: ' + error.message);
      return false;
    }
  }, [loadMembers]);

  const handleForcePromote = useCallback(async (member: MemberType) => {
    if (!window.confirm(`${member.by_id}님을 수습 기간에 관계없이 즉시 정회원으로 승급하시겠습니까?`)) return false;
    try {
      await forcePromoteToMember(member.id, Boolean(member.is_test_account));
      await loadMembers();
      alert(`${member.by_id}님이 정회원으로 승급되었습니다.`);
      return true;
    } catch (error: any) {
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