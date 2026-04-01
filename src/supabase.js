// src/supabase.js 파일의 내용

import { createClient } from '@supabase/supabase-js';

// 본인의 Supabase 프로젝트 URL과 API 키를 문자열 안에 넣으세요.
const supabaseUrl = 'https://mmsmedvdwmisewngmuka.supabase.co';
const supabaseKey = 'sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK';

// 여기서 딱 한 번만 Supabase를 초기화(생성)합니다.
export const supabase = createClient(supabaseUrl, supabaseKey);
