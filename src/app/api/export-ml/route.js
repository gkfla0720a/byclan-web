import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // 설치 필요: npm install @supabase/supabase-js

// Supabase 설정 (환경변수 권장)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 쓰기 권한이 있는 키 권장
);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastId = parseInt(searchParams.get('last_id') || '0', 10);
    
    // ... (기존 파싱 로직을 통해 flatData 배열 생성) ...
    // let flatData = [...]; 

    if (flatData.length > 0) {
      // 🚨 [DB 동기화] 수집된 데이터를 Supabase legacy_matches 테이블에 저장
      // match_id가 중복되면 무시(upsert)하도록 처리
      const { error: dbError } = await supabase
        .from('legacy_matches')
        .upsert(
          flatData.map(d => ({
            match_id: d.Match_ID,
            host: "Ladder System",
            match_date: d.Date,
            raw_data: d // 전체 객체를 JSONB 컬럼에 저장
          })),
          { onConflict: 'match_id' }
        );

      if (dbError) console.error("DB 저장 실패:", dbError.message);
    }

    // 엑셀 매크로는 이 결과를 받아 시트에 추가합니다.
    return NextResponse.json({ success: true, count: flatData.length, data: flatData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}