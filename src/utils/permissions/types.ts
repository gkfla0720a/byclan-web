// 파일명: @/utils/permissions/types.ts

export const ROLES = [
  'expelled',
  'visitor',
  'applicant',
  'rookie',
  'member',
  'elite',
  'admin',
  'master',
  'developer',
] as const; // 역할은 고정된 문자열 집합으로 정의, 타입 안전성 확보

export type ActiveRole = typeof ROLES[number]; // ActiveRole은 ROLES 배열의 요소 중 하나로 제한, 타입 안전성 확보

export function isActiveRole(value: string): value is ActiveRole {
  return (ROLES as readonly string[]).includes(value);
}

export type PermissionAction = typeof PERMISSIONS[number]; // PermissionAction은 PERMISSIONS 배열의 요소 중 하나로 제한, 타입 안전성 확보

export const PERMISSIONS = [
  'application.submit',
  'transfer.submit',
  'tournament.create',
  'tournament.join',
  'ladder.admin',
  'ladder.moderate',
  'ladder.play',
  'match.manage',
  'match.host',
  'match.join',
  'match.view',
  'announcement.post',
  'announcement.edit',
  'community.post',
  'community.view',
  'community.comment',
  'profile.edit',
  'profile.view',
  'system.admin',
  'database.modify',
  'code.deploy',
  'user.manage_all',
  'clan.admin_all',
  'clan.admin',
  'member.approve',
  'member.manage',
  'member.test',
  'master.delegate',
] as const;

export interface RoleDefinition {
  name: string;
  description: string;
  level: number;
  permissions: PermissionAction[];
  color: string;
  icon: string;
}

export const ROLE_GROUPS = ['developer', 'management', 'senior', 'members', 'others'] as const;

export type RoleGroup = typeof ROLE_GROUPS[number];

export const LADDER_MEMBER_ROLES: ActiveRole[] = [
  'rookie',
  'member',
  'elite',
  'admin',
  'master',
  'developer',
] as const;
