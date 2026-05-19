// 파일명: src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import type { AuthProfile as UserProfile } from '@/types/domain';
import { ROLE_PERMISSIONS, normalizeRole, PermissionChecker } from '@/utils/permissions';
import { useAuthSession } from './useAuthSession';
import { useProfileData } from './useProfileData';
import { useAuthStore } from '@/stores/useAuthStore';

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
  canAccessMenu: (menuPath: string) => boolean;
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
  const { user, sessionLoading } = useAuthSession();

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

  // 4. 권한 계산 (PermissionChecker 활용)
  const getPermissions = (): AuthPermissions => {
    const userRole = profile?.role || (user ? 'visitor' : undefined);
    const effectiveRole = normalizeRole(userRole);
    const roleInfo = ROLE_PERMISSIONS[effectiveRole];
  
    return {
      isDeveloper: effectiveRole === 'developer',
      isManagement: PermissionChecker.isInGroup(userRole, 'management'),
      isSenior: PermissionChecker.isInGroup(userRole, 'senior'),
      isMember: PermissionChecker.isInGroup(userRole, 'members'),
      level: roleInfo.level,
      roleInfo,
      can: {
        manageUsers: PermissionChecker.hasPermission(userRole, 'user.manage_all'),
        manageClan: PermissionChecker.hasPermission(userRole, 'clan.admin'),
        approveMembers: PermissionChecker.hasPermission(userRole, 'member.approve'),
        manageMatches: PermissionChecker.hasPermission(userRole, 'match.manage'),
        hostMatches: PermissionChecker.hasPermission(userRole, 'match.host'),
        postAnnouncements: PermissionChecker.hasPermission(userRole, 'announcement.post'),
        accessDevTools: PermissionChecker.hasPermission(userRole, 'system.admin'),
        moderateLadder: PermissionChecker.hasPermission(userRole, 'ladder.admin'),
        playLadder: PermissionChecker.hasPermission(userRole, 'ladder.play'),
      },
      canAccessMenu: (menuPath: string) => PermissionChecker.canAccessMenu(userRole, menuPath),
      hasLevel: (requiredLevel: number) => PermissionChecker.hasLevel(userRole, requiredLevel),
    };
  };

  // 기존 컴포넌트들과의 호환성을 유지하기 위한 래퍼(Wrapper) 함수들
  const handleAuthSuccess = () => {}; // useAuthSession에서 자동 감지하므로 비워둡니다.
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
    setUser: () => {}, // 강제로 덮어씌우는 로직 방지용 더미
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
