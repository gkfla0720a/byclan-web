/**
 * MyProfile - Refactored wrapper component
 * 기존 MyProfile 컴포넌트는 ProfileContainer로 이동되었습니다.
 * 이 파일은 하위호환성을 유지하기 위한 래퍼입니다.
 * @see src/features/profile/components/ProfileContainer.tsx
 */

'use client';

import { ProfileContainer } from '@/features/profile';

/**
 * MyProfile - Wrapper for ProfileContainer
 * 기존 호환성을 위해 여전히 MyProfile로 import 가능합니다.
 */
export default function MyProfile() {
  return <ProfileContainer />;
}
