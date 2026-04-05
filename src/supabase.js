// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

// [개발 메모] 아래 하드코딩된 폴백 값(fallbackSupabaseUrl, fallbackSupabaseKey)은
// 개발·테스트 단계에서만 임시로 공개된 설정입니다.
// 프로덕션 배포 전에 .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과
// NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 이 폴백 값은 제거할 예정입니다.
// 참고: .env.example 파일에 필요한 환경변수 목록이 정리되어 있습니다.
const fallbackSupabaseUrl = 'https://mmsmedvdwmisewngmuka.supabase.co';
const fallbackSupabaseKey = 'sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK';
const hasExplicitEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 환경 변수에서 Supabase 설정을 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseKey;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!hasExplicitEnv && typeof window !== 'undefined' && !window.__byclanSupabaseFallbackNoticeShown) {
  // 개발 중 콘솔을 과도하게 오염시키지 않도록 한 번만 안내합니다.
  window.__byclanSupabaseFallbackNoticeShown = true;
  console.info('Supabase fallback configuration is active. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to override it.');
}

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey);
