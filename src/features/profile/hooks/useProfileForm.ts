/**
 * useProfileForm - Profile form state management hook
 */

import { useState, useEffect } from 'react';
import { invalidateCache } from '@/utils/queryCache';
import { checkNicknameDuplicate, updateProfile } from '../services/profileService';
import type { ProfileFormState, Race } from '../types/profile';

interface Profile {
  id: string;
  by_id: string;
  race: Race;
  intro: string;
}

interface User {
  id: string;
}

export function useProfileForm(profile: Profile | null, user: User | null) {
  const [formState, setFormState] = useState<ProfileFormState>({
    clanNameInput: '',
    race: '미지정',
    intro: '',
    isNicknameAvailable: false,
    originalById: profile?.by_id || '',
    isUpdating: false,
  });

  // profile과 user가 준비되었을 때 폼 초기화
  useEffect(() => {
    if (profile && user) {
      queueMicrotask(() => {
        setFormState((prev) => ({
          ...prev,
          race: profile.race || '미지정',
          intro: profile.intro || '',
        }));

        const currentById = profile.by_id || '';
        if (currentById.startsWith('By_')) {
          setFormState((prev) => ({
            ...prev,
            clanNameInput: currentById.replace('By_', ''),
            originalById: currentById,
            isNicknameAvailable: true,
          }));
        }
      });
    }
  }, [profile, user]);

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    setFormState((prev) => ({
      ...prev,
      clanNameInput: cleaned,
      isNicknameAvailable: `By_${cleaned}` === prev.originalById,
    }));
  };

  const checkDuplicate = async () => {
    const { clanNameInput, originalById } = formState;

    if (!clanNameInput) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    const fullNickname = `By_${clanNameInput}`;

    if (fullNickname === originalById) {
      alert('현재 사용 중인 본인의 닉네임입니다.');
      setFormState((prev) => ({ ...prev, isNicknameAvailable: true }));
      return;
    }

    try {
      const isDuplicate = await checkNicknameDuplicate(fullNickname);

      if (isDuplicate) {
        alert(`'${fullNickname}'은(는) 이미 다른 유저가 사용 중입니다.`);
        setFormState((prev) => ({ ...prev, isNicknameAvailable: false }));
      } else {
        alert(`'${fullNickname}'은(는) 사용 가능한 닉네임입니다!`);
        setFormState((prev) => ({ ...prev, isNicknameAvailable: true }));
      }
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async () => {
    const { isNicknameAvailable, clanNameInput, race, intro } = formState;

    if (!isNicknameAvailable) {
      alert('닉네임 중복 확인을 먼저 완료해 주세요.');
      return;
    }

    if (!user) return;

    setFormState((prev) => ({ ...prev, isUpdating: true }));

    try {
      await updateProfile(user.id, {
        by_id: `By_${clanNameInput}`,
        race,
        intro,
      });

      alert('프로필이 성공적으로 업데이트되었습니다.');
      invalidateCache('ranking_board');
    } catch (error) {
      console.error('에러 발생:', error);
      alert('업데이트 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setFormState((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  return {
    formState,
    handleInputChange,
    checkDuplicate,
    handleUpdate,
    setRace: (race: Race) => setFormState((prev) => ({ ...prev, race })),
    setIntro: (intro: string) => setFormState((prev) => ({ ...prev, intro })),
  };
}
