// 파일명: @/utils/permissions/checker.ts

import { ActiveRole, PermissionAction, isActiveRole, RoleGroup } from './types';
import { ROLE_PERMISSIONS } from './role-permissions';
import { loadDevSettings } from './dev-settings';


export function normalizeRole(role: string | null | undefined): ActiveRole {
  if (!role) return 'guest';
  const lowered = role.toLowerCase();
  if (!isActiveRole(lowered)) {
    throw new Error(`[Security Error] 정의되지 않은 불법 역할 데이터가 감지되었습니다: "${role}"`);
  }
  return lowered;
}

export function hasPermission(userRole: ActiveRole,permission: PermissionAction): boolean {
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

// ✅ 수정 후 — 안전장치 추가 + 스타일 통일
export function hasLevel(userRole: ActiveRole, requiredLevel: number): boolean {
  const roleDef = ROLE_PERMISSIONS[userRole];
  if (!roleDef) return false;
  return roleDef.level >= requiredLevel;
};

export function isInGroup (userRole: ActiveRole, group: RoleGroup): boolean {
  switch (group) {
    case 'developer':
      return userRole === 'developer';
    case 'management':
      return ['developer', 'master', 'admin'].includes(userRole);
    case 'senior':
      return ['developer', 'master', 'admin', 'elite'].includes(userRole);
    case 'members':
      return ['rookie', 'member', 'elite', 'admin', 'master', 'developer'].includes(userRole);
    case 'others':
      return ['guest', 'banned', 'applicant'].includes(userRole);
    default: {
      const _exhaustiveCheck: never = group;
      throw new Error(`[Type Error] 처리되지 않은 새로운 롤 그룹이 존재합니다: ${_exhaustiveCheck}`);
    }
  }
};