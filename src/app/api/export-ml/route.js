import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1'; 

    const targetUrl = `https://byclan.net/ladderSystem/?page=records&p=${page}`;
    const response = await fetch(targetUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error("서버 응답 거부");

    const html = await response.text();
    const $ = cheerio.load(html);
    const flatData = []; // 엑셀용 평면 배열

    $('.rec-match-card').each((index, element) => {
      const matchId = $(element).find('.rec-match-id').text().trim().split(' ')[0];
      const date = $(element).find('.rec-match-date').text().trim();
      const teamAScore = parseInt($(element).find('.rec-score-num').first().text().trim());
      const teamBScore = parseInt($(element).find('.rec-score-num').last().text().trim());

      $(element).find('.rec-set-row').each((setIdx, setEl) => {
        const setNumber = $(setEl).find('.rec-set-num').text().trim();
        const mmrChange = $(setEl).find('.rec-mmr-val').text().trim();
        
        // 세트 승패 판별 (A팀 승리인지 B팀 승리인지)
        const isTeamAWin = $(setEl).find('.rec-set-left').hasClass('rec-set-win');

        // A팀 선수들 기록 (엑셀의 1줄)
        $(setEl).find('.rec-set-left .rec-player').each((_, pEl) => {
          flatData.push({
            Match_ID: matchId, Date: date, Set: setNumber,
            Team: 'A', Name: $(pEl).find('.rec-name').text().trim(),
            Race: $(pEl).find('.rec-race').text().trim(),
            Tier: $(pEl).find('.rec-tier-icon').attr('alt'),
            Is_Ace: $(pEl).find('.badge-ace').length > 0 ? 'O' : 'X',
            Win_Loss: isTeamAWin ? '승' : '패',
            MMR_Change: mmrChange
          });
        });

        // B팀 선수들 기록 (엑셀의 1줄)
        $(setEl).find('.rec-set-right .rec-player').each((_, pEl) => {
          flatData.push({
            Match_ID: matchId, Date: date, Set: setNumber,
            Team: 'B', Name: $(pEl).find('.rec-name').text().trim(),
            Race: $(pEl).find('.rec-race').text().trim(),
            Tier: $(pEl).find('.rec-tier-icon').attr('alt'),
            Is_Ace: $(pEl).find('.badge-ace').length > 0 ? 'O' : 'X',
            Win_Loss: !isTeamAWin ? '승' : '패',
            MMR_Change: mmrChange
          });
        });
      });
    });

    return NextResponse.json({ success: true, data: flatData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}