/**
 * @file pointSystem.js
 * @역할 ByClan 클랜 포인트 시스템의 핵심 유틸리티 함수 모음
 *
 * @주요기능
 *   - grantPoints: 포인트 지급 + 로그 기록 + 알림 발송
 *   - deductPoints: 포인트 차감 + 로그 기록 + 알림 발송
 *   - checkAndGrantDailyBonus: 일별 첫 로그인 출석 보상 (500CP)
 *   - grantMatchParticipationBonus: 매치 참여 보상 (500CP)
 *   - grantRankPromotionBonus: 직급 승급 보상
 *
 * @직급별보상
 *   rookie (신규 클랜원): 1,000 CP
 *   member (정회원 승급): 3,000 CP  (2,000 + 1,000)
 *   elite  (정예 승급):   6,000 CP  (5,000 + 1,000)
 *   admin  (운영진 승급): 11,000 CP (10,000 + 1,000)
 *
 * @포인트변동유형
 *   manual           - 관리자 직접 지급/회수
 *   admin_grant      - 관리자 지급
 *   admin_deduct     - 관리자 회수
 *   daily_bonus      - 출석 보상
 *   match_reward     - 매치 참여 보상
 *   rank_promotion   - 직급 승급 보상
 *   new_member       - 신규 클랜원 보상
 *   bet_deduct       - 배팅 차감
 *   bet_settle_win   - 배팅 정산 (승리)
 *   bet_settle_loss  - 배팅 정산 (패배)
 */

/**
 * 직급별 승급 보상 포인트 정의
 * 형식: 해당 직급 고유 포인트 + 1,000 CP
 */
export const RANK_BONUS = {
  rookie: 1000,   // 신규 클랜원: 1,000 CP
  member: 3000,   // 정회원: 2,000 + 1,000 = 3,000 CP
  elite:  6000,   // 정예: 5,000 + 1,000 = 6,000 CP
  admin:  11000,  // 운영진: 10,000 + 1,000 = 11,000 CP
};

/** 출석 보상 포인트 */
export const DAILY_BONUS_AMOUNT = 500;

/** 매치 참여 보상 포인트 */
export const MATCH_REWARD_AMOUNT = 500;

/** Discord 접속/출첵 보상 포인트 */
export const DISCORD_CHECKIN_AMOUNT = 1000;

/**
 * 포인트를 지급하고 로그 및 알림을 기록합니다.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb - Supabase 클라이언트
 * @param {string} userId - 대상 사용자 UUID
 * @param {number} amount - 지급할 포인트 (양수)
 * @param {string} reason - 지급 이유 (point_logs.reason)
 * @param {string} [type='manual'] - 지급 유형 코드
 * @param {string|null} [relatedId=null] - 연관 ID (매치 UUID 등)
 * @param {boolean} [isTestData=false] - 테스트 데이터 여부
 * @returns {Promise<{ok: boolean, newBalance: number, error: string|null}>}
 */
export async function grantPoints(sb, userId, amount, reason, type = 'manual', relatedId = null, isTestData = false) {
  if (!userId || amount <= 0) return { ok: false, newBalance: 0, error: '잘못된 파라미터' };

  try {
    const { data: prof, error: profErr } = await sb
      .from('profiles')
      .select('clan_point')
      .eq('id', userId)
      .single();

    if (profErr) throw profErr;

    const newBalance = (prof?.clan_point ?? 0) + amount;

    const { error: updateErr } = await sb
      .from('profiles')
      .update({ clan_point: newBalance })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 포인트 로그
    await sb.from('point_logs').insert({
      user_id: userId,
      amount,
      reason,
      type,
      balance_after: newBalance,
      related_id: relatedId,
      is_test_data: isTestData,
    });

    // 알림
    await sb.from('notifications').insert({
      user_id: userId,
      title: `✅ 포인트 지급: +${amount.toLocaleString()} CP`,
      message: `${reason}으로 ${amount.toLocaleString()} CP가 지급되었습니다. 현재 잔액: ${newBalance.toLocaleString()} CP`,
      is_test_data: isTestData,
      is_test_data_active: isTestData,
    });

    return { ok: true, newBalance, error: null };
  } catch (err) {
    console.error('[pointSystem] grantPoints 실패:', err);
    return { ok: false, newBalance: 0, error: err.message || '포인트 지급 실패' };
  }
}

/**
 * 포인트를 차감하고 로그 및 알림을 기록합니다.
 * 잔액 부족 시 차감하지 않습니다.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb - Supabase 클라이언트
 * @param {string} userId - 대상 사용자 UUID
 * @param {number} amount - 차감할 포인트 (양수)
 * @param {string} reason - 차감 이유
 * @param {string} [type='manual'] - 차감 유형 코드
 * @param {string|null} [relatedId=null] - 연관 ID
 * @param {boolean} [isTestData=false] - 테스트 데이터 여부
 * @returns {Promise<{ok: boolean, newBalance: number, error: string|null}>}
 */
export async function deductPoints(sb, userId, amount, reason, type = 'manual', relatedId = null, isTestData = false) {
  if (!userId || amount <= 0) return { ok: false, newBalance: 0, error: '잘못된 파라미터' };

  try {
    const { data: prof, error: profErr } = await sb
      .from('profiles')
      .select('clan_point')
      .eq('id', userId)
      .single();

    if (profErr) throw profErr;

    const current = prof?.clan_point ?? 0;
    if (current < amount) {
      return { ok: false, newBalance: current, error: '포인트 잔액이 부족합니다.' };
    }

    const newBalance = current - amount;

    const { error: updateErr } = await sb
      .from('profiles')
      .update({ clan_point: newBalance })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 포인트 로그
    await sb.from('point_logs').insert({
      user_id: userId,
      amount: -amount,
      reason,
      type,
      balance_after: newBalance,
      related_id: relatedId,
      is_test_data: isTestData,
    });

    // 알림
    await sb.from('notifications').insert({
      user_id: userId,
      title: `⚠️ 포인트 차감: -${amount.toLocaleString()} CP`,
      message: `${reason}으로 ${amount.toLocaleString()} CP가 차감되었습니다. 현재 잔액: ${newBalance.toLocaleString()} CP`,
      is_test_data: isTestData,
      is_test_data_active: isTestData,
    });

    return { ok: true, newBalance, error: null };
  } catch (err) {
    console.error('[pointSystem] deductPoints 실패:', err);
    return { ok: false, newBalance: 0, error: err.message || '포인트 차감 실패' };
  }
}

/**
 * 오늘 첫 로그인 출석 보상(500 CP)을 확인하고 지급합니다.
 * last_daily_bonus_at 이 오늘 날짜가 아닌 경우에만 지급합니다.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} userId
 * @param {boolean} [isTestData=false]
 * @returns {Promise<{granted: boolean, amount: number}>}
 */
export async function checkAndGrantDailyBonus(sb, userId, isTestData = false) {
  if (!userId) return { granted: false, amount: 0 };

  try {
    const { data: prof } = await sb
      .from('profiles')
      .select('last_daily_bonus_at, clan_point')
      .eq('id', userId)
      .single();

    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastBonus = prof?.last_daily_bonus_at;

    if (lastBonus === todayStr) {
      return { granted: false, amount: 0 }; // 이미 오늘 받음
    }

    // last_daily_bonus_at 업데이트 먼저 (중복 방지)
    const { error: updateErr } = await sb
      .from('profiles')
      .update({ last_daily_bonus_at: todayStr })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 포인트 지급 (grantPoints는 프로필을 다시 조회하므로 정합성 유지됨)
    const result = await grantPoints(
      sb,
      userId,
      DAILY_BONUS_AMOUNT,
      '출석 보상 (일별 첫 로그인)',
      'daily_bonus',
      null,
      isTestData,
    );

    return { granted: result.ok, amount: DAILY_BONUS_AMOUNT };
  } catch (err) {
    console.error('[pointSystem] checkAndGrantDailyBonus 실패:', err);
    return { granted: false, amount: 0 };
  }
}

/**
 * 매치 참여 보상(500 CP)을 지급합니다.
 * 매치 시작(진행중 전환) 시 참여 선수에게 호출됩니다.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} userId
 * @param {string} matchId - 매치 UUID (로그용)
 * @param {boolean} [isTestData=false]
 * @returns {Promise<{ok: boolean}>}
 */
export async function grantMatchParticipationBonus(sb, userId, matchId, isTestData = false) {
  if (!userId || !matchId) return { ok: false };

  const result = await grantPoints(
    sb,
    userId,
    MATCH_REWARD_AMOUNT,
    '매치 참여 보상',
    'match_reward',
    matchId,
    isTestData,
  );
  return { ok: result.ok };
}

/**
 * 직급 승급 보상을 지급합니다.
 * GuildManagement.js 의 handleRoleChange / handleForcePromoteToMember 에서 호출됩니다.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} userId - 승급 대상 사용자 UUID
 * @param {string} newRole - 승급된 직급 (rookie|member|elite|admin)
 * @param {boolean} [isTestData=false]
 * @returns {Promise<{ok: boolean, amount: number}>}
 */
export async function grantRankPromotionBonus(sb, userId, newRole, isTestData = false) {
  const amount = RANK_BONUS[newRole];
  if (!amount) return { ok: false, amount: 0 };

  const isNew = newRole === 'rookie';
  const reason = isNew
    ? '신규 클랜원 달성 보상'
    : `직급 승급 보상 (→ ${newRole})`;
  const type = isNew ? 'new_member' : 'rank_promotion';

  const result = await grantPoints(sb, userId, amount, reason, type, null, isTestData);
  return { ok: result.ok, amount };
}

/**
 * Discord 서버 접속 또는 출석체크 시 포인트(1,000 CP)를 지급합니다.
 * 하루 1회만 지급되며, last_discord_checkin_at 컬럼으로 중복을 방지합니다.
 *
 * ■ 사용 방법
 *   Discord Bot이 서버 접속/출첵 이벤트를 감지하면 이 함수를 호출합니다.
 *   현재는 운영진이 수동으로 호출하거나, 추후 Discord Bot 연동 시 자동 호출 예정입니다.
 *
 * ■ 연동 예정
 *   Discord Bot (discord.js) → Supabase Edge Function → grantDiscordCheckinBonus 호출
 *   또는 클라이언트에서 Discord OAuth 접속 확인 후 직접 호출
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} userId - 보상 대상 사용자 UUID
 * @param {boolean} [isTestData=false]
 * @returns {Promise<{granted: boolean, amount: number, reason: string}>}
 */
export async function grantDiscordCheckinBonus(sb, userId, isTestData = false) {
  if (!userId) return { granted: false, amount: 0, reason: '유저 없음' };

  try {
    const { data: prof } = await sb
      .from('profiles')
      .select('last_discord_checkin_at, clan_point')
      .eq('id', userId)
      .single();

    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastCheckin = prof?.last_discord_checkin_at;

    // 오늘 이미 지급한 경우 중복 지급 방지
    if (lastCheckin === todayStr) {
      return { granted: false, amount: 0, reason: '오늘 이미 Discord 출첵 보상을 받았습니다.' };
    }

    // 중복 방지용 날짜 먼저 업데이트
    const { error: updateErr } = await sb
      .from('profiles')
      .update({ last_discord_checkin_at: todayStr })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 포인트 지급
    const result = await grantPoints(
      sb,
      userId,
      DISCORD_CHECKIN_AMOUNT,
      'Discord 서버 접속/출석체크 보상',
      'discord_checkin',
      null,
      isTestData,
    );

    if (!result.ok) throw new Error(result.error || '포인트 지급 실패');

    return { granted: true, amount: DISCORD_CHECKIN_AMOUNT, reason: 'Discord 출첵 보상 지급 완료' };
  } catch (err) {
    console.error('[pointSystem] grantDiscordCheckinBonus 실패:', err);
    return { granted: false, amount: 0, reason: err.message || 'Discord 출첵 보상 실패' };
  }
}
