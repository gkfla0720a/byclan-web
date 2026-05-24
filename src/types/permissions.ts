// 파일명: src/types/permissions.ts

import { USER_ROLES } from './primitives';

export const ROLES = USER_ROLES;

export type ActiveRole = (typeof ROLES)[number];

export function isActiveRole(value: string): value is ActiveRole {
  return (ROLES as readonly string[]).includes(value);
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

export const LADDER_MEMBER_ROLES: ActiveRole[] = [
  'rookie',
  'member',
  'veteran',
  'admin',
  'master',
  'developer',
] as const;
