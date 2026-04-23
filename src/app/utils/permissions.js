/**
 * =====================================================================
 * 파일명: src/app/utils/permissions.js
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
 *   import { PermissionChecker, ROLE_PERMISSIONS } from '@/app/utils/permissions';
 *   const canPlay = PermissionChecker.hasPermission('elite', 'ladder.play'); // true
 * =====================================================================
 */

// 권한 시스템 명확화
// ByClan 클랜 역할별 접근 제어 정의

/**
 * DEV_SETTINGS
 * - 개발자(developer) 역할에게 적용되는 특수 설정 기본값입니다.
 * - 실제 설정값은 localStorage의 'byclan_dev_settings' 키에 저장됩니다.
 * - DevSettingsPanel 컴포넌트에서 UI로 변경 가능합니다.
 *
 * 각 속성 설명:
 *   homeGateEnabled:        홈게이트 활성화 여부 (true: 비밀번호 인증 필수)
 *   canReviewApplications: 개발자가 가입 심사를 할 수 있는지 여부
 *   canManageMembers:       개발자가 멤버를 관리할 수 있는지 여부
 *   canDelegateMaster:      개발자가 마스터 위임을 할 수 있는지 여부
 */
export const DEV_SETTINGS = {
  homeGateEnabled: true,             // 기본값: 홈게이트 활성화 (개발/점검 중)
  canReviewApplications: true,       // 기본값: 가입심사 가능
  canManageMembers: true,            // 기본값: 멤버 관리 가능
  canDelegateMaster: true            // 기본값: 마스터 위임 가능
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

/**
 * saveDevSettings(settings)
 * - 개발자 설정 객체를 localStorage에 JSON 형태로 저장합니다.
 * - DevSettingsPanel에서 설정 변경 시 이 함수를 호출합니다.
 *
 * 매개변수:
 *   settings: 저장할 설정 객체 (DEV_SETTINGS 형태)
 */
export const saveDevSettings = (settings) => {
  try {
    localStorage.setItem('byclan_dev_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('개발자 설정 저장 실패:', error);
  }
};

/**
 * ROLE_PERMISSIONS
 * - 각 역할(role)의 이름, 설명, 레벨, 허용된 권한 목록을 정의합니다.
 * - level이 높을수록 더 많은 권한을 가집니다.
 * - permissions 배열에 있는 문자열 키로 PermissionChecker.hasPermission()을 통해 권한을 확인합니다.
 *
 * 권한 키 설명:
 *   system.admin      - 시스템 전체 관리
 *   database.modify   - 데이터베이스 직접 수정
 *   code.deploy       - 코드 배포 권한
 *   user.manage_all   - 모든 유저 계정 관리
 *   clan.admin_all    - 클랜 전체 설정 관리
 *   clan.admin        - 클랜 일반 관리
 *   member.approve    - 가입 신청 승인/거절
 *   member.manage     - 멤버 역할 변경, 강퇴 등
 *   member.test       - 신규 가입자 테스트 진행
 *   member.mentor     - 신입 멘토링 권한
 *   master.delegate   - 마스터 권한 위임
 *   tournament.create - 토너먼트 생성
 *   tournament.join   - 토너먼트 참여
 *   ladder.admin      - 래더 시스템 관리
 *   ladder.moderate   - 래더 중재 (부정 행위 처리 등)
 *   ladder.play       - 래더 게임 참여
 *   match.manage      - 매치 관리
 *   match.host        - 매치 개최
 *   match.join        - 매치 참여
 *   match.view        - 매치 관람
 *   announcement.post - 공지사항 게시
 *   announcement.edit - 공지사항 편집
 *   community.post    - 자유게시판 글 작성
 *   community.view    - 자유게시판 열람
 *   community.comment - 자유게시판 댓글 작성
 *   profile.edit      - 프로필 수정
 *   profile.view      - 프로필 열람
 *   clan.info         - 클랜 기본 정보 열람
 *   application.submit - 가입 신청 제출
 *   application.track - 가입 신청 현황 확인
 *   discord.required  - Discord 연동 필수 표시
 */
export const ROLE_PERMISSIONS = {
  // 개발자 - 시스템 관리
  developer: {
    name: '개발자',
    description: '시스템 개발 및 유지보수',
    level: 100,
    permissions: [
      'system.admin',      // 시스템 관리
      'database.modify',   // 데이터베이스 수정
      'code.deploy',       // 코드 배포
      'user.manage_all',   // 모든 유저 관리
      'clan.admin_all',    // 클랜 전체 관리
      'clan.admin',        // 클랜 일반 관리
      'member.approve',    // 가입 심사
      'member.manage',     // 멤버 관리
      'member.test',       // 가입 테스트
      'member.mentor',     // 신입 멘토링
      'master.delegate',   // 마스터 위임
      'tournament.create', // 토너먼트 생성
      'tournament.join',   // 토너먼트 참여
      'ladder.admin',      // 래더 관리
      'ladder.moderate',   // 래더 중재
      'ladder.play',       // 래더 플레이
      'match.manage',      // 매치 관리
      'match.host',        // 매치 개최
      'match.join',        // 매치 참여
      'match.view',        // 매치 관람
      'announcement.post', // 공지사항 게시
      'announcement.edit', // 공지사항 편집
      'community.post',    // 자유게시판 게시
      'community.view',    // 자유게시판 열람
      'community.comment', // 자유게시판 댓글
      'profile.edit',      // 프로필 수정
      'profile.view',      // 프로필 열람
      'clan.info'          // 클랜 정보 열람
    ],
    color: '#FF6B6B',
    icon: '👨‍💻'
  },

  // 마스터 - 클랜 총괄
  master: {
    name: '마스터',
    description: '클랜 총괄 운영',
    level: 90,
    permissions: [
      'clan.admin',        // 클랜 관리
      'member.manage',     // 멤버 관리
      'master.delegate',   // 마스터 위임
      'tournament.create',  // 토너먼트 생성
      'ladder.admin',      // 래더 관리
      'ladder.play',       // 래더 플레이
      'announcement.post',  // 공지사항 게시
      'member.test'        // 가입 테스트
    ],
    color: '#FFD93D',
    icon: '👑'
  },

  // 관리자 - 일반 운영
  admin: {
    name: '관리자',
    description: '클랜 일반 운영',
    level: 80,
    permissions: [
      'member.approve',    // 가입 승인
      'member.manage',     // 멤버 관리
      'match.manage',      // 매치 관리
      'ladder.moderate',   // 래더 중재
      'ladder.play',       // 래더 플레이
      'announcement.post', // 공지사항 게시
      'announcement.edit', // 공지사항 편집
      'member.test'        // 가입 테스트
    ],
    color: '#6BCF7F',
    icon: '🛡️'
  },

  // 정예 - 경험자
  elite: {
    name: '정예',
    description: '클랜 경험 멤버',
    level: 60,
    permissions: [
      'member.approve',    // 가입 심사
      'match.host',        // 매치 개최
      'tournament.join',   // 토너먼트 참여
      'ladder.play',       // 래더 플레이
      'member.mentor'      // 신입 멘토링
    ],
    color: '#4ECDC4',
    icon: '⭐'
  },

  // 일반 길드원 - 정식 멤버
  member: {
    name: '일반 클랜원',
    description: '정식 일반 클랜원',
    level: 50,
    permissions: [
      'match.join',
      'ladder.play',
      'community.post',
      'profile.edit',
      'tournament.join'
    ],
    color: '#60A5FA',
    icon: '🛡️'
  },

  // 신입 길드원 - 신규 멤버
  rookie: {
    name: '신입 길드원',
    description: '클랜 신규 멤버 (2주 활동 기간)',
    level: 35,
    permissions: [
      'match.view',        // 매치 관람
      'match.join',        // 매치 참가
      'match.host',        // 매치 개최
      'community.view',    // 커뮤니티 열람
      'community.comment', // 커뮤니티 댓글
      'community.post',    // 커뮤니티 게시글 작성
      'profile.view',      // 프로필 열람
      'profile.edit',      // 프로필 수정
      'ladder.play',       // 래더 플레이
      'tournament.join'    // 토너먼트 참여
    ],
    color: '#DDA0DD',
    icon: '🆕'
  },

  // 신규 가입자 - 테스트 대기
  applicant: {
    name: '신규 가입자',
    description: '클랜 가입 신청자 (테스트 대기)',
    level: 25,
    permissions: [
      'match.view',        // 매치 관람
      'community.view',    // 커뮤니티 열람
      'profile.view',      // 프로필 열람
      'application.track'  // 가입 신청 현황 확인
    ],
    color: '#F0E68C',
    icon: '📝'
  },

  // 방문자 - 로그인만 한 상태
  visitor: {
    name: '방문자',
    description: '클랜 방문자 (로그인만 완료)',
    level: 10,
    permissions: [
      'match.view',        // 매치 관람
      'community.view',    // 커뮤니티 열람 (제한적)
      'profile.view',      // 프로필 열람 (제한적)
      'clan.info',         // 클랜 정보 확인
      'application.submit' // 가입 신청 가능
    ],
    color: '#C7CEEA',
    icon: '👤'
  }
};

/**
 * PermissionChecker
 * - 역할 기반 권한 확인 유틸리티 객체입니다.
 * - hasPermission, hasLevel, isInGroup, canAccessMenu 4가지 함수를 제공합니다.
 *
 * 사용 예시:
 *   PermissionChecker.hasPermission('elite', 'ladder.play')    // → true
 *   PermissionChecker.hasLevel('admin', 70)                    // → true (80 >= 70)
 *   PermissionChecker.isInGroup('master', 'management')        // → true
 *   PermissionChecker.canAccessMenu('visitor', '랭킹')          // → true
 */
export const PermissionChecker = {
  /**
   * hasPermission(userRole, permission)
   * - 특정 역할이 특정 권한을 가지고 있는지 확인합니다.
   * - 개발자 역할의 경우 loadDevSettings()로 추가 설정을 확인합니다.
   *
   * 매개변수:
   *   userRole:   확인할 역할 문자열 (예: 'elite', 'admin')
   *   permission: 확인할 권한 키 (예: 'ladder.play', 'member.approve')
   *
   * 반환값: 권한이 있으면 true, 없으면 false
   */
  hasPermission: (userRole, permission) => {
    const role = ROLE_PERMISSIONS[userRole];
    if (!role) return false;
    
    // 개발자인 경우 추가 설정 확인
    if (userRole === 'developer') {
      const devSettings = loadDevSettings();
      
      // 가입심사 권한 확인
      if (permission === 'member.approve' && !devSettings.canReviewApplications) {
        return false;
      }
      
      // 멤버 관리 권한 확인
      if (permission === 'member.manage' && !devSettings.canManageMembers) {
        return false;
      }
      
      // 마스터 위임 권한 확인
      if (permission === 'master.delegate' && !devSettings.canDelegateMaster) {
        return false;
      }

      // 개발자는 나머지 모든 권한을 보유 (developer_override)
      return true;
    }
    
    return role.permissions.includes(permission);
  },

  /**
   * hasLevel(userRole, requiredLevel)
   * - 특정 역할의 레벨이 요구 레벨 이상인지 확인합니다.
   *
   * 매개변수:
   *   userRole:      확인할 역할 문자열
   *   requiredLevel: 필요한 최소 레벨 숫자 (예: 50, 80)
   *
   * 반환값: 레벨이 충분하면 true, 아니면 false
   */
  hasLevel: (userRole, requiredLevel) => {
    const role = ROLE_PERMISSIONS[userRole];
    return role ? role.level >= requiredLevel : false;
  },

  /**
   * isInGroup(userRole, group)
   * - 역할이 특정 그룹에 속하는지 확인합니다.
   *
   * 그룹 종류:
   *   'developers' : developer만 해당
   *   'management' : developer, master, admin
   *   'senior'     : developer, master, admin, elite
   *   'members'    : developer, master, admin, elite, member
   *
   * 매개변수:
   *   userRole: 확인할 역할 문자열
   *   group:    그룹 이름 문자열
   *
   * 반환값: 그룹에 속하면 true, 아니면 false
   */
  isInGroup: (userRole, group) => {
    switch (group) {
      case 'developers':
        return userRole === 'developer';
      case 'management':
        return ['developer', 'master', 'admin'].includes(userRole);
      case 'senior':
        return ['developer', 'master', 'admin', 'elite'].includes(userRole);
      case 'members':
        return ['rookie', 'member', 'elite', 'admin', 'master', 'developer'].includes(userRole);
      default:
        return false;
    }
  },

  /**
   * canAccessMenu(userRole, menuPath)
   * - 특정 역할이 특정 메뉴에 접근 가능한지 확인합니다.
   * - menuPath는 사이드바나 헤더에서 사용하는 한국어 메뉴 이름입니다.
   *
   * 매개변수:
   *   userRole: 확인할 역할 문자열
   *   menuPath: 메뉴 이름 (예: '관리자', '래더', '랭킹')
   *
   * 반환값: 접근 가능하면 true, 아니면 false
   */
  canAccessMenu: (userRole, menuPath) => {
    // 비로그인 사용자(null/undefined)는 'visitor' 수준으로 간주합니다.
    const effectiveRole = userRole || 'visitor';

    const ALL_ROLES = ['visitor', 'applicant', 'rookie', 'member', 'elite', 'admin', 'master', 'developer'];
    const MEMBER_ROLES = ['rookie', 'member', 'elite', 'admin', 'master', 'developer'];

    const menuPermissions = {
      '개발자': ['developer'],
      '관리자': ['developer', 'master', 'admin'],
      '가입 심사': ['developer', 'master', 'admin', 'elite'],
      '운영진게시판': ['developer', 'master', 'admin'],
      '길드원 관리': ['developer', 'master', 'admin'],
      '대시보드': MEMBER_ROLES,
      '랭킹': ALL_ROLES,
      '경기기록': ALL_ROLES,   // 비로그인 포함 전체 공개
      '공지사항': ALL_ROLES,
      '자유게시판': ALL_ROLES,
      '개요': ALL_ROLES,
      '클랜원': ALL_ROLES,
      '프로필': ALL_ROLES,
      '알림': ['applicant', ...MEMBER_ROLES],
      '가입신청': ['visitor'], // 직접 메뉴 진입은 사용하지 않지만 호환성 유지
      '가입안내': ALL_ROLES,
      '정회원 전환신청': ['rookie'] // 신입 길드원만 정회원 신청
    };

    const allowedRoles = menuPermissions[menuPath] || [];
    return allowedRoles.includes(effectiveRole);
  }
};

/**
 * DELEGATION_RULES
 * - 권한 위임 규칙을 정의합니다.
 * - 누가 누구에게 어떤 권한을 위임할 수 있는지 명시합니다.
 *
 * master_to_admin : 마스터가 관리자에게 위임 가능한 권한 목록
 * admin_to_elite  : 관리자가 정예에게 위임 가능한 권한 목록
 * developer_override: 개발자는 모든 권한 보유 (클랜 정책 결정권 제외)
 */
export const DELEGATION_RULES = {
  // 마스터가 관리자에게 위임 가능한 권한
  master_to_admin: [
    'member.approve',
    'match.manage',
    'ladder.moderate'
  ],
  
  // 관리자가 정예에게 위임 가능한 권한
  admin_to_elite: [
    'member.approve'
  ],
  
  // 개발자는 모든 권한을 가짐 (단, 마스터의 클랜 정책 결정권은 제외)
  developer_override: true
};

/**
 * ROLE_CHANGE_RULES
 * - 역할 승격(promotion)과 강등(demotion) 경로 및 조건을 정의합니다.
 *
 * promotion_paths: 각 역할에서 올라갈 수 있는 역할 목록
 * demotion_paths : 각 역할에서 내려갈 수 있는 역할 목록 (관리자만 가능)
 * requirements   : 승격을 위해 충족해야 할 조건들
 *   - days_in_clan          : 클랜 가입 후 경과 일수
 *   - ladder_games          : 래더 게임 수
 *   - community_posts       : 커뮤니티 게시글 수
 *   - tournament_participation: 토너먼트 참여 횟수
 *   - contribution_points   : 기여 포인트
 *   - management_experience : 운영 경험 여부
 *   - leadership_approval   : 리더십 승인 여부
 *   - clan_contribution     : 클랜 기여도 평가
 */
export const ROLE_CHANGE_RULES = {
  // 승격 가능 경로
  promotion_paths: {
    'applicant': ['rookie'],
    'rookie': ['member'],
    'member': ['elite'],
    'elite': ['admin'],
    'admin': ['master'],
    'master': [] // 마스터는 최고 등급
  },
  
  // 강등 가능 경로 (관리자만 가능)
  demotion_paths: {
    'master': ['admin'],
    'admin': ['elite'],
    'elite': ['member'],
    'member': ['rookie'],
    'rookie': ['applicant'],
    'applicant': [],
    'developer': [] // 개발자는 특별 직급
  },
  
  // 역할 변경 요구 조건
  requirements: {
    'applicant_to_rookie': {
      days_in_clan: 7,
      ladder_games: 10,
      community_posts: 5
    },
    'rookie_to_member': {
      days_in_clan: 14
    },
    'member_to_elite': {
      days_in_clan: 30,
      ladder_games: 50,
      tournament_participation: 1
    },
    'elite_to_admin': {
      days_in_clan: 90,
      contribution_points: 1000,
      management_experience: true
    },
    'admin_to_master': {
      days_in_clan: 180,
      leadership_approval: true,
      clan_contribution: 'exceptional'
    }
  }
};
