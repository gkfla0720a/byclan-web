
/**
 * =====================================================================
 * 파일명: src/utils/permissions.ts
 * 역할  : ByClan 클랜의 역할(Role) 체계와 권한(Permission) 시스템을 정의합니다.
 *
 * ■ 역할 구조 (높은 레벨 = 더 많은 권한)
 *   developer(100) > master(90) > admin(80) > elite(60)
 *   > member(50) > rookie(35) > applicant(25) > visitor(10)
 *
 * ■ 주요 개념
 *   - ROLE_PERMISSIONS: 각 역할별로 허용된 권한 목록을 정의한 객체
 *   - PermissionChecker: 권한 확인 유틸리티 함수 모음
 *   - DEV_SETTINGS: 개발자 전용 설정 (localStorage에 저장/불러오기)
 *   - DELEGATION_RULES: 권한 위임 규칙 (누가 누구에게 어떤 권한을 줄 수 있는지)
 *   - ROLE_CHANGE_RULES: 역할 승격/강등 경로 및 조건
 *
 * ■ 사용 방법 (다른 파일에서 import)
 *   import { PermissionChecker, ROLE_PERMISSIONS } from '@/utils/permissions';
 *   const canPlay = PermissionChecker.hasPermission('elite', 'ladder.play'); // true
 * =====================================================================
 */

import { UserRole } from '@/types/domain';

// 권한 시스템 명확화
// ByClan 클랜 역할별 접근 제어 정의

/**
 * DEV_SETTINGS
 * - 개발자(developer) 역할에게 적용되는 특수 설정 기본값입니다.
 * - 실제 설정값은 localStorage의 'byclan_dev_settings' 키에 저장됩니다.
 * - DevSettingsPanel 컴포넌트에서 UI로 변경 가능합니다.
 */

// 1. 개발자 설정 타입 정의
export interface DevSettings {
  homeGateEnabled: boolean;
  canReviewApplications: boolean;
  canManageMembers: boolean;
  canDelegateMaster: boolean;
}

export const DEV_SETTINGS: DevSettings = {
  homeGateEnabled: true,
  canReviewApplications: true,
  canManageMembers: true,
  canDelegateMaster: true
};

/**
 * loadDevSettings()
 * - localStorage에 저장된 개발자 설정을 불러옵니다.
 * - 저장된 값이 없으면 DEV_SETTINGS 기본값을 반환합니다.
 * - 스프레드 연산자(...)로 기본값과 저장값을 합쳐 반환합니다.
 *
 * 반환값: DEV_SETTINGS 형태의 객체
 */

export const loadDevSettings = () => {
  try {
    const saved = localStorage.getItem('byclan_dev_settings');
    return saved ? { ...DEV_SETTINGS, ...JSON.parse(saved) } : DEV_SETTINGS;
  } catch {
    return DEV_SETTINGS;
  }
};

// 역할 목록 단일 소스
export const ROLES = [
  'visitor',
  'applicant',
  'rookie',
  'member',
  'elite',
  'admin',
  'master',
  'developer',
] as const;

export type ActiveRole = typeof ROLES[number];

// 권한 목록 단일 소스
export const PERMISSIONS = [
  'system.admin', 'database.modify', 'code.deploy', 'user.manage_all',
  'clan.admin_all', 'clan.admin', 'member.approve', 'member.manage',
  'member.test', 'member.mentor', 'master.delegate', 'tournament.create',
  'tournament.join', 'ladder.admin', 'ladder.moderate', 'ladder.play',
  'match.manage', 'match.host', 'match.join', 'match.view',
  'announcement.post', 'announcement.edit', 'community.post',
  'community.view', 'community.comment', 'profile.edit',
  'profile.view', 'clan.info', 'application.submit', 'application.track',
  'discord.required',
] as const;

export type PermissionAction = typeof PERMISSIONS[number];


// 3. 역할별 정보 구조 정의
export interface RoleDefinition {
  name: string;
  description: string;
  level: number;
  permissions: PermissionAction[];
  color: string;
  icon: string;
}

// ============================================================================
// [2]. 권한 그룹 정의 (상속 구조)
// ============================================================================

// 방문자
const PUBLIC_PERMS: PermissionAction[] = [
  'match.view', 'community.view', 'profile.edit', 'profile.view', 'clan.info'
];

// 가입 신청자 (고유 권한: application.submit, application.track)
const APPLICANT_PERMS: PermissionAction[] = [
  ...PUBLIC_PERMS,
  'application.submit', 'application.track'
];

// 정식 멤버 기본 권한 (rookie, member 공통)
const MEMBER_PERMS: PermissionAction[] = [
  ...PUBLIC_PERMS,
  'community.comment', 'community.post',
  'tournament.join', 'ladder.play', 'match.host', 'match.join'
];

// 정예(elite) 권한 = 멤버 권한 모두 포함(+) + 관리 일부
const ELITE_PERMS: PermissionAction[] = [
  ...MEMBER_PERMS,
  'member.approve', 'member.test', 'member.mentor',
  'tournament.create', 'ladder.admin', 'ladder.moderate', 'match.manage'
];

// 관리자(admin) 권한 = 정예 권한 모두 포함(+) + 클랜 운영
const ADMIN_PERMS: PermissionAction[] = [
  ...ELITE_PERMS,
  'user.manage_all', 'clan.admin_all', 'clan.admin', 'member.manage',
  'announcement.post', 'announcement.edit'
];

// 마스터(master) 권한 = 관리자 권한 모두 포함(+) + 마스터 위임
const MASTER_PERMS: PermissionAction[] = [
  ...ADMIN_PERMS,
  'master.delegate'
];

// 개발자(developer) 권한 = 마스터 권한 모두 포함(+) + 시스템 접근
const DEVELOPER_PERMS: PermissionAction[] = [
  ...MASTER_PERMS,
  'system.admin', 'database.modify', 'code.deploy'
];

// ============================================================================
// [3]. 역할(Role)에 권한 매핑
// ============================================================================

export const ROLE_PERMISSIONS = {
  developer: {
    name: '개발자',
    description: '시스템 개발 및 유지보수',
    level: 100,
    permissions: DEVELOPER_PERMS,
    color: '#FF6B6B',
    icon: '👨‍💻'
  },
  master: {
    name: '마스터',
    description: '클랜 총괄 운영',
    level: 90,
    permissions: MASTER_PERMS,
    color: '#FFD93D',
    icon: '👑'
  },
  admin: {
    name: '관리자',
    description: '클랜 일반 운영',
    level: 80,
    permissions: ADMIN_PERMS,
    color: '#6BCF7F',
    icon: '🛡️'
  },
  elite: {
    name: '정예',
    description: '클랜 정예 멤버',
    level: 60,
    permissions: ELITE_PERMS,
    color: '#4ECDC4',
    icon: '⭐'
  },
  member: {
    name: '일반 클랜원',
    description: '정식 일반 클랜원',
    level: 50,
    permissions: MEMBER_PERMS,
    color: '#60A5FA',
    icon: '🛡️'
  },
  rookie: {
    name: '신입 길드원',
    description: '클랜 신규 멤버 (2주 활동 기간)',
    level: 35,
    permissions: MEMBER_PERMS,
    color: '#DDA0DD',
    icon: '🆕'
  },
  applicant: {
    name: '신규 가입자',
    description: '클랜 가입 신청자 (테스트 신청 및 대기)',
    level: 25,
    permissions: APPLICANT_PERMS,
    color: '#F0E68C',
    icon: '📝'
  },
  visitor: {
    name: '방문자',
    description: '클랜 방문자 (비로그인 상태)',
    level: 10,
    permissions: PUBLIC_PERMS,
    color: '#C7CEEA',
    icon: '👤'
  }
} satisfies Record<ActiveRole, RoleDefinition>;

const ALL_ROLES: ActiveRole[] = [...ROLES];
const LADDER_MEMBER_ROLES: ActiveRole[] = [
  'rookie',
  'member',
  'elite',
  'admin',
  'master',
  'developer',
];

const MENU_PERMISSIONS: Record<string, ActiveRole[]> = {
  '가입안내': ALL_ROLES,
  '정회원 전환신청': ['rookie'], // 신입 클랜원만 접근 가능
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

/**
 * PermissionChecker
 * - 역할 기반 권한 확인 유틸리티 객체입니다.
 */
export const PermissionChecker = {
  /**
   * 특정 역할이 특정 권한을 가지고 있는지 확인합니다.
   */
  hasPermission: (userRole: ActiveRole | undefined | null, permission: PermissionAction): boolean => {
    // 1. 유효하지 않은 역할이 들어오면 안전하게 false 반환 (방어 코드)
    if (!userRole) return false;
    
    const role = ROLE_PERMISSIONS[userRole];
    if (!role) return false;
    
    // 2. 개발자인 경우 추가 설정 확인 (테스트 목적으로 제한 적용 가능)
    if (userRole === 'developer') {
      // loadDevSettings가 없거나 실패할 경우를 대비해 빈 객체(|| {}) 처리
      const devSettings = (typeof loadDevSettings === 'function' ? loadDevSettings() : null) || {};
      
      if (permission === 'member.approve' && !devSettings.canReviewApplications) return false;
      if (permission === 'member.manage' && !devSettings.canManageMembers) return false;
      if (permission === 'master.delegate' && !devSettings.canDelegateMaster) return false;

      return true; // 제약 조건에 걸리지 않은 모든 권한 오픈
    }
    
    return role.permissions.includes(permission);
  },

  /**
   * 특정 역할의 레벨이 요구 레벨 이상인지 확인합니다.
   */
  hasLevel: (userRole: ActiveRole | undefined | null, requiredLevel: number): boolean => {
    if (!userRole) return false;
    const role = ROLE_PERMISSIONS[userRole];
    return role ? role.level >= requiredLevel : false;
  },

  /**
   * 역할이 특정 그룹에 속하는지 확인합니다.
   */
  isInGroup: (userRole: ActiveRole, group: 'developers' | 'management' | 'senior' | 'members'): boolean => {
    switch (group) {
      case 'developers':
        return userRole === 'developer';
      case 'management':
        return ['developer', 'master', 'admin'].includes(userRole);
      case 'senior':
        return ['developer', 'master', 'admin', 'elite'].includes(userRole);
      case 'members':
        // 기존 하드코딩 배열 대신 미리 만들어둔 최상단 배열을 재사용하여 깔끔하게 정리
        return LADDER_MEMBER_ROLES.includes(userRole);
      default:
        return false;
    }
  },

  /**
   * 특정 역할이 특정 메뉴에 접근 가능한지 확인합니다.
   */
  canAccessMenu: (userRole: ActiveRole | undefined | null, menuPath: string): boolean => {
    // 비로그인 사용자나 유효하지 않은 경우 'visitor' 수준으로 간주
    const effectiveRole: ActiveRole = userRole || 'visitor';
    
    // 외부로 뺀 MENU_PERMISSIONS에서 안전하게 배열을 가져옴
    const allowedRoles = MENU_PERMISSIONS[menuPath] || [];
    return allowedRoles.includes(effectiveRole);
  }
};

// ============================================================================
// 규칙 객체들 (데이터 구조가 명확하므로 readonly를 붙여 안전하게 관리해도 좋습니다)
// ============================================================================

export const DELEGATION_RULES = {
  master_to_admin: ['member.approve', 'match.manage', 'ladder.moderate'] as PermissionAction[],
  admin_to_elite: ['member.approve'] as PermissionAction[],
  developer_override: true
} as const;

export const ROLE_CHANGE_RULES = {
  promotion_paths: {
    applicant: ['rookie'],
    rookie: ['member'],
    member: ['elite'],
    elite: ['admin'],
    admin: ['master'],
    master: []
  },
  demotion_paths: {
    master: ['admin'],
    admin: ['elite'],
    elite: ['member'],
    member: ['rookie'],
    rookie: ['applicant'],
    applicant: [],
    developer: []
  },
  requirements: {
    applicant_to_rookie: { days_in_clan: 7, ladder_games: 10, community_posts: 5 },
    rookie_to_member: { days_in_clan: 14 },
    member_to_elite: { days_in_clan: 30, ladder_games: 50, tournament_participation: 1 },
    elite_to_admin: { days_in_clan: 90, contribution_points: 1000, management_experience: true },
    admin_to_master: { days_in_clan: 180, leadership_approval: true, clan_contribution: 'exceptional' }
  }
} as const;
