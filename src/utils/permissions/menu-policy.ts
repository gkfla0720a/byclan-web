// 파일명: @/utils/permissions/menu-policy.ts

import { ActiveRole, ROLES } from './types';

const ALL_ROLES: ActiveRole[] = [...ROLES];
const LADDER_MEMBER_ROLES: ActiveRole[] = [
  'rookie',
  'member',
  'elite',
  'admin',
  'master',
  'developer',
];

export const MENU_PERMISSIONS: Record<string, ActiveRole[]> = {
  '가입안내': ALL_ROLES,
  '정회원 전환신청': ['rookie'],
  '개요': ALL_ROLES,
  '클랜원': ALL_ROLES,
  'BY래더': LADDER_MEMBER_ROLES,
  '랭킹': ALL_ROLES,
  '경기기록': ALL_ROLES,
  '외부 레더 랭킹': ALL_ROLES,
  '외부 레더 기록': ALL_ROLES,
  '승률 시뮬레이터': ALL_ROLES,
  'BSL 공지사항': ALL_ROLES,
  'BSL 경기일정 및 결과': ALL_ROLES,
  '토너먼트 공지': ALL_ROLES,
  '진행중인 토너먼트': ALL_ROLES,
  '공지사항': ALL_ROLES,
  '자유게시판': ALL_ROLES,
  '클랜원 소식': ALL_ROLES,
  '포인트 상점': ALL_ROLES,
  '포인트 내역': ALL_ROLES,
  '내 프로필': ALL_ROLES,
  '알림': ALL_ROLES,
  '관리자': ['developer', 'master', 'admin'],
  '가입 심사 관리': ['developer', 'master', 'admin', 'elite'],
  '운영진게시판': ['developer', 'master', 'admin'],
  '클랜원 관리': ['developer', 'master', 'admin'],
  '개발자': ['developer'],
};

export function canAccessMenuByRole(role: ActiveRole, menuPath: string): boolean {
  const allowedRoles = MENU_PERMISSIONS[menuPath] || [];
  return allowedRoles.includes(role);
}