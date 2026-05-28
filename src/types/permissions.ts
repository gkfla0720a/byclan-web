// 파일명: src/types/permissions.ts

import { USER_ROLES, USER_ROLE_LIST, type UserRole } from './primitives';

export const isActiveRole = (value: string): value is UserRole => {
  return USER_ROLE_LIST.includes(value as any);
}

export type PermissionAction = (typeof PERMISSIONS)[number];

export const PERMISSIONS = [
  'home.view',
  'dashboard.view',
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

export const LADDER_MEMBER_ROLES: UserRole[] = [
  USER_ROLES.ROOKIE,
  USER_ROLES.MEMBER,
  USER_ROLES.VETERAN,
  USER_ROLES.ADMIN,
  USER_ROLES.MASTER,
  USER_ROLES.DEVELOPER,
];