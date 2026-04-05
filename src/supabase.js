// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

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
