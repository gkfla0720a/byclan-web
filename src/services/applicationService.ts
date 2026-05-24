// 파일명: src/services/applicationService.ts

import { supabase } from '@/supabase';
import type { Database } from '@/types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

export interface JoinApplicationForm {
  race: string;
  tier: string;
  intro: string;
  motivation: string;
  playtime: string;
  phone: string;
  isStreamer: boolean;
  streamerPlatform?: string;
  streamerUrl?: string;
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// 최대 글자 수를 매개변수로 받도록 유틸 함수를 개선했습니다.
function validateLength(text: string, fieldName: string, max: number) {
  if (text && text.length > max) {
    throw new Error(`${fieldName}은(는) ${max}자 이하로 작성해주세요.`);
  }
}

export async function submitApplication(userId: string, data: JoinApplicationForm) {
  try {
    // 🚨 요청하신 대로 글자 수 제한을 차등 적용합니다.
    validateLength(data.intro, '자기소개', 200);
    validateLength(data.motivation, '가입 동기', 50);
    validateLength(data.playtime, '활동 시간대', 50);

    const payload: ApplicationInsert = {
      user_id: userId,
      race: data.race,
      tier: data.tier,
      intro: data.intro,
      motivation: data.motivation,
      playtime: data.playtime,
      phone: data.phone,
      status: 'pending',
      is_streamer: data.isStreamer,
      streamer_platform: data.isStreamer ? (data.streamerPlatform || null) : null,
      streamer_url: data.isStreamer ? (data.streamerUrl || null) : null,
    };

    const { error } = await supabase.from('applications').insert([payload]);
    if (error) throw error;

    await supabase.from('profiles').update({ role: 'applicant' }).eq('id', userId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}