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
 * ■ 사용 방법 (다른 파일에서 import)
 *   import { supabase } from '@/supabase';
 *   const { data, error } = await supabase.from('profiles').select('*');
 *
 * ■ 환경 변수 설정 (.env.local 파일에 아래 값을 넣으세요)
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
 *   (Supabase 대시보드 → 프로젝트 설정 → API 탭에서 확인 가능)
 * =====================================================================
 */

import { createClient } from '@supabase/supabase-js';

// 개발/테스트 전용 폴백 (프로덕션에서는 환경변수 필수)
const FALLBACK_URL = 'https://mmsmedvdwmisewngmuka.supabase.co';
const FALLBACK_KEY = 'sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// env 값 정리(앞뒤 공백 제거)
const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

/**
 * hasExplicitEnv
 * - 환경 변수(.env.local)에 Supabase URL과 KEY가 명시적으로 설정되어 있는지
 *   확인하는 플래그(true/false 값)입니다.
 * - true이면 환경 변수 값을 사용하고, false이면 폴백(기본) 값을 사용합니다.
 */
const hasExplicitEnv = Boolean(envUrl && envKey);

/**
 * supabaseUrl
 * - 실제로 사용할 Supabase 프로젝트 URL입니다.
 * - 환경 변수가 있으면 그것을, 없으면 폴백 값을 사용합니다.
 */
const supabaseUrl = envUrl || (!IS_PRODUCTION ? FALLBACK_URL : '');

/**
 * supabaseKey
 * - 실제로 사용할 Supabase API 키입니다.
 * - 환경 변수가 있으면 그것을, 없으면 폴백 값을 사용합니다.
 */
const supabaseKey = envKey || (!IS_PRODUCTION ? FALLBACK_KEY : '');

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

// 프로덕션에서 환경변수 누락 시 즉시 에러로 알림
if (IS_PRODUCTION && !isSupabaseConfigured) {
  throw new Error(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.'
  );
}

// 개발 환경에서만 fallback 허용 + 1회 경고
if (!isSupabaseConfigured && typeof window !== 'undefined' && !window.__byclanSupabaseFallbackNoticeShown) {
  window.__byclanSupabaseFallbackNoticeShown = true;
  console.warn(
    '[Supabase] 환경변수가 없어 fallback 설정을 사용 중입니다.\n' +
      '.env.local 에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요.'
  );
}

const resolvedUrl = isSupabaseConfigured ? envUrl : FALLBACK_URL;
const resolvedKey = isSupabaseConfigured ? envKey : FALLBACK_KEY;

export const supabase = createClient(resolvedUrl, resolvedKey);
