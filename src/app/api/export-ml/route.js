import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastId = parseInt(searchParams.get('last_id') || '0', 10);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    const flatData = [];
    let p = pageParam;
    let keepFetching = true;
    let pagesFetched = 0;
    
    // 핵심: last_id가 있으면 최대 10페이지까지 연속 스캔, page 번호만 있으면 딱 1페이지만 추출
    const maxPagesToFetch = lastId > 0 ? 10 : 1;

    while (keepFetching && pagesFetched < maxPagesToFetch) {
      const targetUrl = `https://byclan.net/ladderSystem/?page=records&p=${p}`;
      const response = await fetch(targetUrl, { 
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) throw new Error("서버 응답 거부");

      const html = await response.text();
      const $ = cheerio.load(html);
      const matchCards = $('.rec-match-card');
      if (matchCards.length === 0) break;

      let shouldStop = false;

      matchCards.each((index, element) => {
        if (shouldStop) return false;

        const matchIdStr = $(element).find('.rec-match-id').text().trim().split(' ')[0];
        const currentId = parseInt(matchIdStr.replace('#', ''), 10);

        // 엑셀에 있는 ID와 만나면 즉시 파싱 중단 (매크로 전용)
        if (lastId > 0 && currentId <= lastId) {
          shouldStop = true;
          keepFetching = false;
          return false;
        }

        const date = $(element).find('.rec-match-date').text().trim();
        const isTeamAWin = $(element).find('.rec-set-left').hasClass('rec-set-win');

        $(element).find('.rec-set-row').each((setIdx, setEl) => {
          const setNumber = $(setEl).find('.rec-set-num').text().trim();
          const mmrChange = $(setEl).find('.rec-mmr-val').text().trim();

          const extractPlayers = (sideClass, teamName, isWin) => {
            $(setEl).find(sideClass + ' .rec-player').each((_, pEl) => {
              flatData.push({ Match_ID: matchIdStr, Date: date, Set: setNumber, Team: teamName, Name: $(pEl).find('.rec-name').text().trim(), Race: $(pEl).find('.rec-race').text().trim(), Tier: $(pEl).find('.rec-tier-icon').attr('alt'), Is_Ace: $(pEl).find('.badge-ace').length > 0 ? 'O' : 'X', Win_Loss: isWin ? '승' : '패', MMR_Change: mmrChange });
            });
          };

          extractPlayers('.rec-set-left', 'A', isTeamAWin);
          extractPlayers('.rec-set-right', 'B', !isTeamAWin);
        });
      });

      pagesFetched++;
      if (keepFetching && pagesFetched < maxPagesToFetch) {
        p++;
        await delay(1000); // 연속 스캔 시 서버 보호용 딜레이
      }
    }

    return NextResponse.json({ success: true, count: flatData.length, data: flatData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}