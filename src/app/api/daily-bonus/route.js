process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAndGrantDailyBonus } from '@/app/utils/pointSystem';

// 서버 전용 마스터 클라이언트 생성
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, isTestData } = await request.json();
    
    // 마스터 권한으로 포인트 함수 실행
    const result = await checkAndGrantDailyBonus(supabaseAdmin, userId, isTestData);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ granted: false, error: error.message }, { status: 500 });
  }
}