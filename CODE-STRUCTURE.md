# ByClan Web — 코드 구조 문서

ByClan 클랜 공식 홈페이지(Next.js 16 + React 19 + Supabase)의 전체 코드 구조를 설명하는 문서입니다.

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [전체 디렉토리 구조](#2-전체-디렉토리-구조)
3. [라우팅 구조](#3-라우팅-구조)
4. [레이아웃 계층](#4-레이아웃-계층)
5. [컴포넌트 목록](#5-컴포넌트-목록)
6. [페이지 컴포넌트 목록](#6-페이지-컴포넌트-목록)
7. [훅 (Hooks)](#7-훅-hooks)
8. [컨텍스트 (Context)](#8-컨텍스트-context)
9. [유틸리티 모듈](#9-유틸리티-모듈)
10. [인증 흐름](#10-인증-흐름)
11. [권한 시스템](#11-권한-시스템)
12. [상태 관리](#12-상태-관리)
13. [데이터 레이어](#13-데이터-레이어)
14. [스타일링](#14-스타일링)
15. [환경 변수 및 설정 파일](#15-환경-변수-및-설정-파일)
16. [루트 레벨 유틸리티 스크립트](#16-루트-레벨-유틸리티-스크립트)
17. [관련 문서 목록](#17-관련-문서-목록)

---

## 1. 기술 스택

| 항목 | 버전 / 라이브러리 |
|------|------------------|
| Framework | Next.js 16.2.1 (App Router) |
| UI Library | React 19.2.4 |
| Language | JavaScript + TypeScript(일부) |
| CSS | TailwindCSS 4 |
| Backend | Supabase (PostgreSQL + PostgREST) |
| Auth | Supabase Auth (Discord OAuth) |
| Error Tracking | Sentry (`@sentry/browser`) |
| Node.js | 22 (`.nvmrc` 기준) |

---

## 2. 전체 디렉토리 구조

```
byclan-web/
├── src/
│   ├── app/                        # Next.js App Router 루트
│   │   ├── (main)/                 # 인증된 사용자용 라우트 그룹
│   │   │   ├── (sidebar)/          # 사이드바 포함 페이지 그룹
│   │   │   │   ├── community/      # 자유게시판
│   │   │   │   ├── join/           # 가입 안내 / 가입 신청
│   │   │   │   │   └── transfer/   # 정회원 전환 신청
│   │   │   │   ├── ladder/         # 래더 시스템
│   │   │   │   ├── media/          # 미디어 갤러리
│   │   │   │   ├── members/        # 클랜원 목록
│   │   │   │   ├── notice/         # 공지사항
│   │   │   │   ├── overview/       # 클랜 개요
│   │   │   │   ├── ranking/        # 시즌 랭킹
│   │   │   │   ├── tournament/     # 토너먼트
│   │   │   │   └── layout.js       # 사이드바 레이아웃
│   │   │   ├── admin/              # 운영진 게시판
│   │   │   │   ├── applications/   # 가입 심사
│   │   │   │   └── guild/          # 클랜원 관리
│   │   │   ├── developer/          # 개발자 콘솔
│   │   │   ├── notifications/      # 알림
│   │   │   ├── profile/            # 내 프로필
│   │   │   └── layout.js           # 메인 레이아웃 (Header/Footer/HomeGate)
│   │   ├── auth/
│   │   │   └── callback/           # Discord OAuth 콜백 처리
│   │   ├── login/                  # 로그인 페이지
│   │   ├── components/             # 재사용 가능한 React 컴포넌트
│   │   ├── context/                # React Context 제공자
│   │   ├── hooks/                  # 커스텀 React 훅
│   │   ├── pages/                  # 페이지 콘텐츠 컴포넌트 (라우트 아님)
│   │   ├── utils/                  # 유틸리티 함수 모음
│   │   ├── layout.js               # 루트 레이아웃 (전역 Provider)
│   │   ├── page.js                 # 홈 페이지 (/)
│   │   └── globals.css             # 전역 CSS / TailwindCSS 설정
│   └── supabase.js                 # Supabase 클라이언트 초기화
├── public/                         # 정적 파일 (이미지 등)
├── .devcontainer/                  # GitHub Codespaces 설정
├── next.config.mjs                 # Next.js 설정
├── tsconfig.json                   # TypeScript 설정
├── jsconfig.json                   # JavaScript 경로 별칭 설정
├── postcss.config.mjs              # PostCSS (TailwindCSS 4) 설정
├── eslint.config.mjs               # ESLint 설정
├── package.json                    # 프로젝트 의존성 및 스크립트
└── .env.example                    # 환경 변수 예시
```

---

## 3. 라우팅 구조

Next.js 16 App Router를 사용합니다. 각 폴더의 `page.js`가 라우트가 됩니다.

### 3-1. 공개 라우트

| URL | 파일 | 설명 |
|-----|------|------|
| `/` | `src/app/page.js` | 홈 (HomeGate로 접근 제어) |
| `/login` | `src/app/login/page.js` | Discord OAuth 로그인 |
| `/auth/callback` | `src/app/auth/callback/page.js` | OAuth 콜백 처리 |

### 3-2. 사이드바 라우트 (`(main)/(sidebar)`)

| URL | 파일 | 컴포넌트 | 설명 |
|-----|------|----------|------|
| `/overview` | `overview/page.js` | `ClanOverview` | 클랜 소개 |
| `/members` | `members/page.js` | `ClanMembers` | 클랜원 목록 |
| `/join` | `join/page.js` | — | 가입 안내 |
| `/join/transfer` | `join/transfer/page.js` | — | 정회원 전환 신청 |
| `/ladder` | `ladder/page.js` | `LadderDashboard` + `MatchCenter` | 래더 시스템 |
| `/ranking` | `ranking/page.js` | `RankingBoard` | 시즌 랭킹 |
| `/notice` | `notice/page.js` | `NoticeBoard` | 공지사항 |
| `/community` | `community/page.js` | `CommunityBoard` | 자유게시판 |
| `/media` | `media/page.js` | `MediaGallery` | 미디어 갤러리 |
| `/tournament` | `tournament/page.js` | `ClanTournament` | 토너먼트 |

### 3-3. 운영진 라우트 (`(main)/admin`)

| URL | 파일 | 컴포넌트 | 설명 |
|-----|------|----------|------|
| `/admin` | `admin/page.js` | `AdminBoard` | 운영진 게시판 |
| `/admin/applications` | `admin/applications/page.js` | `ApplicationList` | 가입 심사 |
| `/admin/guild` | `admin/guild/page.js` | `GuildManagement` | 클랜원 관리 |

### 3-4. 기타 인증 라우트 (`(main)`)

| URL | 파일 | 컴포넌트 | 설명 |
|-----|------|----------|------|
| `/profile` | `profile/page.js` | `MyProfile` | 내 프로필 |
| `/notifications` | `notifications/page.js` | `NotificationCenter` | 알림 |
| `/developer` | `developer/page.js` | `DevConsole` | 개발자 콘솔 |

### 3-5. 뷰 이름 → URL 매핑 (`useNavigate`)

한국어 뷰 이름을 URL 경로로 변환하는 훅(`src/app/hooks/useNavigate.js`)에서 관리됩니다.

```js
// 주요 매핑 예시
'Home'       → '/'
'대시보드'    → '/ladder'
'관리자'      → '/admin'
'길드원 관리' → '/admin/guild'
'프로필'      → '/profile'
```

---

## 4. 레이아웃 계층

```
RootLayout (src/app/layout.js)
  └─ ErrorBoundary
      └─ ToastProvider
          └─ AuthProvider
              └─ 각 페이지

└─ / (page.js) ← HomeGate 직접 포함
└─ (main)/layout.js ← HomeGate + Header + Footer + DevSettingsPanel
    └─ (sidebar)/layout.js ← ProfileSidebar 포함
        └─ 각 페이지 (overview, members, ladder ...)
    └─ 직접 라우트 (admin, profile, notifications, developer)
```

**주요 역할:**

| 레이아웃 | 파일 | 역할 |
|---------|------|------|
| 루트 레이아웃 | `src/app/layout.js` | 전역 Provider 설정 (Auth, Toast, Error) |
| 메인 레이아웃 | `(main)/layout.js` | Header, Footer, HomeGate, DevSettingsPanel |
| 사이드바 레이아웃 | `(sidebar)/layout.js` | ProfileSidebar + 콘텐츠 영역 |

---

## 5. 컴포넌트 목록

`src/app/components/` 에 위치한 재사용 가능한 React 컴포넌트입니다.

### 5-1. 레이아웃 / 공통 UI

| 파일 | 설명 |
|------|------|
| `Header.js` | 메인 내비게이션. 역할별 메뉴 표시 / 숨김 처리 |
| `Footer.js` | 하단 정보 및 링크 |
| `HomeGate.js` | 개발 환경 접근 비밀번호 게이트 |
| `ErrorBoundary.js` | 섹션 단위 에러 격리. `SectionErrorBoundary` 포함 |
| `ToastContainer.js` | Toast 알림 UI 렌더링 |
| `UIStates.js` | 공통 UI 상태 컴포넌트 (`SkeletonLoader`, `ErrorMessage`, `EmptyState`) |

### 5-2. 인증 / 프로필

| 파일 | 설명 |
|------|------|
| `AuthForm.js` | 이메일/패스워드 로그인 폼 |
| `ImprovedAuthForm.js` | Discord OAuth 로그인 폼 (현재 사용) |
| `AuthDashboard.js` | 신규 가입자 프로필 초기 설정 화면 |
| `MyProfile.js` | 내 프로필 조회 및 편집 (Discord 연동 포함) |
| `ProfileSidebar.js` | 사이드바 내 사용자 프로필 요약 표시 |
| `PermissionInfo.js` | 현재 사용자 권한 및 역할 정보 표시 |

### 5-3. 관리 / 운영

| 파일 | 설명 |
|------|------|
| `AdminBoard.js` | 운영진 게시판 (공지 작성/조회) |
| `AdminMembers.js` | 멤버 관리 유틸리티 (레거시, 현재 미사용 가능) |
| `ApplicationList.js` | 가입 신청 심사 (승인/거절 워크플로) |
| `GuildManagement.js` | 클랜원 종합 관리 (역할 변경, 마스터 위임 등) |

### 5-4. 기능 컴포넌트

| 파일 | 설명 |
|------|------|
| `LadderDashboard.js` | 래더 시스템 대시보드 (큐 관리, 매치 기록, MMR) |
| `MatchCenter.js` | 매치 내 포인트 베팅 시스템 |
| `LadderPreview.js` | 비회원 대상 래더 미리보기 |
| `RankingBoard.js` | 시즌별 랭킹 표시 |
| `NoticeBoard.js` | 공지사항 목록 표시 |
| `CommunityBoard.js` | 자유게시판 UI |
| `NotificationCenter.js` | 사용자 알림 목록 |
| `HomeSections.js` | 홈 화면 섹션 (`MatchStatus`, `ActivityLog`) |
| `VisitorWelcome.js` | 비회원/방문자 환영 화면 |

### 5-5. 개발자 도구

| 파일 | 설명 |
|------|------|
| `DevConsole.js` | 개발자 디버깅 콘솔 |
| `DevSettingsPanel.js` | 개발자 설정 토글 UI (로컬스토리지 저장) |

---

## 6. 페이지 컴포넌트 목록

`src/app/pages/` 는 Next.js 라우트 파일이 아닌, 페이지 콘텐츠를 담당하는 컴포넌트 파일들입니다.

| 파일 | 설명 |
|------|------|
| `HomeContent.js` | 홈 화면 콘텐츠 (매치 현황, 활동 로그 등) |
| `ClanOverview.js` | 클랜 개요 페이지 콘텐츠 |
| `ClanMembers.js` | 클랜원 목록 페이지 콘텐츠 |
| `ClanTournament.js` | 토너먼트 페이지 콘텐츠 |
| `MediaGallery.js` | 미디어 갤러리 콘텐츠 |
| `PagePlaceholder.js` | 준비 중인 페이지용 플레이스홀더 |

---

## 7. 훅 (Hooks)

`src/app/hooks/` 에 위치합니다.

### `useAuth.ts` (주요 인증 훅)

인증 상태 전반을 관리하는 핵심 훅. `AuthContext`를 통해 앱 전체에 제공됩니다.

**제공하는 상태/함수:**

| 항목 | 타입 | 설명 |
|------|------|------|
| `user` | `object\|null` | Supabase Auth 사용자 객체 |
| `profile` | `object\|null` | profiles 테이블 데이터 |
| `authLoading` | `boolean` | 인증 로딩 상태 |
| `needsSetup` | `boolean` | 신규 가입자 프로필 설정 필요 여부 |
| `reloadProfile()` | `function` | 프로필 데이터 강제 새로고침 |
| `getPermissions()` | `function` | 현재 역할 기반 권한 객체 반환 |
| `handleSetupComplete()` | `function` | 프로필 설정 완료 처리 |

### `useNavigate.js` (라우팅 훅)

한국어 뷰 이름을 URL 경로로 변환해 라우팅을 처리합니다.

```js
const navigateTo = useNavigate();
navigateTo('대시보드'); // → router.push('/ladder')
navigateTo('길드원 관리'); // → router.push('/admin/guild')
```

`PATH_TO_VIEW` 상수를 함께 export해 역방향 매핑도 지원합니다.

---

## 8. 컨텍스트 (Context)

`src/app/context/` 에 위치합니다.

### `AuthContext.ts`

`useAuth` 훅을 React Context로 감싸 전역 상태로 제공합니다.

```
AuthProvider (src/app/layout.js에서 전역 적용)
  └─ useAuth() 훅의 모든 상태/함수를 Context로 노출
```

사용법:
```js
import { useAuthContext } from '@/app/context/AuthContext';

const { user, profile, getPermissions, authLoading } = useAuthContext();
```

### `ToastContext.js`

Toast 알림 시스템을 전역으로 관리합니다. `useReducer` 기반으로 구현됩니다.

```
ToastProvider (src/app/layout.js에서 전역 적용)
  └─ ADD / REMOVE 액션으로 토스트 관리
  └─ 4000ms 자동 소멸 (설정 가능)
```

사용법:
```js
import { useToast } from '@/app/context/ToastContext';

const toast = useToast();
toast.success('저장 완료!');
toast.error('오류 발생');
toast.warning('주의');
toast.info('안내');
```

---

## 9. 유틸리티 모듈

`src/app/utils/` 에 위치합니다.

### `permissions.js` — 역할 기반 접근 제어 (RBAC)

**역할 정의 (레벨 내림차순):**

| 역할 | 레벨 | 한글명 | 설명 |
|------|------|--------|------|
| `developer` | 100 | 개발자 | 시스템 개발/유지보수 |
| `master` | 90 | 마스터 | 클랜 총괄 운영 |
| `admin` | 80 | 관리자 | 일반 운영 |
| `elite` | 60 | 엘리트 | 숙련 클랜원 |
| `member` | 50 | 일반 클랜원 | 정회원 |
| `associate` | 50 | 테스트신청자 | 가입 테스트 진행 중 |
| `rookie` | 35 | 루키 | 신입 클랜원 |
| `applicant` | 25 | 신청자 | 가입 대기 중 |
| `visitor` | 10 | 방문자 | 로그인한 비회원 |

**주요 export:**

| 항목 | 설명 |
|------|------|
| `ROLE_PERMISSIONS` | 역할별 권한 정의 객체 |
| `DEV_SETTINGS` | 개발자 런타임 설정 기본값 |
| `loadDevSettings()` | localStorage에서 개발자 설정 로드 |
| `saveDevSettings()` | 개발자 설정 localStorage 저장 |
| `DELEGATION_RULES` | 마스터 위임 규칙 |
| `ROLE_CHANGE_RULES` | 역할 변경 허용 규칙 |
| `PermissionChecker` | 권한 확인 클래스 |

**주요 권한 항목:**

```
system.admin       ladder.play       member.approve
database.modify    ladder.admin      member.manage
code.deploy        ladder.moderate   master.delegate
clan.admin         match.manage      announcement.post
tournament.create  member.test       community.post
```

### `errorLogger.js` — 에러 로깅

Sentry 연동 에러 로거. `NEXT_PUBLIC_SENTRY_DSN` 환경 변수가 설정된 경우 Sentry에 자동 보고됩니다.

```js
import { errorLogger } from '@/app/utils/errorLogger';

errorLogger.info('정보 메시지');
errorLogger.warning('경고', context);
errorLogger.error('에러', context);
errorLogger.critical('치명적 오류', context);
errorLogger.captureException(error, context);
```

### `retry.js` — 재시도 로직

지수 백오프 방식의 비동기 함수 재시도 유틸리티입니다.

```js
import { withRetry, isRetryableError } from '@/app/utils/retry';

const result = await withRetry(
  () => supabase.from('profiles').select('*'),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

- 최대 3회 재시도
- 기본 대기: 1초 → 2초 → 4초 (지수 증가)
- `isRetryableError()`: 5xx 오류, 네트워크 오류 감지

### `testData.js` — 테스트 계정 유틸리티

테스트 계정(`test1`~`test10`) 관련 설정 및 Discord 인증 우회 처리를 담당합니다.

```js
import { shouldBypassDiscordForTestAccount } from '@/app/utils/testData';

// test1~test10 계정은 Discord 연동 없이 래더 사용 가능
const bypass = shouldBypassDiscordForTestAccount(profile?.ByID);
```

### `joinProcess.js` — 가입 프로세스 (스텁)

현재는 플레이스홀더 상태입니다. 가입 프로세스 관련 로직을 모으는 용도로 사용될 예정입니다.

---

## 10. 인증 흐름

```
1. 사용자가 홈(/) 접속
   └─ HomeGate: DEV_ACCESS_PASSWORD 비밀번호 확인
         └─ 통과 시 → 정상 렌더링
         └─ 미입력 시 → 비밀번호 입력 화면

2. 로그인 클릭 → /login (ImprovedAuthForm)
   └─ "Discord로 로그인" 버튼 클릭
         └─ supabase.auth.signInWithOAuth({ provider: 'discord' })
         └─ Discord 인증 화면으로 리디렉션

3. Discord 인증 완료 → /auth/callback
   └─ PKCE 코드 교환 (supabase.auth.exchangeCodeForSession)
   └─ 세션 수립 → 홈(/)으로 리디렉션

4. 홈(/) 재접속
   └─ useAuth: supabase.auth.getSession() → 세션 복원
   └─ profiles 테이블에서 프로필 조회
         └─ 프로필 없음 → needsSetup=true → AuthDashboard 표시
         └─ role='applicant' → 가입 대기 화면
         └─ 그 외 → 정상 홈 화면

5. 이후 모든 페이지
   └─ useAuthContext()로 user, profile, getPermissions() 사용
   └─ onAuthStateChange 이벤트로 세션 변경 자동 감지
```

---

## 11. 권한 시스템

`permissions.js`의 `ROLE_PERMISSIONS`가 단일 출처(Single Source of Truth)입니다.

### 권한 확인 방법

컴포넌트에서 `getPermissions()`가 반환하는 객체를 사용합니다:

```js
const permissions = getPermissions();

permissions.canPlay           // 래더 플레이 가능 여부
permissions.canApprove        // 가입 심사 권한
permissions.canManageMembers  // 멤버 관리 권한
permissions.canAdmin          // 관리자 권한
permissions.isDeveloper       // 개발자 여부
permissions.isMaster          // 마스터 여부
```

### 헤더 메뉴 접근 제어

`Header.js`가 `getPermissions()` 결과를 기반으로 메뉴 항목을 동적으로 표시/숨김 처리합니다.

### 마스터 위임 보안

`GuildManagement.js`에서 마스터 위임 시 추가 인증이 요구됩니다:
1. 비밀번호 재인증 **또는**
2. 이메일 OTP 인증

---

## 12. 상태 관리

이 프로젝트는 별도의 전역 상태 라이브러리(Redux, Zustand 등)를 사용하지 않습니다.

| 상태 유형 | 방식 | 위치 |
|----------|------|------|
| 인증 상태 | React Context + `useAuth` 훅 | `AuthContext.ts` |
| Toast 알림 | React Context + `useReducer` | `ToastContext.js` |
| 페이지 로컬 상태 | `useState` | 각 컴포넌트 |
| 개발자 설정 | localStorage | `permissions.js` |

---

## 13. 데이터 레이어

모든 데이터 접근은 Supabase 클라이언트(`src/supabase.js`)를 통해 직접 이루어집니다. 별도의 API 라우트(`/api`)는 없습니다.

### Supabase 클라이언트

```js
// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '...';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
```

### 주요 테이블 구조

| 테이블 | 주요 컬럼 | 용도 |
|--------|----------|------|
| `profiles` | id, ByID, role, race, points, ladder_points, discord_name, discord_id, wins, losses, is_in_queue | 사용자 프로필 |
| `ladder_matches` | id, status, match_type, team_a_ids, team_b_ids, score_a, score_b, created_by | 래더 매치 기록 |
| `notifications` | id, user_id, title, message, is_read | 사용자 알림 |
| `applications` | id, user_id, status, ... | 가입 신청 |
| `admin_posts` | id, title, content, author_id, ... | 운영진 게시글 |
| `posts` | id, title, content, author_id, category, ... | 일반 게시글 |
| `match_bets` | id, match_id, user_id, amount, ... | 매치 베팅 (RLS 적용) |
| `system_settings` | key, value | 시스템 런타임 설정 |

자세한 스키마 정보는 `DATABASE-GUIDE.md`를 참고하세요.

---

## 14. 스타일링

- **TailwindCSS 4** — 유틸리티 퍼스트 CSS 프레임워크
- **다크 테마** — 기본 배경색 `#06060a` (네온 사이버 스타일)
- **Pretendard 폰트** — 한국어 최적화 폰트
- **반응형 디자인** — 모바일 우선(`sm:`, `md:` breakpoint 사용)

사이버 테마 커스텀 클래스(`cyber-card` 등)는 `globals.css`에 정의되어 있습니다.

모바일 최적화 관련 내용은 `MOBILE-GUIDE.md`를 참고하세요.

---

## 15. 환경 변수 및 설정 파일

### `.env.local` (로컬 개발용, git 제외)

```bash
DEV_ACCESS_PASSWORD=1990                    # HomeGate 비밀번호
NEXT_PUBLIC_SUPABASE_URL=https://...        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...          # Supabase 익명 키
SUPABASE_SERVICE_ROLE_KEY=...              # 시드 스크립트용 서비스 롤 키
NEXT_PUBLIC_SENTRY_DSN=...                 # Sentry 오류 추적 (선택)
```

자세한 내용은 `ENVIRONMENT-SETUP.md`를 참고하세요.

### 주요 설정 파일

| 파일 | 설명 |
|------|------|
| `next.config.mjs` | Next.js 설정 (현재 기본값) |
| `tsconfig.json` | TypeScript 설정 (`@/*` 경로 별칭, `strict: false`) |
| `jsconfig.json` | JavaScript 경로 별칭 설정 |
| `postcss.config.mjs` | TailwindCSS 4 PostCSS 플러그인 |
| `eslint.config.mjs` | ESLint 규칙 설정 |
| `.nvmrc` | Node.js 22 버전 지정 |

---

## 16. 루트 레벨 유틸리티 스크립트

프로젝트 루트에는 개발/관리용 스크립트가 있습니다. 이 파일들은 빌드에 포함되지 않습니다.

| 파일 | 용도 |
|------|------|
| `seed-test-data.cjs` | 테스트 데이터 Supabase에 주입 (`npm run seed:test-data`) |
| `check-database.js` | DB 연결 및 스키마 확인 |
| `check-current-data.js` | 현재 DB 데이터 검증 |
| `create-test-data.js` | 테스트 레코드 생성 |
| `fix-my-profile.js` | 프로필 데이터 복구 유틸리티 |
| `mobile-analyzer.js` | 모바일 반응형 분석 |
| `mobile-docs-updater.js` | 모바일 문서 자동 업데이트 |
| `simple-fix.js` | 간단한 데이터 수정 스크립트 |

---

## 17. 관련 문서 목록

| 파일 | 내용 |
|------|------|
| `README.md` | 개발 서버 실행 방법 |
| `ENVIRONMENT-SETUP.md` | 환경 변수 설정 및 개발 환경 구성 |
| `DATABASE-GUIDE.md` | Supabase SQL Editor 사용법 및 쿼리 참고 |
| `DATABASE-QUERIES.sql` | 개발용 SQL 쿼리 모음 |
| `AUTH-TEST-ACCOUNT-STRATEGY.md` | 테스트 계정 생성/관리 전략 |
| `MOBILE-GUIDE.md` | 모바일 최적화 가이드 |
| `MATCH-BETS-RLS.sql` | match_bets 테이블 RLS 정책 SQL |
| `PROFILE-DATA-BACKFILL.sql` | profiles 데이터 마이그레이션 SQL |
| `STREAMER-FIELDS-MIGRATION.sql` | 스트리머 필드 마이그레이션 SQL |
| `TEST-DATA-SEED.sql` | 테스트 데이터 SQL (Supabase SQL Editor용) |
| `WORKLOG_NEXT_STEPS.txt` | 개발 작업 로그 및 다음 작업 목록 |

---

*이 문서는 코드 탐색 및 신규 기여자 온보딩을 위한 참고 자료입니다. 코드 변경 시 이 문서도 함께 업데이트해 주세요.*
