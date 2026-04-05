// 권한 시스템 명확화
// ByClan 클랜 역할별 접근 제어 정의

// 개발자 설정 (localStorage에 저장)
export const DEV_SETTINGS = {
  canReviewApplications: true,       // 기본값: 가입심사 가능
  canManageMembers: true,            // 기본값: 멤버 관리 가능
  canDelegateMaster: true,           // 기본값: 마스터 위임 가능
  requireDiscordForLadder: true      // 기본값: 래더 Discord 연동 필수
};

// 개발자 설정 로드
export const loadDevSettings = () => {
  try {
    const saved = localStorage.getItem('byclan_dev_settings');
    return saved ? { ...DEV_SETTINGS, ...JSON.parse(saved) } : DEV_SETTINGS;
  } catch {
    return DEV_SETTINGS;
  }
};

// 개발자 설정 저장
export const saveDevSettings = (settings) => {
  try {
    localStorage.setItem('byclan_dev_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('개발자 설정 저장 실패:', error);
  }
};

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
      'member.approve',    // 가입 심사
      'member.manage',     // 멤버 관리
      'master.delegate'    // 마스터 위임
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
      'tournament.create',  // 토너먼트 생성
      'ladder.admin',      // 래더 관리
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
      'match.manage',      // 매치 관리
      'ladder.moderate',   // 래더 중재
      'announcement.edit',  // 공지사항 편집
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
  associate: {
    name: '준회원',
    description: '회원가입 직후 기본 등급',
    level: 50,
    permissions: [
      'match.join',        // 매치 참여
      'ladder.play',       // 래더 플레이 (Discord 필수)
      'community.post',    // 커뮤니티 게시
      'profile.edit',       // 프로필 수정
      'tournament.join'    // 토너먼트 참여
    ],
    color: '#95E1D3',
    icon: '🎮'
  },

  // 신입 길드원 - 신규 멤버
  rookie: {
    name: '신입 길드원',
    description: '클랜 신규 멤버 (2주 활동 기간)',
    level: 35,
    permissions: [
      'match.view',        // 매치 관람
      'community.view',    // 커뮤니티 열람
      'profile.view',      // 프로필 열람
      'community.comment',  // 커뮤니티 댓글
      'discord.required'   // Discord 연동 필수
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

// 권한 체크 함수들
export const PermissionChecker = {
  // 특정 권한이 있는지 확인 (개발자 설정 적용)
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
    }
    
    return role.permissions.includes(permission);
  },

  // 레벨 비교
  hasLevel: (userRole, requiredLevel) => {
    const role = ROLE_PERMISSIONS[userRole];
    return role ? role.level >= requiredLevel : false;
  },

  // 역할 그룹 확인
  isInGroup: (userRole, group) => {
    switch (group) {
      case 'developers':
        return userRole === 'developer';
      case 'management':
        return ['developer', 'master', 'admin'].includes(userRole);
      case 'senior':
        return ['developer', 'master', 'admin', 'elite'].includes(userRole);
      case 'members':
        return ['associate', 'elite', 'admin', 'master', 'developer'].includes(userRole);
      default:
        return false;
    }
  },

  // 메뉴 접근 권한 확인
  canAccessMenu: (userRole, menuPath) => {
    const menuPermissions = {
      '개발자': ['developer'],
      '관리자': ['developer', 'master', 'admin'],
      '가입 심사': ['developer', 'master', 'admin', 'elite'],
      '운영진게시판': ['developer', 'master', 'admin'],
      '길드원 관리': ['developer', 'master', 'admin'],
      '대시보드': ['rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '랭킹': ['visitor', 'applicant', 'rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '공지사항': ['visitor', 'applicant', 'rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '자유게시판': ['visitor', 'applicant', 'rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '프로필': ['visitor', 'applicant', 'rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '알림': ['rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '가입신청': ['visitor'], // 직접 메뉴 진입은 사용하지 않지만 호환성 유지
      '가입안내': ['visitor', 'applicant', 'rookie', 'associate', 'elite', 'admin', 'master', 'developer'],
      '정회원 전환신청': ['rookie'] // 신입 길드원만 정회원 신청
    };

    const allowedRoles = menuPermissions[menuPath] || [];
    return allowedRoles.includes(userRole);
  }
};

// 권한 위임 규칙
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

// 역할 변경 규칙
export const ROLE_CHANGE_RULES = {
  // 승격 가능 경로
  promotion_paths: {
    'guest': ['associate'],
    'associate': ['elite'],
    'elite': ['admin'],
    'admin': ['master'],
    'master': [] // 마스터는 최고 등급
  },
  
  // 강등 가능 경로 (관리자만 가능)
  demotion_paths: {
    'master': ['admin'],
    'admin': ['elite'],
    'elite': ['associate'],
    'associate': ['guest'],
    'guest': [],
    'developer': [] // 개발자는 특별 직급
  },
  
  // 역할 변경 요구 조건
  requirements: {
    'guest_to_associate': {
      days_in_clan: 7,
      ladder_games: 10,
      community_posts: 5
    },
    'associate_to_elite': {
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
