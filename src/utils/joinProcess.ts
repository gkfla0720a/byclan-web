// 파일명: @/utils/joinProcess.ts

/**
* =====================================================================
* 역할  : 클랜 가입 신청 처리 로직을 담당합니다.
*         신규 회원의 가입 신청 데이터를 처리하고 Supabase DB에 저장하는
*         함수를 제공합니다.
*
* ■ 사용 방법
*   import joinProcess from '@/utils/joinProcess';
*   await joinProcess(applicationData);
*
* ■ 관련 DB 테이블
*   - applications: 가입 신청서 정보 저장
*   - profiles: 사용자 프로필 정보
* =====================================================================
*/

import { supabase } from '@/supabase';
import type { Database } from '@/types/supabase';

/**
* joinProcess 함수의 반환 타입을 정의합니다.
* 성공 여부와 메시지, 그리고 오류 발생 시 오류 객체를 포함합니다.
*/

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

interface JoinProcessResult {
  success: boolean;
  message?: string;
  error?: unknown;
}

/**
* 클랜 가입 신청 폼에서 입력받는 데이터의 인터페이스입니다.
* Supabase 'applications' 테이블에 저장될 필드들을 포함합니다.
*/

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


export default async function joinProcess(
  formData: JoinApplicationForm,
  userId?: string
): Promise<JoinProcessResult> {
  try {
    const insertPayload: ApplicationInsert = {
      user_id: userId ?? null,
      race: formData.race,
      tier: formData.tier,
      intro: formData.intro,
      motivation: formData.motivation,
      playtime: formData.playtime,
      phone: formData.phone,
      status: 'pending',
      is_streamer: formData.isStreamer,
      streamer_platform: formData.isStreamer ? (formData.streamerPlatform ?? null) : null,
      streamer_url: formData.isStreamer ? (formData.streamerUrl ?? null) : null,
    };

    // 정제된 insertPayload를 전달하므로 타입 에러가 완벽하게 사라집니다.
    const { error } = await supabase
      .from('applications')
      .insert([insertPayload]);

    if (error) throw error;

    return { success: true, message: '클랜 가입 신청이 성공적으로 처리되었습니다.' };
  } catch (err: unknown) {
    console.error('[joinProcess] 예상치 못한 오류 발생:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : '예상치 못한 오류가 발생했습니다.',
      error: err
    };
  }
}