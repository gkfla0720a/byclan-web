// 모바일용 코드 분석기
// ByClan 프로젝트 모바일 개발 지원

// === 프로젝트 기본 정보 ===
export const PROJECT_INFO = {
  name: "ByClan Web",
  type: "Next.js 스타크래프트 클랜 관리 시스템",
  version: "0.1.0",
  database: "Supabase",
  auth: "Discord 연동",
  lastUpdate: "2026-04-04"
};

// === 주요 파일 구조 (개선됨) ===
export const FILE_STRUCTURE = {
  main: {
    "src/app/page.js": "메인 페이지 - 라우팅, 권한 관리 (126줄로 감소)",
    "src/app/layout.js": "전체 레이아웃",
    "src/supabase.js": "데이터베이스 연결"
  },
  components: {
    "Header.js": "네비게이션 (12KB)",
    "LadderDashboard.js": "래더 대시보드 (12KB)",
    "ApplicationList.js": "가입 신청 관리 (16KB)",
    "JoinProcess.js": "가입 프로세스 (11KB)",
    "MyProfile.js": "프로필 관리 (13KB)",
    "AdminBoard.js": "관리자 게시판 (9KB)",
    "MatchCenter.js": "매치 센터 (9KB)"
  },
  pages: {
    "HomeContent.js": "홈 컨텐츠 (분리됨)",
    "ClanOverview.js": "클랜 소개 (분리됨)",
    "ClanTournament.js": "토너먼트 (분리됨)",
    "MediaGallery.js": "미디어 갤러리 (분리됨)",
    "PagePlaceholder.js": "페이지 플레이스홀더 (분리됨)"
  },
  hooks: {
    "useAuth.js": "인증 관리 훅 (새로 추가)"
  }
};

// === 데이터베이스 테이블 요약 ===
export const DATABASE_TABLES = {
  users: {
    profiles: "사용자 프로필 (Discord, 역할, 포인트, 종족)",
    posts: "게시글",
    applications: "가입 신청"
  },
  ladder: {
    ladder_matches: "래더 매치",
    match_sets: "매치 세트",
    match_bets: "매치 베팅",
    ladders: "래더 랭킹"
  },
  system: {
    system_settings: "시스템 설정",
    notifications: "알림",
    point_logs: "포인트 로그",
    admin_posts: "관리자 공지"
  }
};

// === 현재 권한 시스템 ===
export const PERMISSION_SYSTEM = {
  roles: ["developer", "master", "admin", "elite", "associate"],
  developer: "모든 권한 (개발자=클랜 관리자)",
  master: "최고 관리자",
  admin: "일반 관리자",
  elite: "정예 클랜원",
  associate: "일반 클랜원"
};

// === 현재 개발 상태 ===
export const CURRENT_STATUS = {
  phase: "개발 서버 테스트 단계",
  security: "임시 비밀번호 보호 (1990)",
  features: {
    completed: ["기본 라우팅", "권한 시스템", "래더 기본 구조", "컴포넌트 분리 완료"],
    inProgress: ["매치 시스템", "베팅 기능"],
    planned: ["알림 시스템", "포인트 로그"]
  },
  improvements: [
    "✅ 성능: 264줄 → 126줄로 감소",
    "✅ 구조: 컴포넌트 분리 완료",
    "✅ 에러: try-catch 추가됨",
    "⚠️ 보안: 환경변수 분리 필요"
  ],
  issues: [
    "보안: 비밀번호 환경변수로 분리 필요",
    "권한 시스템: 역할별 접근 제어 명확화 필요"
  ]
};

// === 모바일에서 자주 묻는 질문 ===
export const MOBILE_QUESTIONS = {
  structure: "프로젝트 구조가 어떻게 되어 있나요?",
  permissions: "권한 시스템은 어떻게 작동하나요?",
  database: "데이터베이스 테이블은 무엇이 있나요?",
  current: "현재 어떤 기능이 작동 중인가요?",
  issues: "현재 문제점은 무엇인가요?",
  next: "다음에 무엇을 개발해야 하나요?"
};

// === 빠른 명령어 ===
export const QUICK_COMMANDS = {
  dev: "npm run dev",
  build: "npm run build",
  deploy: "npm run build && npm start",
  test: "현재 테스트 모드: 비밀번호 1990"
};

// === 모바일 작업 가이드 ===
export const MOBILE_WORKFLOW = {
  step1: "GitHub 앱에서 최신 코드 확인",
  step2: "ChatGPT/Claude에 코드 질문",
  step3: "간단한 수정은 GitHub 웹에서",
  step4: "데스크톱에서 상세 개발"
};

// === 긴급 연락처 ===
export const EMERGENCY_INFO = {
  developer: "halim0720 (개발자)",
  database: "Supabase",
  hosting: "Vercel 추천",
  backup: "GitHub 자동 백업"
};
