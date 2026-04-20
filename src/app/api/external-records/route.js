import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request) {
  try {
    // 1. 프론트엔드에서 몇 페이지를 원하는지 번호를 받습니다. (기본값 1)
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1'; 

    const targetUrl = `https://byclan.net/ladderSystem/?page=records&p=${page}`;
    
    const response = await fetch(targetUrl, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });

    if (!response.ok) throw new Error("서버 응답 거부");

    const html = await response.text();
    const $ = cheerio.load(html);
    const matches = [];

    $('.rec-match-card').each((index, element) => {
      const matchIdText = $(element).find('.rec-match-id').text().trim();
      const matchId = matchIdText.split(' ')[0];
      const host = $(element).find('.rec-match-id span').text().replace('호스트:', '').trim();
      const date = $(element).find('.rec-match-date').text().trim();
      const status = $(element).find('.rec-match-status').text().trim();
      const teamAScore = $(element).find('.rec-score-num').first().text().trim();
      const teamBScore = $(element).find('.rec-score-num').last().text().trim();

      const sets = [];
      $(element).find('.rec-set-row').each((setIdx, setEl) => {
        const setNumber = $(setEl).find('.rec-set-num').text().trim();
        const mmrChange = $(setEl).find('.rec-mmr-val').text().trim();

        const extractPlayers = (sideClass) => {
          const players = [];
          $(setEl).find(sideClass).find('.rec-player').each((pIdx, pEl) => {
            players.push({
              name: $(pEl).find('.rec-name').text().trim(),
              race: $(pEl).find('.rec-race').text().trim(),
              tier: $(pEl).find('.rec-tier-icon').attr('alt'),
              isAce: $(pEl).find('.badge-ace').length > 0
            });
          });
          return players;
        };

        sets.push({
          setNumber, mmrChange,
          teamA: extractPlayers('.rec-set-left'),
          teamB: extractPlayers('.rec-set-right')
        });
      });

      matches.push({ matchId, host, date, status, totalScore: { teamA: teamAScore, teamB: teamBScore }, sets });
    });

    // 해당 페이지에 데이터가 없으면 빈 배열 반환
    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}