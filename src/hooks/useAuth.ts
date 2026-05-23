// 파일명: src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import type { AuthProfile as UserProfile } from '@/types/domain';
import { ROLE_PERMISSIONS, normalizeRole, hasPermission, hasLevel, isInGroup, canAccessMenu } from '@/utils/permissions';
import { useAuthSession } from './useAuthSession';
import { useProfileData } from './useProfileData';
import { useAuthStore } from '@/stores/useAuthStore';
import type { MenuName } from '@/hooks/useNavigate';

// ─── Types ────────────────────────────────────────────────────────────────────
export type { UserProfile };

export interface AuthPermissions {
  isDeveloper: boolean;
  isManagement: boolean;
  isSenior: boolean;
  isMember: boolean;
  level: number;
  roleInfo: Record<string, unknown> | null;
  can: {
    manageUsers: boolean;
    manageClan: boolean;
    approveMembers: boolean;
    manageMatches: boolean;
    hostMatches: boolean;
    postAnnouncements: boolean;
    accessDevTools: boolean;
    moderateLadder: boolean;
    playLadder: boolean;
  };
  canAccessMenu: (menuPath: MenuName) => boolean;
  hasLevel: (requiredLevel: number) => boolean;
}

export interface UseAuthReturn {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activeMatchId: string | null;
  setActiveMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  needsSetup: boolean;
  setNeedsSetup: React.Dispatch<React.SetStateAction<boolean>>;
  needsByIdSetup: boolean;
  authLoading: boolean;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  getPermissions: () => AuthPermissions;
  handleAuthSuccess: (authUser: User) => void;
  handleSetupComplete: () => void;
  reloadProfile: () => Promise<void>;
}

// ─── Main Hook (컨트롤 타워) ──────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  // 1. 순수 인증 상태 담당 (로그인 정보)
  const { user, setUser, sessionLoading } = useAuthSession();

  // 2. 무거운 DB 데이터 담당 (프로필, 래더 점수 등)
  const { profile, setProfile, profileLoading, needsByIdSetup, reloadProfile } = useProfileData(user);

  // 3. UI 및 부가 기능 상태들
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 💡 종합 로딩 상태: 세션이나 프로필 둘 중 하나라도 로딩 중이면 화면에 로딩 표시
  const authLoading = sessionLoading || profileLoading;

  // 에러 메시지는 4초 후 자동 삭제
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), 4000);
    return () => clearTimeout(timer);
  }, [authError]);

  useEffect(() => {
    useAuthStore.getState().setAuthSnapshot({
      user,
      profile,
      authLoading,
      authError,
    });
  }, [user, profile, authLoading, authError]);

  // 4. 권한 계산 (hasPermission 활용)
  const getPermissions = (): AuthPermissions => {
    const userRole = profile?.role || (user ? 'visitor' : undefined);
    const effectiveRole = normalizeRole(userRole);
    const roleInfo = ROLE_PERMISSIONS[effectiveRole];
  
    return {
      isDeveloper: effectiveRole === 'developer',
      isManagement: isInGroup(effectiveRole, 'management'),
      isSenior: isInGroup(effectiveRole, 'senior'),
      isMember: isInGroup(effectiveRole, 'members'),
      level: roleInfo.level,
      roleInfo,
      can: {
        manageUsers: hasPermission(effectiveRole, 'user.manage_all'),
        manageClan: hasPermission(effectiveRole, 'clan.admin'),
        approveMembers: hasPermission(effectiveRole, 'member.approve'),
        manageMatches: hasPermission(effectiveRole, 'match.manage'),
        hostMatches: hasPermission(effectiveRole, 'match.host'),
        postAnnouncements: hasPermission(effectiveRole, 'announcement.post'),
        accessDevTools: hasPermission(effectiveRole, 'system.admin'),
        moderateLadder: hasPermission(effectiveRole, 'ladder.admin'),
        playLadder: hasPermission(effectiveRole, 'ladder.play'),
      },
      canAccessMenu: (menuPath: MenuName) => canAccessMenu(effectiveRole, menuPath),
      hasLevel: (requiredLevel: number) => hasLevel(effectiveRole, requiredLevel),
    };
  };

  // 기존 컴포넌트들과의 호환성을 유지하기 위한 래퍼(Wrapper) 함수들
  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
  };
  const handleSetupComplete = () => {
    setNeedsSetup(false);
    reloadProfile();
  };

  return {
    profile,
    setProfile,
    activeMatchId,
    setActiveMatchId,
    user,
    setUser,
    needsSetup,
    setNeedsSetup,
    needsByIdSetup,
    authLoading,
    authError,
    setAuthError,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete,
    reloadProfile,
  };
}
