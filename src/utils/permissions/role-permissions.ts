// 파일명: @/utils/permissions/role-permissions.ts

import { ActiveRole, PermissionAction, RoleDefinition, } from './types';

const PUBLIC_PERMS: PermissionAction[] = [
  'match.view',
  'community.view',
  'profile.edit',
  'profile.view',
];

const APPLICANT_PERMS: PermissionAction[] = [
  ...PUBLIC_PERMS,
  'application.submit',
];

const ROOKIE_PERMS: PermissionAction[] = [
  ...PUBLIC_PERMS,
  'community.comment',
  'community.post',
  'tournament.join',
  'ladder.play',
  'match.join',
  'transfer.submit',
];

const MEMBER_PERMS: PermissionAction[] = [
  ...PUBLIC_PERMS,
  'community.comment',
  'community.post',
  'tournament.join',
  'ladder.play',
  'match.join',
  'match.host',
];

const ELITE_PERMS: PermissionAction[] = [
  ...MEMBER_PERMS,
  'member.approve',
  'member.test',
  'tournament.create',
  'ladder.admin',
  'ladder.moderate',
  'match.manage',
];

const ADMIN_PERMS: PermissionAction[] = [
  ...ELITE_PERMS,
  'user.manage_all',
  'clan.admin_all',
  'clan.admin',
  'member.manage',
  'announcement.post',
  'announcement.edit',
];

const MASTER_PERMS: PermissionAction[] = [
  ...ADMIN_PERMS,
  'master.delegate',
];

const DEVELOPER_PERMS: PermissionAction[] = [
  ...MASTER_PERMS,
  'system.admin',
  'database.modify',
  'code.deploy',
];

export const ROLE_PERMISSIONS = {
  developer: {
    name: '개발자',
    description: '시스템 개발 및 유지보수',
    level: 100,
    permissions: DEVELOPER_PERMS,
    color: '#FF6B6B',
    icon: '👨‍💻',
  },
  master: {
    name: '마스터',
    description: '클랜 총괄 운영',
    level: 90,
    permissions: MASTER_PERMS,
    color: '#FFD93D',
    icon: '👑',
  },
  admin: {
    name: '관리자',
    description: '클랜 일반 운영',
    level: 80,
    permissions: ADMIN_PERMS,
    color: '#6BCF7F',
    icon: '🛡️',
  },
  elite: {
    name: '정예',
    description: '클랜 정예 멤버',
    level: 60,
    permissions: ELITE_PERMS,
    color: '#4ECDC4',
    icon: '⭐',
  },
  member: {
    name: '일반 클랜원',
    description: '정식 일반 클랜원',
    level: 50,
    permissions: MEMBER_PERMS,
    color: '#60A5FA',
    icon: '🛡️',
  },
  rookie: {
    name: '신입 길드원',
    description: '클랜 신규 멤버 (2주 활동 기간)',
    level: 35,
    permissions: ROOKIE_PERMS,
    color: '#DDA0DD',
    icon: '🆕',
  },
  applicant: {
    name: '신규 가입자',
    description: '클랜 가입 신청자 (테스트 신청 및 대기)',
    level: 25,
    permissions: APPLICANT_PERMS,
    color: '#F0E68C',
    icon: '📝',
  },
  visitor: {
    name: '방문자',
    description: '클랜 방문자 (비로그인 상태)',
    level: 10,
    permissions: PUBLIC_PERMS,
    color: '#C7CEEA',
    icon: '👤',
  },
  expelled: {
    name: '추방자',
    description: '클랜 규칙 위반 또는 운영진 결정으로 제명된 사용자',
    level: 0,
    permissions: [], // 👈 아무 권한도 배열에 넣지 않음
    color: '#9CA3AF',
    icon: '🚫',
  },
} satisfies Record<ActiveRole, RoleDefinition>;