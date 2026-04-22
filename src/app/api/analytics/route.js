import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/app/utils/errorLogger';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.critical('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 1. 선수 데이터 가져오기 (에러 객체인 pError를 받아옵니다)
    const { data: players, error: pError } = await supabase
      .from('player_analytics')
      .select('*')
      .order('mu', { ascending: false });

    if (pError) {
      logger.error('player_analytics 조회 에러', pError, { details: pError.details });
    }

    // 2. 시너지 데이터 가져오기 (에러 객체인 sError를 받아옵니다)
    const { data: synergies, error: sError } = await supabase
      .from('synergy_scores')
      .select('*')
      .order('combined_win_rate', { ascending: false })
      .limit(50);

    if (sError) {
      logger.error('synergy_scores 조회 에러', sError, { details: sError.details });
    }

    // 데이터가 null일 경우 빈 배열([])을 기본값으로 반환하도록 보정
    return NextResponse.json({ 
      success: true, 
      players: players || [], 
      synergies: synergies || [],
      errorCount: (pError ? 1 : 0) + (sError ? 1 : 0) // 에러 발생 여부 체크용
    });

  } catch (error) {
    logger.critical('API 경로 내부 치명적 에러', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}