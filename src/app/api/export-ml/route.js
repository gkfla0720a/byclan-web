import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/app/utils/errorLogger';

// 1. Supabase 설정 (환경변수)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // 2. 외부 사이트에서 데이터 긁어오기 (회원님의 원본 로직)
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

    // 🚨 3. [추가된 DB 동기화 로직]
    if (flatData.length > 0) {
      // 💡 [핵심 수정] Match_ID가 같은 선수 데이터들을 하나의 매치로 묶어주기
      const matchGroups = {};
      
      flatData.forEach(item => {
        const id = item.Match_ID;
        // 해당 매치 번호의 방이 없다면 새로 생성
        if (!matchGroups[id]) {
          matchGroups[id] = {
            match_id: id,
            host: "Ladder System",
            match_date: item.Date,
            raw_data: [] // 선수들의 세부 기록을 담을 배열
          };
        }
        // 생성된 방에 선수 데이터 넣기
        matchGroups[id].raw_data.push(item);
      });

      // 묶인 방들을 배열로 변환하여 DB에 쏘기
      const payload = Object.values(matchGroups);

      const { error: dbError } = await supabase
        .from('legacy_matches')
        .upsert(payload, { onConflict: 'match_id' });

      if (dbError) {
        logger.error('DB 저장 실패', dbError);
      }
    }

    // 4. 결과 반환
    return NextResponse.json({ success: true, count: flatData.length, data: flatData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}