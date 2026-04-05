// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정을 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // 빌드 타임 SSR에서는 환경변수가 없을 수 있음 – 클라이언트 런타임에서만 경고
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not set. Some features may not work.');
  }
}

// Supabase 클라이언트 초기화 (env가 없으면 플레이스홀더 사용)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
