import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 1. 선수별 TrueSkill 점수 가져오기 (실력순 정렬)
    const { data: players } = await supabase
      .from('player_analytics')
      .select('*')
      .order('mu', { ascending: false });

    // 2. 상위 시너지 데이터 가져오기 (승률 높은 순)
    const { data: synergies } = await supabase
      .from('synergy_scores')
      .select('*')
      .order('combined_win_rate', { ascending: false })
      .limit(50); // 상위 50개만 우선 추출

    return NextResponse.json({ 
      success: true, 
      players, 
      synergies 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}