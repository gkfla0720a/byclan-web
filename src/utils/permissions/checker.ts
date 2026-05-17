// 파일명: @/utils/permissions/checker.ts

import { ActiveRole, PermissionAction, isActiveRole } from './types';
import { ROLE_PERMISSIONS } from './role-permissions';
import { loadDevSettings } from './dev-settings';
import { canAccessMenuByRole } from './menu-policy'; // 있으면 사용, 없으면 기존 MENU_PERMISSIONS 로직 유지

type GroupName = 'developers' | 'management' | 'senior' | 'members';

export function normalizeRole(role: string | null | undefined): ActiveRole {
  if (!role) return 'visitor';
  const lowered = role.toLowerCase();
  return isActiveRole(lowered) ? lowered : 'visitor';
}

export const PermissionChecker = {
  hasPermission: (
    userRole: ActiveRole | string | null | undefined,
    permission: PermissionAction
  ): boolean => {
    const role = normalizeRole(userRole);
    const roleDef = ROLE_PERMISSIONS[role];
    if (!roleDef) return false;

    if (role === 'developer') {
      const devSettings = loadDevSettings();
      if (permission === 'member.approve' && !devSettings.canReviewApplications) return false;
      if (permission === 'member.manage' && !devSettings.canManageMembers) return false;
      if (permission === 'master.delegate' && !devSettings.canDelegateMaster) return false;
      return true;
    }

    return roleDef.permissions.includes(permission);
  },

  hasLevel: (
    userRole: ActiveRole | string | null | undefined,
    requiredLevel: number
  ): boolean => {
    const role = normalizeRole(userRole);
    return ROLE_PERMISSIONS[role].level >= requiredLevel;
  },

  isInGroup: (
    userRole: ActiveRole | string | null | undefined,
    group: GroupName
  ): boolean => {
    const role = normalizeRole(userRole);

    switch (group) {
      case 'developers':
        return role === 'developer';
      case 'management':
        return ['developer', 'master', 'admin'].includes(role);
      case 'senior':
        return ['developer', 'master', 'admin', 'elite'].includes(role);
      case 'members':
        return ['rookie', 'member', 'elite', 'admin', 'master', 'developer'].includes(role);
      default:
        return false;
    }
  },

  canAccessMenu: (
    userRole: ActiveRole | string | null | undefined,
    menuPath: string
  ): boolean => {
    const role = normalizeRole(userRole);
    // 분리된 정책 함수가 있으면 그걸 쓰는 게 더 깔끔
    return canAccessMenuByRole ? canAccessMenuByRole(role, menuPath) : false;
  }
};