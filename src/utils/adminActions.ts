// 파일명: src/utils/adminActions.ts

import { supabase } from '@/supabase';
import { recordAdminAudit } from './adminAudit';
import type { AdminActionType, AuditCategory } from '@/types/domain';

// 1. 유저 강제 추방 (Ban User)
export const banUser = async ( // MemberList.tsx에서 적용되어야 할 것 같은데 이 함수는 어디에서도 쓰이지 않는 것으로 보임.(확인 필요)
  targetUserId: string,
  adminId: string,
  reason: string
) => {
  // 1. 실제 DB 업데이트
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'banned', is_active: false })
    .eq('user_id', targetUserId);

  if (error) throw new Error('유저 추방에 실패했습니다.');

  // 2. 감사 로그 기록
  await recordAdminAudit(supabase, {
    actor_id: adminId,
    action_type: 'BAN_USER',
    category: 'MEMBER_MANAGEMENT' as AuditCategory,
    target_table: 'profiles',
    target_id: targetUserId,
    note: `[강제 추방] 사유: ${reason}`,
    before_data: { is_active: true },
    after_data: { role: 'banned', is_active: false },
  });

  return true;
};

// 2. 가입 신청 승인 (Approve Applicant)

export const approveApplicant = async (
  applicationId: number,
  targetUserId: string,
  adminId: string
) => {
  // 1. 가입 신청서 상태 업데이트
  const { error: appError } = await supabase
    .from('applications')
    .update({
      status: 'passed',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (appError) throw new Error('가입 신청서 업데이트 실패');

  // 2. 유저 직급 업데이트
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'rookie', rookie_since: new Date().toISOString() })
    .eq('user_id', targetUserId);

  if (profileError) throw new Error('유저 권한 승급 실패');

  // 3. 감사 로그 기록
  await recordAdminAudit(supabase, {
    actor_id: adminId,
    action_type: 'APPROVE_APPLICANT' as AdminActionType,
    category: 'APPLICATION_REVIEW' as AuditCategory,
    target_table: 'applications',
    target_id: String(applicationId),
    target_user_id: targetUserId,
    note: '가입 신청 승인 및 rookie 승급 처리',
  });

  return true;
};


// ⚙️ 3. MMR 수동 조작 (Manual MMR Update)
export const manualMMRUpdate = async (
  targetUserId: string,
  newMMR: number,
  adminId: string,
  reason: string
) => {
  // 이전 MMR 조회
  const { data: beforeData } = await supabase
    .from('ladder_rankings')
    .select('personal_mmr')
    .eq('user_id', targetUserId)
    .single();

  // MMR 수정
  const { error } = await supabase
    .from('ladder_rankings')
    .update({ personal_mmr: newMMR })
    .eq('user_id', targetUserId);

  if (error) throw new Error('MMR 수정에 실패했습니다.');

  // 3. 감사 로그 기록
  await recordAdminAudit(supabase, {
    actor_id: adminId,
    action_type: 'MANUAL_MMR_UPDATE' as AdminActionType,
    category: 'MMR_ADJUSTMENT' as AuditCategory,
    target_table: 'ladder_rankings',
    target_id: targetUserId,
    target_user_id: targetUserId,
    note: `[MMR 강제 수정] 사유: ${reason}`,
    before_data: beforeData as any,
    after_data: { personal_mmr: newMMR },
  });

  return true;
};