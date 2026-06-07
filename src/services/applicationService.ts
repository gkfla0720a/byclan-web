// 파일명: src/services/applicationService.ts
import { supabase } from '@/supabase';
import type { Database } from '@/types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

export interface JoinApplicationForm {
  user_id: string;
  race: string | null;
  tier: string | null;
  intro: string | null;
  motivation: string | null;
  playtime: string | null;
  phone: string | null;
  isStreamer: boolean;
  streamerPlatform?: string | null;
  streamerUrl?: string | null;
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/**
 * 필드의 최대 글자 수를 검증합니다.
 * 개선: text가 없는 경우(null, undefined)를 안전하게 방지합니다.
 */
function validateLength(text: string | null | undefined, fieldName: string, max: number): void {
  if (!text) return; // 검사할 텍스트가 없으면 통과
  if (text.length > max) {
    throw new Error(`${fieldName}은(는) 최대 ${max}자까지 입력할 수 있습니다. (현재 ${text.length}자)`);
  }
}

/**
 * 휴대폰 번호 형식을 정규식으로 검증합니다.
 */
function validatePhone(phone: string | null): void {
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

    // 1. 신청서 데이터 저장
    const { error } = await supabase.from('applications').insert([payload]);
    if (error) throw error;

    // 2. 프로필 역할 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'applicant' })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    return { success: true };
  } catch (error: any) {
    // 개선: error가 객체이고 message 속성이 있는지 안전하게 확인합니다.
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[applicationService] submitApplication 실패:', errorMessage);
    return { success: false, error: errorMessage };
  }
}