// 파일명: src/utils/adminActions.ts

import { supabase } from '@/supabase';
import { recordAdminAudit } from './adminAudit';
import type { AdminActionType, AuditCategory } from '@/types/domain';

/**
 * 🚨 1. 유저 강제 추방 (Expel User)
 * - 프로필의 직급을 'expelled'로 변경하고 활동을 정지시킵니다.
 */
export async function expelUser(
  targetUserId: string, 
  adminId: string, 
  reason: string
) {
  // 1. 실제 DB 업데이트 로직
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'expelled', is_active: false })
    .eq('id', targetUserId);

  if (error) throw new Error('유저 추방에 실패했습니다.');

  // 2. 감사 로그 기록 (완벽한 추적)
  await recordAdminAudit(supabase, {
    actorId: adminId,
    actionType: 'EXPEL_USER' as AdminActionType,
    category: 'MEMBER_MANAGEMENT' as AuditCategory,
    targetTable: 'profiles',
    targetId: targetUserId,
    note: `[강제 추방] 사유: ${reason}`,
    beforeData: { is_active: true }, // 전체를 다 넣지 않고 핵심 변경점만 넣어도 됩니다.
    afterData: { role: 'expelled', is_active: false },
  });

  return true;
}

/**
 * ✅ 2. 가입 신청 승인 (Approve Applicant)
 * - 신청서 상태를 '승인'으로 바꾸고, 유저 직급을 'rookie(신입)'로 올립니다.
 */
export async function approveApplicant(
  applicationId: number, 
  targetUserId: string, 
  adminId: string
) {
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

  // 2. 유저 직급 업데이트 (visitor/applicant -> rookie)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'rookie', rookie_since: new Date().toISOString() })
    .eq('id', targetUserId);

  if (profileError) throw new Error('유저 권한 승급 실패');

  // 3. 감사 로그 기록
  await recordAdminAudit(supabase, {
    actorId: adminId,
    actionType: 'APPROVE_APPLICANT' as AdminActionType,
    category: 'APPLICATION_REVIEW' as AuditCategory,
    targetTable: 'applications',
    targetId: applicationId,
    targetUserId: targetUserId, // 연관된 유저 ID 기록
    note: '가입 신청 승인 및 rookie 승급 처리',
  });

  return true;
}

/**
 * ⚙️ 3. MMR 수동 조작 (Manual MMR Update)
 * - 래더 랭킹 테이블의 MMR을 운영진이 강제로 수정합니다. (어뷰징 복구 등)
 */
export async function manualMMRUpdate(
  targetUserId: string, 
  newMMR: number, 
  adminId: string, 
  reason: string
) {
  // 먼저 이전 MMR이 몇이었는지 조회합니다 (로그 기록용)
  const { data: beforeData } = await supabase
    .from('ladder_rankings')
    .select('ladder_mmr')
    .eq('user_id', targetUserId)
    .single();

  const { error } = await supabase
    .from('ladder_rankings')
    .update({ ladder_mmr: newMMR })
    .eq('user_id', targetUserId);

  if (error) throw new Error('MMR 수정에 실패했습니다.');

  // MMR 변경은 mmr_logs와 admin_audit_logs 양쪽에 모두 안전하게 기록됩니다!
  await recordAdminAudit(supabase, {
    actorId: adminId,
    actionType: 'MANUAL_MMR_UPDATE' as AdminActionType,
    category: 'MMR_ADJUSTMENT' as AuditCategory,
    targetTable: 'ladder_rankings',
    targetId: targetUserId,
    targetUserId: targetUserId,
    note: `[MMR 강제 수정] 사유: ${reason}`,
    beforeData: beforeData,
    afterData: { ladder_mmr: newMMR },
  });

  return true;
}
