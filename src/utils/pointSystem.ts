// 파일명: src/utils/pointSystem.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types'; // 배럴 파일에서 가져옴

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

    // 🚨 치명적 버그 수정: point_logs -> clanpoint_logs
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

// deductPoints 등 나머지 함수들도 위와 동일하게 sb: SupabaseClient<Database> 타입을 주고
// point_logs를 clanpoint_logs로 변경해 주시면 됩니다! (생략)
