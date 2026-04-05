// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://mmsmedvdwmisewngmuka.supabase.co';
const fallbackSupabaseKey = 'sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK';

// 환경 변수에서 Supabase 설정을 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseKey;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && typeof window !== 'undefined') {
  // 환경변수가 없으면 fallback 설정을 사용 중임을 알립니다.
  console.warn('Supabase environment variables are not set. Using fallback Supabase configuration.');
}

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey);
