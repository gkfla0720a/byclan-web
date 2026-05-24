// 파일명: @/utils/adminAudit.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types'; // (경로는 실제 프로젝트 설정에 맞게 수정하세요)

/**
 * @file adminAudit.ts
 * @role 관리자 데이터 변경 감사 로그 기록 유틸
 */

// 1. payload에 들어올 데이터의 생김새(설계도)를 명확히 정의합니다.
export interface AdminAuditPayload {
  actorId?: string | null;
  actorById?: string | null;
  actorRole?: string | null;
  actionType: string;
  targetTable: string;
  targetId?: string | number | null;
  beforeData?: any; // Json 타입이 있다면 Json으로 변경 추천
  afterData?: any;
  note?: string | null;
  isTestData?: boolean;
  category?: string;
  targetUserId?: string | null;
  summary?: string | null;
  meta?: any;
}

/**
 * 관리자 감사 로그를 기록합니다.
 * 실패해도 사용자 흐름을 막지 않도록 false를 반환합니다.
 */
export async function recordAdminAudit(
  sb: SupabaseClient<Database>, // sb의 타입을 명시합니다.
  payload: AdminAuditPayload     // payload의 타입을 명시합니다.
): Promise<boolean> {
  try {
    const insertPayload = {
      actor_id: payload.actorId ?? null,
      actor_by_id: payload.actorById ?? null,
      actor_role: payload.actorRole ?? null,
      action_type: payload.actionType,
      target_table: payload.targetTable,
      target_id: payload.targetId ? String(payload.targetId) : null, // 문자열 보장
      before_data: payload.beforeData ?? null,
      after_data: payload.afterData ?? null,
      note: payload.note ?? null,
      is_test_data: Boolean(payload.isTestData),
    };

    // 첫 번째 로그 적재
    const { error: auditError } = await sb
      .from('admin_audit_logs')
      .insert(insertPayload);

    if (auditError) throw auditError;

    // 전역 활동 로그에도 동시 적재 (수동 변경 재검토 용이성 강화)
    const { error: activityError } = await sb
      .from('activity_logs')
      .insert({
        category: payload.category || 'admin',
        action_type: payload.actionType,
        source_type: 'admin_manual',
        is_manual: true,
        actor_id: payload.actorId ?? null,
        actor_by_id: payload.actorById ?? null,
        actor_role: payload.actorRole ?? null,
        target_user_id: payload.targetUserId ?? null,
        target_table: payload.targetTable,
        target_id: payload.targetId ? String(payload.targetId) : null,
        summary: payload.summary || payload.note || '관리자 수동 변경',
        before_data: payload.beforeData ?? null,
        after_data: payload.afterData ?? null,
        meta: payload.meta ?? null,
      });

    // 2. 두 번째 적재 시 발생하는 에러도 잡아냅니다!
    if (activityError) throw activityError;

    return true;
  } catch (err) {
    console.error('[adminAudit] 감사 로그 기록 실패:', err);
    return false;
  }
}
