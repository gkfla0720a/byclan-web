/**
 * @file adminAudit.js
 * @role 관리자 데이터 변경 감사 로그 기록 유틸
 */

/**
 * 관리자 감사 로그를 기록합니다.
 * 실패해도 사용자 흐름을 막지 않도록 false를 반환합니다.
 */
export async function recordAdminAudit(sb, payload) {
  try {
    const insertPayload = {
      actor_id: payload.actorId || null,
      actor_by_id: payload.actorById || null,
      actor_role: payload.actorRole || null,
      action_type: payload.actionType,
      target_table: payload.targetTable,
      target_id: payload.targetId || null,
      before_data: payload.beforeData ?? null,
      after_data: payload.afterData ?? null,
      note: payload.note || null,
      is_test_data: Boolean(payload.isTestData),
    };

    const { error } = await sb
      .from('admin_audit_logs')
      .insert(insertPayload);

    if (error) throw error;

    // 전역 활동 로그에도 동시 적재 (수동 변경 재검토 용이성 강화)
    await sb
      .from('activity_logs')
      .insert({
        category: payload.category || 'admin',
        action_type: payload.actionType,
        source_type: 'admin_manual',
        is_manual: true,
        actor_id: payload.actorId || null,
        actor_by_id: payload.actorById || null,
        actor_role: payload.actorRole || null,
        target_user_id: payload.targetUserId || null,
        target_table: payload.targetTable,
        target_id: payload.targetId || null,
        summary: payload.summary || payload.note || '관리자 수동 변경',
        before_data: payload.beforeData ?? null,
        after_data: payload.afterData ?? null,
        meta: payload.meta ?? null,
      });

    return true;
  } catch (err) {
    console.error('[adminAudit] 감사 로그 기록 실패:', err);
    return false;
  }
}
