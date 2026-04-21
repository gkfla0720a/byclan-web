import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 마스터 키 권장
);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET() {
  try {
    // 1. DB에서 가장 최근에 업데이트된 기록 하나를 가져와 시간을 확인합니다.
    const { data: lastRecord } = await supabase
      .from('latest_rankings')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const lastUpdate = lastRecord ? new Date(lastRecord.updated_at) : new Date(0);
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    // 2. 마지막 업데이트 후 24시간이 지났거나 데이터가 없는 경우에만 외부 서버 호출
    if (hoursSinceUpdate >= 24) {
      console.log("⏳ 데이터가 오래되어 새로 수집을 시작합니다...");
      
      const targetUrl = `https://byclan.net/ladderSystem/?page=ranking`;
      const response = await fetch(targetUrl, { 
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await response.text();
      const regex = /var\s+RANK_DATA\s*=\s*(\[\s*\{.*?\}\s*\]);/s;
      const match = html.match(regex);
      const rawData = JSON.parse(match[1]);

      // Supabase 업데이트
      await supabase.from('latest_rankings').upsert(
        rawData.map(r => ({
          nick: r.nick,
          mmr: r.mmr,
          totalmmr: r.totalmmr,
          wc: r.wc,
          ppp: r.ppp,
          ppt: r.ppt,
          ppz: r.ppz,
          pzt: r.pzt,
          other: r.other,
          race: r.ztpr,
          updated_at: new Date()
        })),
        { onConflict: 'nick' }
      );

      return NextResponse.json({ success: true, source: 'external', data: rawData });
    }

    // 3. 24시간이 지나지 않았다면 DB에서 바로 데이터를 꺼내 반환 (서버 부하 제로)
    console.log("✅ 신선한 데이터가 DB에 있어 즉시 반환합니다.");
    const { data: cachedData } = await supabase
      .from('latest_rankings')
      .select('*')
      .order('totalmmr', { ascending: false });

    return NextResponse.json({ success: true, source: 'database', data: cachedData });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}