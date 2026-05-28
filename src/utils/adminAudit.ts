// 파일명: src/utils/adminAudit.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type { AdminActionType, AuditCategory } from '@/types/domain';

// UI와 로직에서 사용할 위험도 타입 정의
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// 📋 감사 로그를 기록할 때 들고 와야 하는 물품 주문서 (Payload)
export interface AdminAuditPayload {
  action_type: AdminActionType;
  category: AuditCategory;
  target_table: string;
  actor_id?: string | null;
  actor_by_id?: string | null;
  actor_role?: string | null;
  severity?: AuditSeverity | null;
  ip_address?: string | null;
  target_id?: string | null;
  target_user_id?: string | null;
  before_data?: Json | null;
  after_data?: Json | null;
  note?: string | null;
  summary?: string | null;
  is_test_data?: boolean | null;
}

export const recordAdminAudit = async (
  sb: SupabaseClient<Database>,
  payload: AdminAuditPayload
): Promise<boolean> => {
  try {
    // insert 문은 Supabase 서랍 이름표와 100% 일치하도록 꼼꼼히 매핑해 줍니다.
    const { error: auditError } = await sb.from('admin_audit_logs').insert({
      action_type: payload.action_type,
      category: payload.category,
      target_table: payload.target_table,
      
      // 물품 주입
      actor_id: payload.actor_id ?? null,
      actor_by_id: payload.actor_by_id ?? null,
      actor_role: payload.actor_role ?? null,
      severity: payload.severity || 'INFO',
      ip_address: payload.ip_address ?? null,
      target_id: payload.target_id ? String(payload.target_id) : null,
      target_user_id: payload.target_user_id ?? null,
      before_data: payload.before_data ?? null,
      after_data: payload.after_data ?? null,
      note: payload.note ?? null,
      summary: payload.summary ?? payload.note ?? null,
      is_test_data: Boolean(payload.is_test_data),
    });

    if (auditError) throw auditError;
    return true;
  } catch (err) {
    console.error('[adminAudit] 감사 로그 기록 실패:', err);
    return false;
  }
};