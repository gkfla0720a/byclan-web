import { NextResponse } from 'next/server';

// 보안망 우회
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET() {
  try {
    // 1. 랭킹 페이지 HTML 가져오기
    const targetUrl = `https://byclan.net/ladderSystem/?page=ranking`;
    const response = await fetch(targetUrl, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error("서버가 응답을 거부했습니다.");
    }

    const html = await response.text();

    // 2. 엑셀의 Text.PositionOf 와 같은 역할 (정규 표현식 사용)
    // "var RANK_DATA = " 부터 "];" 까지의 문자열을 캡처합니다.
    const regex = /var\s+RANK_DATA\s*=\s*(\[\s*\{.*?\}\s*\]);/s;
    const match = html.match(regex);

    if (!match || !match[1]) {
      throw new Error("HTML 내에서 RANK_DATA 변수를 찾을 수 없습니다.");
    }

    // 3. 추출한 순수 텍스트(String)를 완벽한 자바스크립트 객체(JSON)로 변환
    const rawData = JSON.parse(match[1]);

    // 4. 추출 성공! 화면으로 데이터 전달
    return NextResponse.json({ success: true, count: rawData.length, data: rawData });

  } catch (error) {
    console.error("데이터 추출 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}