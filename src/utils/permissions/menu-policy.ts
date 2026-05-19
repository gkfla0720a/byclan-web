// 파일명: @/utils/permissions/menu-policy.ts

import { ROLE_PERMISSIONS } from './role-permissions';
import { ActiveRole, PermissionAction, ROLES } from './types';

type MenuPolicy = {
  requiredPermission: PermissionAction;
  allowedRoles?: ActiveRole[];
};

export const MENU_POLICY: Record<string, MenuPolicy> = {
  '가입안내': { requiredPermission: 'clan.info' },
  '정회원 전환신청': {
    requiredPermission: 'application.track',
    allowedRoles: ['rookie'],
  },
  '개요': { requiredPermission: 'clan.info' },
  '클랜원': { requiredPermission: 'clan.info' },
  'BY래더': { requiredPermission: 'ladder.play' },
  '랭킹': { requiredPermission: 'match.view' },
  '경기기록': { requiredPermission: 'match.view' },
  '외부 레더 랭킹': { requiredPermission: 'match.view' },
  '외부 레더 기록': { requiredPermission: 'match.view' },
  '승률 시뮬레이터': { requiredPermission: 'match.view' },
  'BSL 공지사항': { requiredPermission: 'community.view' },
  'BSL 경기일정 및 결과': { requiredPermission: 'match.view' },
  '토너먼트 공지': { requiredPermission: 'community.view' },
  '진행중인 토너먼트': { requiredPermission: 'tournament.join' },
  '공지사항': { requiredPermission: 'community.view' },
  '자유게시판': { requiredPermission: 'community.view' },
  '클랜원 소식': { requiredPermission: 'community.view' },
  '포인트 상점': { requiredPermission: 'profile.view' },
  '포인트 내역': { requiredPermission: 'profile.view' },
  '내 프로필': { requiredPermission: 'profile.view' },
  '알림': { requiredPermission: 'profile.view' },
  '관리자': { requiredPermission: 'clan.admin' },
  '가입 심사 관리': { requiredPermission: 'member.approve' },
  '운영진게시판': { requiredPermission: 'announcement.post' },
  '클랜원 관리': { requiredPermission: 'member.manage' },
  '개발자': { requiredPermission: 'system.admin' },
};

export function canAccessMenuByRole(role: ActiveRole, menuPath: string): boolean {
  const policy = MENU_POLICY[menuPath];
  if (!policy) return false;

  const hasPermission = ROLE_PERMISSIONS[role].permissions.includes(policy.requiredPermission);
  const isAllowedRole = policy.allowedRoles ? policy.allowedRoles.includes(role) : true;

  return hasPermission && isAllowedRole;
}

export const MENU_PERMISSIONS: Record<string, ActiveRole[]> = Object.fromEntries(
  Object.entries(MENU_POLICY).map(([menuPath, policy]) => {
    const allowed = ROLES.filter((role) => canAccessMenuByRole(role, menuPath));
    return [menuPath, allowed];
  })
);
