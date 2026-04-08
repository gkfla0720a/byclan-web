/**
 * =====================================================================
 * 파일명: src/supabase.js
 * 역할  : Supabase 데이터베이스 클라이언트(연결 객체)를 초기화하고 내보냅니다.
 *
 * ■ Supabase란?
 *   - PostgreSQL 기반의 클라우드 데이터베이스 서비스입니다.
 *   - 회원 인증(Auth), 데이터 저장(Database), 실시간 구독(Realtime) 등을
 *     하나의 서비스로 제공합니다.
 *   - 이 파일에서 만든 `supabase` 객체를 import해서 DB 쿼리, 로그인 등을
 *     처리합니다.
 *
 * ■ 환경 변수 설정 (프로젝트 루트의 .env.local 파일에 아래 값을 넣으세요)
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
 *   (Supabase 대시보드 → 프로젝트 설정 → API 탭에서 확인 가능)
 *   템플릿: .env.example 파일 참고
 * =====================================================================
 */

import { createClient } from '@supabase/supabase-js';

// env 값 정리(앞뒤 공백 제거)
const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

/**
 * isSupabaseConfigured
 * - Supabase URL과 KEY가 모두 설정되어 있는지 확인하는 값입니다.
 * - true면 DB 연결 가능, false면 연결 불가 상태입니다.
 * - 다른 파일에서 DB 접근 전에 이 값을 확인해 안전하게 처리합니다.
 *
 * 사용 예시:
 *   if (!isSupabaseConfigured) { console.warn('DB 설정이 안 되어 있습니다'); }
 */
export const isSupabaseConfigured = Boolean(envUrl && envKey);

// 환경변수 누락 시 명확한 경고 메시지 출력
// ※ 모듈 로드 시점에 throw 하면 SSR/빌드가 중단되므로 console.error 로만 알립니다.
//   실제 DB 요청은 isSupabaseConfigured 를 확인한 뒤에만 수행하므로 런타임 오류는
//   자연스럽게 방지됩니다.
if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.\n' +
    '.env.local 파일에 두 값을 설정하세요. 템플릿은 .env.example 을 참고하세요.'
  );
}

// 환경변수가 없으면 더미 값으로 클라이언트를 생성합니다.
// 실제 요청은 isSupabaseConfigured 가 true 일 때만 이루어집니다.
export const supabase = createClient(
  envUrl || 'https://placeholder.supabase.co',
  envKey || 'placeholder-key'
);
