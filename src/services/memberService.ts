// 파일명: src/services/memberService.ts
import { supabase } from '@/supabase';
import { grantRankPromotionBonus } from '@/utils/pointSystem';
import type { Database } from '@/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type JoinedMember = ProfileRow & {
  profile_oauth: { discord_id: string | null } | { discord_id: string | null }[] | null;
  profile_meta: { is_test_account: boolean | null; is_test_account_active: boolean | null } | { is_test_account: boolean | null; is_test_account_active: boolean | null }[] | null;
};

export async function fetchMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_oauth(discord_id), profile_meta(is_test_account, is_test_account_active)')
    .neq('role', 'guest')
    .neq('role', 'banned')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 2. data를 우리가 만든 JoinedMember 배열로 안전하게 단언합니다.
  const members = data as unknown as JoinedMember[];

  return members.map(m => {
    // Supabase 1:1 조인은 가끔 배열로 넘어올 수도 있으므로 안전하게 추출합니다.
    const oauth = Array.isArray(m.profile_oauth) ? m.profile_oauth[0] : m.profile_oauth;
    const meta = Array.isArray(m.profile_meta) ? m.profile_meta[0] : m.profile_meta;

    return {
      ...m,
      discord_id: oauth?.discord_id ?? null,
      is_test_account: meta?.is_test_account ?? null,
      is_test_account_active: meta?.is_test_account_active ?? null,
    };
  });
}

export async function updateMemberRole(
  memberId: string, 
  newRole: string, 
  previousRole: string, 
  isTestAccount: boolean = false
) {
  if (newRole === 'master') throw new Error('마스터 지정은 위임 절차로만 처리할 수 있습니다.');

  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: newRole,
    p_note: `등급 변경: ${previousRole} → ${newRole}`,
  });

  if (error) throw error;
  
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error || '역할 변경 실패');

  const promotionRoles = ['rookie', 'member', 'veteran', 'admin'];
  if (promotionRoles.includes(newRole)) {
    await grantRankPromotionBonus(supabase, memberId, newRole, isTestAccount);
  }
}

export async function expelMember(memberId: string) {
  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: 'banned',
    p_note: '제명 처리',
  });

  if (error) throw error;
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error || '제명 처리 실패');
}

export async function forcePromoteToMember(memberId: string, isTestAccount: boolean = false) {
  const { data, error } = await supabase.rpc('rpc_update_profile_role', {
    p_target_id: memberId,
    p_new_role: 'member',
    p_note: '마스터 즉시 승급 (수습 기간 면제)',
  });

  if (error) throw error;
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error || '승급 실패');

  await grantRankPromotionBonus(supabase, memberId, 'member', isTestAccount);

  await supabase.from('notifications').insert({
    user_id: memberId,
    title: '🎉 정회원 승급 알림',
    message: '마스터에 의해 즉시 정회원으로 승급되었습니다. ByClan의 정식 클랜원이 된 것을 축하합니다!',
  });
}

export async function delegateMaster(currentMasterId: string | null, targetId: string) {
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

export async function checkAndSendRookieNotifications(currentUserId: string) {
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
    
    // 중복 발송 방지
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