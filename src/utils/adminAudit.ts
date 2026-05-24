// 파일명: src/utils/adminAudit.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type { AdminActionType, AuditCategory } from '@/types/domain';

// UI와 로직에서 사용할 위험도 타입 정의
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AdminAuditPayload {
  actorId?: string | null;
  actorById?: string | null;
  actorRole?: string | null;
  actionType: AdminActionType;
  category: AuditCategory;
  severity?: AuditSeverity; // 👈 추가됨 (기본값: INFO)
  ipAddress?: string | null; // 👈 추가됨
  targetTable: string;
  targetId?: string | number | null;
  targetUserId?: string | null;
  beforeData?: Json | null;
  afterData?: Json | null;
  note?: string | null;
  summary?: string | null;
  isTestData?: boolean;
}

export async function recordAdminAudit(
  sb: SupabaseClient<Database>,
  payload: AdminAuditPayload
): Promise<boolean> {
  try {
    const { error: auditError } = await sb.from('admin_audit_logs').insert({
      actor_id: payload.actorId ?? null,
      actor_by_id: payload.actorById ?? null,
      actor_role: payload.actorRole ?? null,
      action_type: payload.actionType,
      category: payload.category,
      severity: payload.severity || 'INFO', // 👈 위험도 저장
      ip_address: payload.ipAddress ?? null, // 👈 IP 저장
      target_table: payload.targetTable,
      target_id: payload.targetId ? String(payload.targetId) : null,
      target_user_id: payload.targetUserId ?? null,
      before_data: payload.beforeData ?? null,
      after_data: payload.afterData ?? null,
      note: payload.note ?? null,
      summary: payload.summary ?? payload.note ?? null,
      is_test_data: Boolean(payload.isTestData),
    });

    if (auditError) throw auditError;
    return true;
  } catch (err) {
    console.error('[adminAudit] 감사 로그 기록 실패:', err);
    return false;
  }
}
