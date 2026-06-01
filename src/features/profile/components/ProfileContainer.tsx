/**
 * ProfileContainer - Profile 페이지 메인 컨테이너
 * 상태 관리 및 모든 서브 컴포넌트 조합
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { extractAccountIdFromAuthUser, isInternalAuthEmail } from '@/utils/accountId';
import { isMarkedTestAccount } from '@/utils/testData';
import { useNavigate } from '@/hooks/useNavigate';
import { ProfileInfoForm } from './ProfileInfoForm';
import { SocialConnections } from './SocialConnections';
import { ProfileSidebar } from './ProfileSidebar';
import { AccountSecurity } from './AccountSecurity';
import { useProfileForm } from '../hooks/useProfileForm';
import type { LinkMessage } from '../types/profile';

const ROLE_LABELS = {
  developer: '👨‍💻 시스템 개발자',
  master: '👑 클랜 마스터',
  admin: '🛠️ 운영진',
  veteran: '⚔️ 베테랑 클랜원',
  member: '🛡️ 일반 클랜원',
  rookie: '🌱 신입 클랜원',
  applicant: '📝 신규 가입자',
  guest: '👤 방문자',
};

interface SocialLinkingState {
  discord: boolean;
  google: boolean;
}

export function ProfileContainer() {
  const router = useRouter();
  const navigateTo = useNavigate();
  const { profile, user, reloadProfile, authLoading } = useAuthContext();

  // 형태 상태
  const profileForm = useProfileForm(profile, user);

  // 소셜 연동 상태
  const [socialLinking, setSocialLinking] = useState<SocialLinkingState>({
    discord: false,
    google: false,
  });
  const [linkMessage, setLinkMessage] = useState<LinkMessage | null>(null);

  // 계정 정보 상태
  const [authEmail, setAuthEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [usesInternalLogin, setUsesInternalLogin] = useState(false);

  // URL 파라미터에서 소셜 연동 결과 읽기
  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const linked = params.get('linked');
      const errorParam = params.get('error');

      if (linked === 'discord') {
        setLinkMessage({
          type: 'success',
          text: 'Discord 계정이 성공적으로 연동되었습니다.',
        });
      } else if (linked === 'google') {
        setLinkMessage({
          type: 'success',
          text: 'Google 계정이 성공적으로 연동되었습니다.',
        });
      } else if (errorParam === 'discord_conflict') {
        setLinkMessage({
          type: 'error',
          text: '이 Discord 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정에서 연동을 먼저 해제해주세요.',
        });
      } else if (errorParam === 'google_conflict') {
        setLinkMessage({
          type: 'error',
          text: '이 Google 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정에서 연동을 먼저 해제해주세요.',
        });
      } else if (errorParam === 'link_failed') {
        setLinkMessage({
          type: 'error',
          text: '소셜 계정 연동에 실패했습니다. 다시 시도해주세요.',
        });
      }

      if (linked || errorParam) {
        const url = new URL(window.location.href);
        url.searchParams.delete('linked');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      }
    });
  }, []);

  // profile과 user가 준비되었을 때 계정 정보 업데이트
  useEffect(() => {
    if (profile && user) {
      queueMicrotask(() => {
        setAuthEmail(user.email || '');
        setUsesInternalLogin(isInternalAuthEmail(user.email || ''));
        setAccountId(extractAccountIdFromAuthUser(user, profile));
      });
    }
  }, [profile, user]);

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="text-center py-24 text-gray-500 font-mono animate-pulse">
        인증 정보를 확인하는 중입니다...
      </div>
    );
  }

  // 프로필 없음
  if (!profile || !user) {
    return <div className="text-center py-24 text-red-500">프로필 정보를 찾을 수 없습니다.</div>;
  }

  const currentRole = profile.role || 'guest';
  const isDeveloper = currentRole === 'developer';
  const userRoleLabel = ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS] || `👤 방문자 (${currentRole})`;

  return (
    <div className="w-full py-8 px-4 animate-fade-in font-sans relative">
      {/* 개발자 콘솔 버튼 */}
      {isDeveloper && (
        <button
          onClick={() => navigateTo('개발자')}
          className="absolute top-8 right-4 text-yellow-600 hover:text-yellow-400 p-2 hover:rotate-90 transition-all duration-300"
          title="시스템 개발자 콘솔 진입"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* 헤더 */}
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-white">내 프로필 설정</h2>
        <p className="text-yellow-500 font-bold mt-1 tracking-tight">{userRoleLabel} 모드로 접속 중</p>
        {isMarkedTestAccount(profile) && (
          <p className="text-xs text-amber-300 mt-2">
            TEST ACCOUNT: 개발자 콘솔에서 언제든지 on/off 할 수 있는 테스트 계정입니다.
          </p>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 섹션: 폼 */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileInfoForm
            formState={profileForm.formState}
            onInputChange={profileForm.handleInputChange}
            onCheckDuplicate={profileForm.checkDuplicate}
            onRaceChange={profileForm.setRace}
            onIntroChange={profileForm.setIntro}
            onUpdate={profileForm.handleUpdate}
          />

          <div className="bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl">
            <SocialConnections
              profile={profile}
              linkMessage={linkMessage}
              discordLinking={socialLinking.discord}
              googleLinking={socialLinking.google}
              onReloadProfile={reloadProfile}
            />
          </div>
        </div>

        {/* 오른쪽 섹션: 사이드바 */}
        <div>
          <ProfileSidebar profile={profile} />
        </div>
      </div>

      {/* 계정 보안 섹션 */}
      <AccountSecurity
        authEmail={authEmail}
        usesInternalLogin={usesInternalLogin}
        accountId={accountId}
      />
    </div>
  );
}
