// 파일명: @/utils/joinProcess.ts

/**
* =====================================================================
* 파일명: src/utils/joinProcess.ts
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

 /**
 * joinProcess 함수의 반환 타입을 정의합니다.
 * 성공 여부와 메시지, 그리고 오류 발생 시 오류 객체를 포함합니다.
 */
interface JoinProcessResult {
  success: boolean;
  message?: string;
  error?: any;
}

/**
* 클랜 가입 신청 폼에서 입력받는 데이터의 인터페이스입니다.
* Supabase 'applications' 테이블에 저장될 필드들을 포함합니다.
*/

interface JoinApplicationData {
  btag: string;
  race: string;
  tier: string;
  intro: string;
  motivation: string;
  playtime: string;
  phone: string;
  isStreamer: boolean;
  [key: string]: any; // 향후 추가될 수 있는 필드를 위해 any를 허용합니다.
}

// Full content from commit e61fbf9f3a256c64d2887611819ebda6565975a8
/**
* joinProcess(data)
* - 클랜 가입 신청 데이터를 처리하는 메인 함수입니다.
* - Supabase의 applications 테이블에 신청 정보를 저장합니다.
*
* 매개변수:
*   data: 가입 신청 폼에서 입력받은 데이터 객체
*         (btag, race, tier, intro, motivation, playtime, phone, isStreamer 등 포함)
*         Discord 정보는 폼에 포함되지 않으며, 프로필에서 디스코드 연동 시 자동 저장됩니다.
*
* 반환값: 처리 결과 (성공/실패 정보)
*/

async function joinProcess(data: JoinApplicationData): Promise<JoinProcessResult> {
  try {
    // Supabase 클라이언트(supabase)를 사용하여 'applications' 테이블에 데이터를 삽입합니다.
    const { error } = await supabase
    .from('applications') // 'applications' 테이블 지정
    .insert([data]);     // 전달받은 데이터 객체를 삽입

  if (error) {
    console.error('클랜 가입 신청 실패:', error);
    return { success: false, message: '클랜 가입 신청 처리 중 오류가 발생했습니다.', error: error };
  }

  return { success: true, message: '클랜 가입 신청이 성공적으로 처리되었습니다.' };

  } catch (err) {
    console.error('예상치 못한 오류 발생:', err);
    return { success: false, message: '예상치 못한 오류가 발생했습니다.', error: err };
  }
}

export default joinProcess;