// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정을 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// 여기서 딱 한 번만 Supabase를 초기화(생성)합니다.
export const supabase = createClient(supabaseUrl, supabaseKey);
