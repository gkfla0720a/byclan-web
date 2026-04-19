// src/app/api/external-records/route.js
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allMatches = [];
    // 최신 1페이지부터 3페이지까지 데이터를 수집합니다 (숫자를 조절해 양을 정하세요)
    const lastPageToFetch = 3; 

    for (let p = 1; p <= lastPageToFetch; p++) {
      const targetUrl = `https://byclan.net/ladderSystem/?page=records&p=${p}`;
      const response = await fetch(targetUrl, { cache: 'no-store' });
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
    }

    return NextResponse.json({ success: true, data: allMatches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}