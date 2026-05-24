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

/**
 * 필드의 최대 글자 수를 검증합니다.
 */
function validateLength(text: string, fieldName: string, max: number): void {
  if (text && text.length > max) {
    throw new Error(`${fieldName}은(는) 최대 ${max}자까지 입력할 수 있습니다. (현재 ${text.length}자)`);
  }
}

/**
 * 휴대폰 번호 형식을 정규식으로 검증합니다. (예: 010-1234-5678 또는 01012345678)
 */
function validatePhone(phone: string): void {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phone || !phoneRegex.test(phone)) {
    throw new Error('올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)');
  }
}

export async function submitApplication(userId: string, data: JoinApplicationForm) {
  try {
    // 🚨 엄격한 프론트엔드 유효성 검증
    if (!data.race || data.race === '미지정') throw new Error('주력 종족을 선택해주세요.');
    if (!data.tier) throw new Error('현재 티어를 입력해주세요.');

    validatePhone(data.phone);
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
      streamer_url: data.isStreamer ? normalizeUrl(data.streamerUrl) : null,
    };

    // 정제된 타입 기반 저장 체계 실행
    const { error } = await supabase.from('applications').insert([payload]);
    if (error) throw error;

    // 프로필 역할 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'applicant' })
      .eq('id', userId);

    if (profileError) throw profileError;

    return { success: true };
  } catch (error: any) {
    console.error('[applicationService] submitApplication 실패:', error.message);
    return { success: false, error: error.message };
  }
}