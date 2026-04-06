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

// -----------------------------------------------------------------------
// [개발 메모] 아래 하드코딩된 폴백 값(fallbackSupabaseUrl, fallbackSupabaseKey)은
// 개발·테스트 단계에서만 임시로 공개된 설정입니다.
// 프로덕션 배포 전에 .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과
// NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 이 폴백 값은 제거할 예정입니다.
// 참고: .env.example 파일에 필요한 환경변수 목록이 정리되어 있습니다.
// -----------------------------------------------------------------------

/**
 * fallbackSupabaseUrl
 * - .env.local에 URL이 없을 때 사용하는 기본 Supabase 프로젝트 주소입니다.
 * - 개발 환경 전용이며, 실제 서비스 배포 시에는 환경 변수로 대체해야 합니다.
 */
const fallbackSupabaseUrl = 'https://mmsmedvdwmisewngmuka.supabase.co';

/**
 * fallbackSupabaseKey
 * - .env.local에 키가 없을 때 사용하는 기본 Supabase 공개 API 키입니다.
 * - 이 키는 "anon(익명)" 키로, 공개해도 되는 수준의 읽기 전용 접근 키입니다.
 *   (실제 민감 데이터는 RLS 정책으로 보호합니다)
 */
const fallbackSupabaseKey = 'sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK';

/**
 * hasExplicitEnv
 * - 환경 변수(.env.local)에 Supabase URL과 KEY가 명시적으로 설정되어 있는지
 *   확인하는 플래그(true/false 값)입니다.
 * - true이면 환경 변수 값을 사용하고, false이면 폴백(기본) 값을 사용합니다.
 */
const hasExplicitEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * supabaseUrl
 * - 실제로 사용할 Supabase 프로젝트 URL입니다.
 * - 환경 변수가 있으면 그것을, 없으면 폴백 값을 사용합니다.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;

/**
 * supabaseKey
 * - 실제로 사용할 Supabase API 키입니다.
 * - 환경 변수가 있으면 그것을, 없으면 폴백 값을 사용합니다.
 */
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseKey;

/**
 * isSupabaseConfigured
 * - Supabase URL과 KEY가 모두 설정되어 있는지 확인하는 값입니다.
 * - true면 DB 연결 가능, false면 연결 불가 상태입니다.
 * - 다른 파일에서 DB 접근 전에 이 값을 확인해 안전하게 처리합니다.
 *
 * 사용 예시:
 *   if (!isSupabaseConfigured) { console.warn('DB 설정이 안 되어 있습니다'); }
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// 환경 변수 없이 폴백 값으로 동작 중일 때, 브라우저 콘솔에 경고를 한 번만 출력합니다.
// window.__byclanSupabaseFallbackNoticeShown 플래그를 이용해 중복 출력을 방지합니다.
if (!hasExplicitEnv && typeof window !== 'undefined' && !window.__byclanSupabaseFallbackNoticeShown) {
  // 개발 중 콘솔을 과도하게 오염시키지 않도록 한 번만 안내합니다.
  window.__byclanSupabaseFallbackNoticeShown = true;
  console.info('Supabase fallback configuration is active. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to override it.');
}

/**
 * supabase
 * - 프로젝트 전체에서 사용하는 Supabase 클라이언트(연결 객체)입니다.
 * - 이 객체로 데이터 조회(select), 삽입(insert), 수정(update), 삭제(delete),
 *   로그인/로그아웃 등 모든 백엔드 작업을 수행합니다.
 *
 * 사용 예시:
 *   // 프로필 목록 조회
 *   const { data, error } = await supabase.from('profiles').select('*');
 *
 *   // Discord 로그인
 *   await supabase.auth.signInWithOAuth({ provider: 'discord' });
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
