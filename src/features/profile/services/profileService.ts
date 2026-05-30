/**
 * Profile Service - DB Operations
 */

import { supabase } from '@/supabase';
import type { Race } from '../types/profile';

/**
 * 프로필 정보 업데이트
 */
export async function updateProfile(
  userId: string,
  data: {
    by_id: string;
    race: Race;
    intro: string;
  }
) {
  const { data: result, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select();

  if (error) throw error;
  if (!result || result.length === 0) {
    throw new Error('데이터가 저장되지 않았습니다. 권한 설정을 확인해주세요.');
  }

  return result;
}

/**
 * 닉네임 중복 확인
 */
export async function checkNicknameDuplicate(byId: string): Promise<boolean> {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('by_id', byId);

  return (count || 0) > 0;
}

/**
 * Discord 연동 해제
 */
export async function unlinkDiscord(profileId: string) {
  const { error } = await supabase
    .from('profile_oauth')
    .update({ discord_id: null })
    .eq('user_id', profileId);

  if (error) throw error;
}

/**
 * Google 연동 해제
 */
export async function unlinkGoogle(profileId: string) {
  const { error } = await supabase
    .from('profile_oauth')
    .update({
      google_sub: null,
      google_email: null,
      google_name: null,
      google_avatar_url: null,
    })
    .eq('user_id', profileId);

  if (error) throw error;
}

/**
 * 이메일 변경 요청
 */
export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

/**
 * 비밀번호 변경
 * 1. 현재 비밀번호로 재인증
 * 2. 새 비밀번호로 변경
 */
export async function updatePassword(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  // 1단계: 현재 비밀번호로 재인증
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (reAuthError) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  // 2단계: 새 비밀번호로 변경
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) throw updateError;
}
