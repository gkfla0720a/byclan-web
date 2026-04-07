# 🏗️ 아키텍처 다이어그램

ByClan Web의 시스템 구조를 다양한 시각으로 표현한 다이어그램 모음입니다.

> 📎 관련 문서: [데이터 흐름](./DATA-FLOW-VISUALIZATION.md) | [빠른 참조](./QUICK-REFERENCE.md)

---

## 1️⃣ 아키텍처 레이어 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 사용자 (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│               📱 UI / React Components Layer                  │
│  ┌───────────────┬────────────────┬──────────────────┐      │
│  │  Header.js    │  Sidebar.js    │  Pages/*         │      │
│  │  (헤더 네비)   │  (사이드 네비)  │  (페이지 콘텐츠)  │      │
│  └───────────────┴────────────────┴──────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│               🧠 State Management Layer                       │
│  ┌───────────────────────┬──────────────────────┐           │
│  │    AuthContext.ts     │   ToastContext.js     │           │
│  │    (전역 인증 상태)     │   (전역 알림 상태)     │           │
│  └───────────────────────┴──────────────────────┘           │
│                    + localStorage / sessionStorage            │
├─────────────────────────────────────────────────────────────┤
│               🎣 Hooks & Utilities Layer                      │
│  ┌─────────────┬─────────────┬───────────────────────┐      │
│  │ useAuth.ts  │useNavigate.js│   permissions.js      │      │
│  │ (인증 로직)  │ (라우팅 훅)  │   (권한 시스템)         │      │
│  ├─────────────┼─────────────┼───────────────────────┤      │
│  │  retry.js   │errorLogger.js│   testData.js         │      │
│  │ (재시도 로직) │ (에러 로깅)  │   (테스트 계정 도구)    │      │
│  └─────────────┴─────────────┴───────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│               🔐 API / Data Layer                             │
│  ┌─────────────────────────┬───────────────────────┐        │
│  │  Supabase Auth          │  Supabase DB           │        │
│  │  (Discord OAuth PKCE)   │  (PostgreSQL + RLS)    │        │
│  └─────────────────────────┴───────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ 권한 시스템 계층도

```
                    permissions.js
                  ROLE_PERMISSIONS
                  (단일 출처 / Single Source of Truth)
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
developer(100)       master(90)           admin(80)
👨‍💻 시스템 관리        👑 클랜 총괄           🛡️ 일반 운영
────────────        ────────────          ────────────
system.admin        clan.admin            member.approve
database.modify     member.manage         member.manage
code.deploy         master.delegate       match.manage
user.manage_all     tournament.create     ladder.moderate
clan.admin_all      ladder.admin          ladder.play
member.approve      ladder.play           announcement.edit
member.manage       announcement.post     member.test
master.delegate     member.test
ladder.play
[DEV_SETTINGS로
 권한 제한 가능]
         │
         ▼
      elite(60)
      ⭐ 경험 멤버
      ────────────
      member.approve
      match.host
      tournament.join
      ladder.play
      member.mentor
         │
         ▼
   associate(50) / member(50)
   🛡️ 테스트 신청자 / 정식 멤버
   ─────────────────────────
   match.join
   ladder.play
   community.post
   profile.edit
         │
         ▼
      rookie(35)
      🆕 신입 (Discord 연동 필요)
      ────────────
      match.view
      community.view
      ladder.play
         │
         ▼
    applicant(25)
    📝 가입 신청자
    ────────────
    match.view
    community.view
    application.track
         │
         ▼
     visitor(10)
     👤 비로그인 방문자
     ────────────
     match.view
     community.view (제한)
     application.submit
```

---

## 3️⃣ 디렉토리 구조 트리

```
byclan-web/
│
├── 📁 src/
│   └── 📁 app/
│       ├── 📁 (main)/                   ← Route Group: Header/Footer/HomeGate 포함
│       │   ├── 📁 (sidebar)/            ← Route Group: ProfileSidebar 포함
│       │   │   ├── community/           ← 자유게시판 (/community)
│       │   │   ├── ladder/              ← BY래더시스템 (/ladder)
│       │   │   ├── ranking/             ← 시즌별 랭킹 (/ranking)
│       │   │   ├── members/             ← 클랜원 목록 (/members)
│       │   │   ├── notice/              ← 공지사항 (/notice)
│       │   │   ├── overview/            ← 클랜 개요 (/overview)
│       │   │   ├── media/               ← 미디어 갤러리 (/media)
│       │   │   ├── tournament/          ← 토너먼트 (/tournament)
│       │   │   ├── matches/             ← 경기기록 (/matches)
│       │   │   ├── join/                ← 가입 안내 (/join)
│       │   │   └── layout.js            ← 사이드바 레이아웃
│       │   │
│       │   ├── 📁 admin/                ← 운영진 전용 라우트
│       │   │   ├── applications/        ← 가입 심사 (/admin/applications)
│       │   │   ├── guild/               ← 클랜원 관리 (/admin/guild)
│       │   │   └── page.js              ← 관리자 대시보드
│       │   │
│       │   ├── 📁 auth/
│       │   │   └── callback/            ← Discord OAuth 콜백 처리
│       │   │
│       │   ├── developer/               ← 개발자 콘솔 (/developer)
│       │   ├── login/                   ← 로그인 페이지 (/login)
│       │   ├── notifications/           ← 알림 센터 (/notifications)
│       │   ├── profile/                 ← 내 프로필 (/profile)
│       │   └── layout.js                ← 메인 레이아웃 (Header, HomeGate)
│       │
│       ├── 📁 components/               ← 재사용 가능한 UI 컴포넌트
│       │   ├── Header.js                ← 상단 내비게이션
│       │   ├── Footer.js                ← 하단 푸터
│       │   ├── HomeGate.js              ← 비밀번호 인증 게이트
│       │   ├── ErrorBoundary.js         ← 에러 격리 (SectionErrorBoundary)
│       │   ├── ToastContainer.js        ← 토스트 알림 UI
│       │   ├── AuthForm.js              ← Discord 로그인 폼
│       │   ├── MyProfile.js             ← 프로필 편집 컴포넌트
│       │   └── LadderDashboard.js       ← 래더 대시보드
│       │
│       ├── 📁 context/                  ← React Context (전역 상태)
│       │   ├── AuthContext.ts           ← 인증 상태 Provider/Hook
│       │   └── ToastContext.js          ← 알림 상태 Provider/Hook
│       │
│       ├── 📁 hooks/                    ← 커스텀 훅
│       │   ├── useAuth.ts               ← 핵심 인증 훅
│       │   └── useNavigate.js           ← 한국어 뷰 이름 → URL 변환 훅
│       │
│       ├── 📁 pages/                    ← 페이지 콘텐츠 컴포넌트
│       │   ├── HomeContent.js           ← 홈 화면 콘텐츠
│       │   ├── ClanOverview.js          ← 클랜 개요
│       │   ├── MatchRecords.js          ← 경기기록
│       │   └── [기타 페이지]...
│       │
│       ├── 📁 utils/                    ← 유틸리티 함수
│       │   ├── permissions.js           ← 권한 시스템 (핵심)
│       │   ├── errorLogger.js           ← Severity 레벨 로깅 + Sentry
│       │   ├── retry.js                 ← withRetry(), isRetryableError()
│       │   ├── testData.js              ← 테스트 계정 도구
│       │   └── joinProcess.js           ← 가입 프로세스 헬퍼
│       │
│       ├── layout.js                    ← 루트 레이아웃 (Context Provider)
│       ├── page.js                      ← 홈 페이지 (/)
│       ├── globals.css                  ← Tailwind CSS 전역 스타일
│       └── supabase.js                  ← Supabase 클라이언트 (isSupabaseConfigured 포함)
│
├── 📁 src/database.sql                  ← DB 초기화 스크립트
├── 📁 public/                           ← 정적 파일
│
├── 📄 docs/                             ← 개발 문서 (현재 위치)
├── 📄 CODE-STRUCTURE.md                 ← 전체 파일 구조 설명
├── 📄 DATABASE-GUIDE.md                 ← DB 스키마 및 RLS 가이드
├── 📄 ENVIRONMENT-SETUP.md              ← 로컬 환경 설정
├── 📄 package.json                      ← 프로젝트 의존성
├── 📄 next.config.mjs                   ← Next.js 설정
├── 📄 tsconfig.json                     ← TypeScript 설정 (allowJs: true, strict: false — JS→TS 점진적 마이그레이션 중)
└── 📄 eslint.config.mjs                 ← ESLint 설정
```

---

## 4️⃣ 컴포넌트 의존성 그래프

```
app/layout.js (루트)
└── AuthProvider (AuthContext.ts)
    └── ToastProvider (ToastContext.js)
        └── (main)/layout.js
            ├── HomeGate.js ──→ sessionStorage('byclan_home_gate')
            ├── Header.js
            │   ├── useAuthContext() ──→ AuthContext.ts
            │   │   ├── user (Supabase User)
            │   │   ├── profile (UserProfile)
            │   │   └── getPermissions() ──→ permissions.js
            │   │       └── PermissionChecker.hasPermission()
            │   └── useNavigate() ──→ useNavigate.js
            │       └── VIEW_TO_PATH 매핑
            │
            └── (sidebar)/layout.js
                └── ProfileSidebar.js
                    └── useAuthContext()

useAuth.ts (훅)
├── supabase.js (클라이언트)
├── permissions.js
│   ├── ROLE_PERMISSIONS
│   ├── PermissionChecker
│   └── loadDevSettings() ──→ localStorage
├── testData.js ──→ shouldBypassDiscordForTestAccount()
├── retry.js ──→ withRetry()
└── errorLogger.js ──→ logger(Severity.*)
```

---

## 5️⃣ 상태 관리 패턴

```
ByClan Web 상태 관리 전략
════════════════════════

1. 전역 인증 상태 (React Context)
   ┌─────────────────────────────────┐
   │  AuthContext.ts                 │
   │  useAuth() 훅 결과를 전체 앱에  │
   │  공급합니다.                    │
   │                                 │
   │  제공하는 값:                   │
   │   user, profile, authLoading    │
   │   authError, needsSetup         │
   │   getPermissions()              │
   │   reloadProfile()               │
   │   handleAuthSuccess()           │
   │   handleSetupComplete()         │
   └─────────────────────────────────┘
   사용: useAuthContext() in any component

2. 전역 알림 상태 (React Context + useReducer)
   ┌─────────────────────────────────┐
   │  ToastContext.js                │
   │  reducer 기반으로 토스트 목록   │
   │  추가/제거를 관리합니다.         │
   │                                 │
   │  제공하는 메서드:               │
   │   toast.success(msg)            │
   │   toast.error(msg)              │
   │   toast.info(msg)               │
   └─────────────────────────────────┘
   사용: useToast() in any component

3. 로컬 컴포넌트 상태 (useState)
   각 컴포넌트가 독립적으로 관리합니다.
   예: Header의 openMenuIndex, isMobileMenuOpen

4. 영구 스토리지 (localStorage)
   'byclan_dev_settings' — 개발자 설정
   'byclan_dev_mode'     — 개발 모드 플래그

5. 세션 스토리지 (sessionStorage)
   'byclan_home_gate' — HomeGate 인증 상태
   (브라우저 탭 닫으면 초기화)

미사용 상태 관리 라이브러리:
  ✗ Redux   ✗ Zustand   ✗ Recoil   ✗ Jotai
```

---

## 6️⃣ DB 테이블 관계도

```
┌───────────────────┐
│   auth.users      │  (Supabase 내장 인증 테이블)
│   ─── id (PK)     │
│   ─── email       │
└────────┬──────────┘
         │ 1 : 1
         ▼
┌─────────────────────────────────────────┐
│   profiles                              │  (사용자 프로필)
│   ─── id            FK → auth.users.id  │
│   ─── ByID          클랜 닉네임          │
│   ─── role          역할 (8가지)         │
│   ─── discord_id    Discord 고유 ID     │
│   ─── discord_name  Discord 표시 이름   │
│   ─── ladder_points 래더 레이팅 (기본 1000)│
│   ─── is_in_queue   래더 대기열 상태     │
│   ─── vote_to_start 시작 투표 여부       │
│   ─── points        클랜 활동 포인트     │
│   ─── race          스타크래프트 종족    │
│   ─── intro         자기소개            │
└───────────┬───────────────┬─────────────┘
            │ 1 : N         │ 1 : N
            ▼               ▼
  ┌──────────────────┐  ┌──────────────────────┐
  │  ladder_matches  │  │   notifications      │
  │  ─── status      │  │   ─── user_id  FK    │
  │  ─── match_type  │  │   ─── title          │
  │  ─── team_a_ids  │  │   ─── message        │
  │  ─── team_b_ids  │  │   ─── is_read        │
  │  ─── score_a/b   │  └──────────────────────┘
  │  ─── created_by  │
  └──────────────────┘
```

> 📘 더 자세한 스키마: [DATABASE-GUIDE.md](../DATABASE-GUIDE.md)
