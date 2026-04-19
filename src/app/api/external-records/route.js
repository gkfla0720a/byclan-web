// src/app/api/external-records/route.js
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 여기에 가져오고 싶은 래더 시스템 주소를 넣으세요
    const targetUrl = 'https://byclan.net/ladderSystem/';
    
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const html = await response.text();
    const $ = cheerio.load(html);
    const matches = [];

    // 올려주신 HTML 구조를 바탕으로 데이터를 추출합니다
    $('.rec-match-card').each((index, element) => {
      const matchId = $(element).find('.rec-match-id').contents().first().text().trim();
      const date = $(element).find('.rec-match-date').text().trim();
      
      const teamA_names = $(element).find('.rec-team-a-names').text().replace(/\s+/g, ' ').trim();
      const teamA_score = $(element).find('.score-win, .score-lose').first().text().trim();
      
      const teamB_names = $(element).find('.rec-team-b-names').text().replace(/\s+/g, ' ').trim();
      const teamB_score = $(element).find('.score-win, .score-lose').last().text().trim();

      matches.push({
        matchId,
        date,
        teamA: { names: teamA_names, score: teamA_score },
        teamB: { names: teamB_names, score: teamB_score }
      });
    });

    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}