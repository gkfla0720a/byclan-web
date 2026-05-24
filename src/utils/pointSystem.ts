// 파일명: src/utils/pointSystem.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

export const RANK_BONUS: Record<string, number> = {
  rookie: 1000,
  member: 3000,
  veteran: 6000,
  admin: 11000,
};

export const DAILY_BONUS_AMOUNT = 500;
export const MATCH_REWARD_AMOUNT = 500;
export const DISCORD_CHECKIN_AMOUNT = 1000;

export async function grantPoints(
  sb: SupabaseClient<Database>,
  userId: string,
  amount: number,
  reason: string,
  type: string = 'manual',
  relatedId: string | null = null,
  isTestData: boolean = false
) {
  if (!userId || amount <= 0) return { ok: false, newBalance: 0, error: '잘못된 파라미터' };

  try {
    const { data: prof, error: profErr } = await sb
      .from('profiles')
      .select('clan_point')
      .eq('id', userId)
      .single();

    if (profErr) throw profErr;

    const newBalance = (prof?.clan_point ?? 0) + amount;

    await sb.from('profiles').update({ clan_point: newBalance }).eq('id', userId);

    await sb.from('clanpoint_logs').insert({
      user_id: userId,
      amount,
      reason,
      type,
      balance_after: newBalance,
      related_id: relatedId,
      is_test_data: isTestData,
    });

    await sb.from('notifications').insert({
      user_id: userId,
      title: `✅ 포인트 지급: +${amount.toLocaleString()} CP`,
      message: `${reason}으로 ${amount.toLocaleString()} CP가 지급되었습니다.`,
      is_test_data: isTestData,
      is_test_data_active: isTestData,
    });

    return { ok: true, newBalance, error: null };
  } catch (err: any) {
    console.error('[pointSystem] grantPoints 실패:', err);
    return { ok: false, newBalance: 0, error: err.message || '포인트 지급 실패' };
  }
}

export async function deductPoints(
  sb: SupabaseClient<Database>,
  userId: string,
  amount: number,
  reason: string,
  type: string = 'manual',
  relatedId: string | null = null,
  isTestData: boolean = false
) {
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

    await sb.from('profiles').update({ clan_point: newBalance }).eq('id', userId);

    await sb.from('clanpoint_logs').insert({
      user_id: userId,
      amount: -amount,
      reason,
      type,
      balance_after: newBalance,
      related_id: relatedId,
      is_test_data: isTestData,
    });

    await sb.from('notifications').insert({
      user_id: userId,
      title: `⚠️ 포인트 차감: -${amount.toLocaleString()} CP`,
      message: `${reason}으로 ${amount.toLocaleString()} CP가 차감되었습니다.`,
      is_test_data: isTestData,
      is_test_data_active: isTestData,
    });

    return { ok: true, newBalance, error: null };
  } catch (err: any) {
    console.error('[pointSystem] deductPoints 실패:', err);
    return { ok: false, newBalance: 0, error: err.message || '포인트 차감 실패' };
  }
}

export async function checkAndGrantDailyBonus(
  sb: SupabaseClient<Database>,
  userId: string,
  isTestData: boolean = false
) {
  if (!userId) return { granted: false, amount: 0 };

  try {
    const { data: meta } = await sb
      .from('profile_meta')
      .select('last_daily_bonus_at')
      .eq('user_id', userId)
      .maybeSingle();

    const todayStr = new Date().toISOString().slice(0, 10);

    if (meta?.last_daily_bonus_at === todayStr) {
      return { granted: false, amount: 0 };
    }

    const { error: updateErr } = await sb
      .from('profile_meta')
      .upsert({ user_id: userId, last_daily_bonus_at: todayStr }, { onConflict: 'user_id' });

    if (updateErr) throw updateErr;

    const result = await grantPoints(sb, userId, DAILY_BONUS_AMOUNT, '출석 보상 (일별 첫 로그인)', 'daily_bonus', null, isTestData);
    return { granted: result.ok, amount: DAILY_BONUS_AMOUNT };
  } catch (err: any) {
    console.error('[pointSystem] checkAndGrantDailyBonus 실패:', err.message || err);
    return { granted: false, amount: 0 };
  }
}

export async function grantMatchParticipationBonus(
  sb: SupabaseClient<Database>,
  userId: string,
  matchId: string,
  isTestData: boolean = false
) {
  if (!userId || !matchId) return { ok: false };

  const result = await grantPoints(sb, userId, MATCH_REWARD_AMOUNT, '매치 참여 보상', 'match_reward', matchId, isTestData);
  return { ok: result.ok };
}

export async function grantRankPromotionBonus(
  sb: SupabaseClient<Database>,
  userId: string,
  newRole: string,
  isTestData: boolean = false
) {
  const amount = RANK_BONUS[newRole];
  if (!amount) return { ok: false, amount: 0 };

  const isNew = newRole === 'rookie';
  const reason = isNew ? '신규 클랜원 달성 보상' : `직급 승급 보상 (→ ${newRole})`;
  const type = isNew ? 'new_member' : 'rank_promotion';

  const result = await grantPoints(sb, userId, amount, reason, type, null, isTestData);
  return { ok: result.ok, amount };
}

export async function grantDiscordCheckinBonus(
  sb: SupabaseClient<Database>,
  userId: string,
  isTestData: boolean = false
) {
  if (!userId) return { granted: false, amount: 0, reason: '유저 없음' };

  try {
    const { data: meta } = await sb
      .from('profile_meta')
      .select('last_discord_checkin_at')
      .eq('user_id', userId)
      .maybeSingle();

    const todayStr = new Date().toISOString().slice(0, 10);

    if (meta?.last_discord_checkin_at === todayStr) {
      return { granted: false, amount: 0, reason: '오늘 이미 Discord 출첵 보상을 받았습니다.' };
    }

    const { error: updateErr } = await sb
      .from('profile_meta')
      .upsert({ user_id: userId, last_discord_checkin_at: todayStr }, { onConflict: 'user_id' });

    if (updateErr) throw updateErr;

    const result = await grantPoints(sb, userId, DISCORD_CHECKIN_AMOUNT, 'Discord 서버 접속/출석체크 보상', 'discord_checkin', null, isTestData);
    if (!result.ok) throw new Error(result.error || '포인트 지급 실패');

    return { granted: true, amount: DISCORD_CHECKIN_AMOUNT, reason: 'Discord 출첵 보상 지급 완료' };
  } catch (err: any) {
    console.error('[pointSystem] grantDiscordCheckinBonus 실패:', err);
    return { granted: false, amount: 0, reason: err.message || 'Discord 출첵 보상 실패' };
  }
}