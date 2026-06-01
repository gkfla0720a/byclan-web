// 파일명: @/types/permissions/checker.ts

import logger from '@/utils/errorLogger';
import { type UserRole, PermissionAction, isActiveRole, RoleGroup } from '@/types';
import { ROLE_PERMISSIONS } from './role-permissions';
import { loadDevSettings } from './dev-settings';

// 엄격한 버전 - 보안 검사용 (서버/관리자 로직에서 사용)
export const normalizeRoleStrict = (role: string | null | undefined): UserRole => {
  if (!role) return 'guest';
  const lowered = role.toLowerCase();
  if (!isActiveRole(lowered)) {
    throw new Error(`[Security Error] 정의되지 않은 역할: "${role}"`);
  }
  return lowered as UserRole;
};

// 안전한 버전 - UI 렌더링용 (컴포넌트/훅에서 사용)
export const normalizeRole = (role: string | null | undefined): UserRole => {
  if (!role) return 'guest';
  const lowered = role.toLowerCase();
  if (!isActiveRole(lowered)) {
    logger.captureException(
      new Error(`[normalizeRole] 알 수 없는 역할: "${role}"`),
      { severity: 'error' }
    );
    return 'guest'; // UI는 죽이지 않고 기록만
  }
  return lowered as UserRole;
};

// 2. 특정 권한을 가지고 있는지 체크하는 함수
export const hasPermission = (userRole: UserRole, permission: PermissionAction): boolean => {
  const roleDef = ROLE_PERMISSIONS[userRole];
  if (!roleDef) return false;

  if (userRole === 'developer') {
    const devSettings = loadDevSettings();
    if (permission === 'member.approve' && !devSettings.canReviewApplications) return false;
    if (permission === 'member.manage' && !devSettings.canManageMembers) return false;
    if (permission === 'master.delegate' && !devSettings.canDelegateMaster) return false;
    return true;
  }

  return roleDef.permissions.includes(permission);
};


// 3. 최소 권한 레벨을 만족하는지 체크하는 함수
export const hasLevel = (userRole: UserRole, requiredLevel: number): boolean => {
  const roleDef = ROLE_PERMISSIONS[userRole];
  if (!roleDef) return false;
  return roleDef.level >= requiredLevel;
};

// 4. 유저가 특정 그룹(운영진, 정식멤버 등)에 속하는지 체크하는 함수
export const isInGroup = (userRole: UserRole, group: RoleGroup): boolean => {
  switch (group) {
    case 'developer':
      return userRole === 'developer';
    case 'management':
      return ['developer', 'master', 'admin'].includes(userRole);
    case 'senior':
      return ['developer', 'master', 'admin', 'veteran'].includes(userRole);
    case 'members':
      return ['rookie', 'member', 'veteran', 'admin', 'master', 'developer'].includes(userRole);
    case 'others':
      return ['guest', 'banned', 'applicant', 'ghost'].includes(userRole);
    default: {
      const _exhaustiveCheck: never = group;
      throw new Error(`[Type Error] 처리되지 않은 새로운 롤 그룹이 존재합니다: ${_exhaustiveCheck}`);
    }
  }
};