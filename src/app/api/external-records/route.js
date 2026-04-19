import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// 🚨 사내망/보안망 SSL 인증서 우회 코드 (추가된 부분)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ⏳ 사람인 척 쉬어주는 딜레이 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
  try {
    const allMatches = [];
    const lastPageToFetch = 3; 

    for (let p = 1; p <= lastPageToFetch; p++) {
      const targetUrl = `https://byclan.net/ladderSystem/?page=records&p=${p}`;
      
      const response = await fetch(targetUrl, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      if (!response.ok) {
        console.warn(`[경고] ${p}페이지에서 차단되었습니다. (상태 코드: ${response.status})`);
        break; 
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $('.rec-match-card').each((index, element) => {
        const matchId = $(element).find('.rec-match-id').contents().first().text().trim();
        const date = $(element).find('.rec-match-date').text().trim();
        
        const teamA_names = $(element).find('.rec-team-a-names').text().replace(/\s+/g, ' ').trim();
        const teamA_score = $(element).find('.score-win, .score-lose').first().text().trim();
        
        const teamB_names = $(element).find('.rec-team-b-names').text().replace(/\s+/g, ' ').trim();
        const teamB_score = $(element).find('.score-win, .score-lose').last().text().trim();

        allMatches.push({
          matchId,
          date,
          teamA: { names: teamA_names, score: teamA_score },
          teamB: { names: teamB_names, score: teamB_score }
        });
      });

      if (p < lastPageToFetch) {
        await delay(1000); 
      }
    }

    if (allMatches.length === 0) {
      throw new Error("서버에서 데이터를 가져오지 못했습니다. (데이터 0건)");
    }

    return NextResponse.json({ success: true, data: allMatches });
  } catch (error) {
    console.error("스크래핑 에러 상세정보:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}