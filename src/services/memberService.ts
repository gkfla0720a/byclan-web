// 파일명: @/services/memberService.ts

import { supabase } from '@/supabase';
import { isCurrentViewerTestAccount } from '@/utils/testData';
import { grantRankPromotionBonus } from '@/utils/pointSystem';

/**
 * visitor, expelled를 제외한 클랜원 목록을 조회합니다.
 * 테스트 계정 여부에 따라 클라이언트 측 필터링을 적용합니다.
 * @returns {Promise<Array>}
 */
export async function fetchMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, by_id, role, created_at, profile_oauth(discord_id), profile_meta(is_test_account, is_test_account_active)')
    .neq('role', 'visitor')
    .neq('role', 'expelled')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const isTestViewer = isCurrentViewerTestAccount();
  return (data || []).map(m => ({
    ...m,
    discord_id: m.profile_oauth?.discord_id ?? null,
    is_test_account: m.profile_meta?.is_test_account ?? null,
    is_test_account_active: m.profile_meta?.is_test_account_active ?? null,
  })).filter(m =>
    isTestViewer
      ? (m.is_test_account === true && m.is_test_account_active === true)
      : !m.is_test_account
  );
}

/**
 * RPC를 통해 클랜원 역할을 변경합니다.
 * 역할이 'master'인 경우 호출을 차단합니다 (위임 절차 전용).
 * 승급 역할이면 포인트 보상도 지급합니다.
 * @param {string} memberId
 * @param {string} newRole
 * @param {string} previousRole
 * @param {boolean} isTestAccount
 */
export async function updateMemberRole(memberId, newRole, previousRole, isTestAccount = false) {
  if (newRole === 'master') throw new Error('마스터 지정은 위임 절차로만 처리할 수 있습니다.');

  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: newRole,
    p_note: `등급 변경: ${previousRole} → ${newRole}`,
  });
  const result = data as any;

  if (error) throw error;
  if (!result?.ok) throw new Error(result?.error || '역할 변경 실패');

  const promotionRoles = ['rookie', 'member', 'elite', 'admin'];
  if (promotionRoles.includes(newRole)) {
    const { data: targetMeta } = await supabase
      .from('profile_meta')
      .select('is_test_account')
      .eq('user_id', memberId)
      .maybeSingle();
    await grantRankPromotionBonus(supabase, memberId, newRole, Boolean(targetMeta?.is_test_account));
  }
}

/**
 * 클랜원을 제명 처리합니다 (role → 'expelled').
 * @param {string} memberId
 */
export async function expelMember(memberId) {
  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: 'expelled',
    p_note: '제명 처리',
  });
  const result = data as any;

  if (error) throw error;
  if (!result?.ok) throw new Error(result?.error || '제명 처리 실패');
}

/**
 * 마스터 전용: 수습 기간 무관하게 rookie를 즉시 정회원으로 승급합니다.
 * @param {string} memberId
 * @param {boolean} isTestAccount
 */
export async function forcePromoteToMember(memberId, isTestAccount = false) {
  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: 'member',
    p_note: '마스터 즉시 승급 (수습 기간 면제)',
  });
  const result = data as any;

  if (error) throw error;
  if (!result?.ok) throw new Error(result?.error || '승급 실패');

  await grantRankPromotionBonus(supabase, memberId, 'member', isTestAccount);

  await supabase.from('notifications').insert({
    user_id: memberId,
    title: '🎉 정회원 승급 알림',
    message: '마스터에 의해 즉시 정회원으로 승급되었습니다. ByClan의 정식 클랜원이 된 것을 축하합니다!',
  });
}

/**
 * 마스터 위임: 현 마스터 → admin 강등, 대상 → master 승격.
 * @param {string|null} currentMasterId - 현재 마스터 ID (없으면 강등 생략)
 * @param {string} targetId - 새 마스터가 될 클랜원 ID
 */
export async function delegateMaster(currentMasterId, targetId) {
  if (currentMasterId) {
    await supabase.rpc('rpc_update_profile_role', {
      p_target_id: currentMasterId,
      p_new_role: 'admin',
      p_note: '마스터 위임 — 전임 마스터 admin 강등',
    });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'master' })
    .eq('id', targetId);

  if (error) throw error;
}

/**
 * 2주 수습 기간이 지난 rookie에 대해 운영진 전원에게 알림을 발송합니다.
 * 이미 알림이 발송된 경우 중복 발송하지 않습니다.
 * @param {string} currentUserId - 현재 로그인한 관리자 ID
 */
export async function checkAndSendRookieNotifications(currentUserId) {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rookies } = await supabase
    .from('profiles')
    .select('id, by_id, rookie_since')
    .eq('role', 'rookie')
    .not('rookie_since', 'is', null)
    .lte('rookie_since', twoWeeksAgo);

  if (!rookies?.length) return;

  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'master', 'developer']);

  if (!admins?.length) return;

  for (const rookie of rookies) {
    const notifTitle = `🔔 수습기간완료:${rookie.id}`;
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('title', notifTitle)
      .limit(1);

    if (existing?.length) continue;

    const notifRows = admins.map((admin) => ({
      user_id: admin.id,
      title: notifTitle,
      message: `신입 클랜원 ${rookie.by_id}님의 2주 수습 기간이 완료되었습니다.\n클랜 생활 지속 여부를 결정해주세요.\n\n• 승인 → 클랜원 관리에서 등급 변경\n• 거부 → 클랜원 관리에서 제명 처리`,
    }));

    await supabase.from('notifications').insert(notifRows);
  }
}