import { supabase } from '@/supabase';

/**
 * URL을 정규화합니다. http(s):// 없으면 https://를 앞에 붙입니다.
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/**
 * 클랜 가입 신청서를 Supabase에 제출하고 프로필 역할을 applicant로 변경합니다.
 * streamer 컬럼 미존재 시 해당 필드를 제외하고 재시도합니다.
 *
 * @param {string} userId - 현재 로그인 사용자의 UUID
 * @param {object} applicationData - 신청서 폼 데이터
 * @param {string} applicationData.btag - 배틀태그
 * @param {string} applicationData.race - 주력 종족
 * @param {string} applicationData.tier - 현재 티어
 * @param {string} applicationData.intro - 자기소개
 * @param {string} applicationData.motivation - 가입 동기
 * @param {string} applicationData.playtime - 주 활동 시간대
 * @param {string} applicationData.phone - 연락처
 * @param {boolean} applicationData.isStreamer - 스트리머 여부
 * @param {string} [applicationData.streamerPlatform] - 방송 플랫폼
 * @param {string} [applicationData.streamerUrl] - 방송 URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitApplication(userId, applicationData) {
  try {
    const applicationPayload = {
      user_id: userId,
      btag: applicationData.btag,
      race: applicationData.race,
      tier: applicationData.tier,
      intro: applicationData.intro,
      motivation: applicationData.motivation,
      playtime: applicationData.playtime,
      phone: applicationData.phone,
      status: 'pending',
      is_streamer: applicationData.isStreamer,
      streamer_platform: applicationData.isStreamer ? applicationData.streamerPlatform : null,
      streamer_url: applicationData.isStreamer ? normalizeUrl(applicationData.streamerUrl) : null,
    };

    let { error: appError } = await supabase
      .from('applications')
      .insert(applicationPayload);

    if (appError) {
      const message = `${appError.message || ''} ${appError.details || ''}`;
      if (appError.code === '42703' || message.includes('does not exist')) {
        ({ error: appError } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
            btag: applicationData.btag,
            race: applicationData.race,
            tier: applicationData.tier,
            intro: applicationData.intro,
            phone: applicationData.phone,
            status: 'pending',
          }));
      }
    }

    if (appError) {
      console.warn('applications 테이블 오류:', appError.message);
    }

    let { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'applicant' })
      .eq('id', userId);

    await supabase.from('profile_meta').upsert({
      user_id: userId,
      is_streamer: applicationData.isStreamer,
      streamer_platform: applicationData.isStreamer ? applicationData.streamerPlatform : null,
      streamer_url: applicationData.isStreamer ? normalizeUrl(applicationData.streamerUrl) : null,
    }, { onConflict: 'user_id' });

    if (profileError) {
      const message = `${profileError.message || ''} ${profileError.details || ''}`;
      if (profileError.code === '42703' || message.includes('does not exist')) {
        ({ error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'applicant' })
          .eq('id', userId));
      }
    }

    if (profileError) throw profileError;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
