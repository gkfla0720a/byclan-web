// 파일명: src/utils/permissions/menu-policy.ts
import { ActiveRole, ROLES, LADDER_MEMBER_ROLES } from '@/types/permissions';
import type { MenuName } from '@/hooks/useNavigate';

const ALL_ROLES: ActiveRole[] = [...ROLES];

// 🌟 여기서 Record<MenuName, ActiveRole[]> 를 사용하면,
// MenuName 사전에 있는 모든 메뉴가 100% 빠짐없이 적혀 있어야만 에러가 안 납니다!
export const MENU_PERMISSIONS: Record<MenuName, ActiveRole[]> = {
  'Home': ALL_ROLES,
  '가입안내': ALL_ROLES,
  '정회원 전환신청': ['rookie'],
  '개요': ALL_ROLES,
  '클랜원': ALL_ROLES,
  'BY래더': LADDER_MEMBER_ROLES,
  '랭킹': ALL_ROLES,
  '경기기록': ALL_ROLES,
  'BSL 공지사항': ALL_ROLES,
  'BSL 경기일정 및 결과': ALL_ROLES,
  '토너먼트 공지': ALL_ROLES,
  '진행중인 토너먼트': ALL_ROLES,
  '공지사항': ALL_ROLES,
  '자유게시판': ALL_ROLES,
  '포인트 상점': ALL_ROLES,
  '포인트 내역': ALL_ROLES,
  '알림': ALL_ROLES,
  '내 프로필': ALL_ROLES,
  '운영진게시판': ['developer', 'master', 'admin'],
  '가입 심사 관리': ['developer', 'master', 'admin', 'veteran'],
  '클랜원 관리': ['developer', 'master', 'admin'],
  '경기 관리': ['developer', 'master', 'admin'],
  '래더/경기 운영': ['developer', 'master', 'admin'],
  '콘텐츠 관리': ['developer', 'master', 'admin'],
  '관리설정': ['developer', 'master', 'admin'],
  '개발자': ['developer'],
  '로그인': ALL_ROLES,
};

// 여기도 MenuName으로 타입을 깐깐하게 지정합니다.
export function canAccessMenu(role: ActiveRole, menuPath: MenuName): boolean {
  const allowedRoles = MENU_PERMISSIONS[menuPath] || [];
  return allowedRoles.includes(role);
}