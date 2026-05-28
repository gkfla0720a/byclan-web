// 파일명: @/types/permissions/checker.ts

import { type UserRole, PermissionAction, isActiveRole, RoleGroup } from '@/types';
import { ROLE_PERMISSIONS } from './role-permissions';
import { loadDevSettings } from './dev-settings';

// 1. 역할 데이터 정상화 및 검증 함수
export const normalizeRole = (role: string | null | undefined): UserRole => {
  if (!role) return 'guest';
  const lowered = role.toLowerCase();

  if (!isActiveRole(lowered)) {
    throw new Error(`[Security Error] 정의되지 않은 불법 역할 데이터가 감지되었습니다: "${role}"`);
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