# 📚 학습 로드맵

ByClan Web 프로젝트를 단계별로 학습하기 위한 가이드입니다. 5단계를 순서대로 따라가면 전체 코드베이스를 체계적으로 이해할 수 있습니다.

> 📎 관련 문서: [아키텍처 다이어그램](./ARCHITECTURE-DIAGRAMS.md) | [빠른 참조](./QUICK-REFERENCE.md)

---

## 🗺️ 학습 경로 개요

```
1단계: 구조 이해 (약 1시간)
    ↓
2단계: 인증 흐름 (약 2시간)
    ↓
3단계: 권한 시스템 (약 1.5시간)
    ↓
4단계: 컴포넌트 연결 (약 2시간)
    ↓
5단계: 실제 개발 (약 3시간+)
```

---

## 1️⃣ 단계 1: 구조 이해

**목표:** 프로젝트 전체 구조와 기술 스택을 파악합니다.

**예상 시간:** 약 1시간

### 읽어야 할 파일 (순서대로)

| 순서 | 파일 | 핵심 내용 |
|------|------|--------|
| 1 | `README.md` | 프로젝트 소개 및 빠른 시작 |
| 2 | `docs/guides/ENVIRONMENT-SETUP.md` | 로컬 개발 환경 설정 |
| 3 | `docs/CODE-STRUCTURE.md` | 전체 파일 구조 설명 |
| 4 | `docs/ARCHITECTURE-DIAGRAMS.md` | 시각화된 아키텍처 |
| 5 | `package.json` | 사용 중인 라이브러리 목록 |
| 6 | `next.config.mjs` | Next.js 설정 |
| 7 | `tsconfig.json` | TypeScript 설정 |

### 확인 포인트

- [ ] Next.js App Router 구조를 이해했는가?
- [ ] Route Group `(main)`, `(sidebar)` 목적을 알고 있는가?
- [ ] Supabase가 무엇인지, 어디에 사용되는지 알고 있는가?
- [ ] Tailwind CSS 기반 스타일링을 이해했는가?

### 기술 스택 요약

| 기술 | 역할 | 버전 |
|------|------|------|
| Next.js | 풀스택 React 프레임워크 | 15+ |
| React | UI 라이브러리 | 18+ |
| TypeScript | 타입 안전 JS (일부 파일) | 5+ |
| Tailwind CSS | 유틸리티 CSS 프레임워크 | 3+ |
| Supabase | BaaS (Auth + DB + Realtime) | - |
| Sentry | 오류 추적 (선택적) | - |

---

## 2️⃣ 단계 2: 인증 흐름 이해

**목표:** 로그인, 세션 관리, 사용자 프로필 로드 흐름을 완전히 이해합니다.

**예상 시간:** 약 2시간

### 읽어야 할 파일 (순서대로)

| 순서 | 파일 | 핵심 내용 |
|------|------|--------|
| 1 | `src/app/supabase.js` | Supabase 클라이언트 초기화 |
| 2 | `src/app/hooks/useAuth.ts` | 인증 핵심 로직 |
| 3 | `src/app/context/AuthContext.ts` | 전역 인증 상태 |
| 4 | `src/app/(main)/auth/callback/` | Discord OAuth 콜백 |
| 5 | `src/app/components/AuthForm.js` | 로그인 폼 UI |
| 6 | `src/app/components/HomeGate.js` | 비밀번호 인증 게이트 |
| 7 | `docs/DATA-FLOW-VISUALIZATION.md` | 인증 시퀀스 다이어그램 |

### 핵심 코드 패턴 익히기

```typescript
// 패턴 1: useAuthContext() 사용
import { useAuthContext } from '@/app/context/AuthContext';

function MyComponent() {
  const { user, profile, authLoading, getPermissions } = useAuthContext();

  if (authLoading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인이 필요합니다.</div>;

  return <div>안녕하세요, {profile?.ByID}님!</div>;
}
```

```typescript
// 패턴 2: needsSetup 확인 (신규 가입자)
const { needsSetup, handleSetupComplete } = useAuthContext();

if (needsSetup) {
  // 프로필 설정 화면 표시
}
```

### 확인 포인트

- [ ] Discord OAuth PKCE 흐름을 설명할 수 있는가?
- [ ] `onAuthStateChange`가 왜 필요한지 이해하는가?
- [ ] `visitor` 프로필이 언제 자동 생성되는지 알고 있는가?
- [ ] `needsSetup` 상태가 무엇을 의미하는지 알고 있는가?

---

## 3️⃣ 단계 3: 권한 시스템 이해

**목표:** 역할 기반 접근 제어(RBAC)를 완전히 이해하고 활용할 수 있게 됩니다.

**예상 시간:** 약 1.5시간

### 읽어야 할 파일 (순서대로)

| 순서 | 파일 | 핵심 내용 |
|------|------|--------|
| 1 | `src/app/utils/permissions.js` | 전체 권한 시스템 |
| 2 | `docs/QUICK-REFERENCE.md` | 권한 매트릭스 표 |
| 3 | `docs/ARCHITECTURE-DIAGRAMS.md` | 권한 계층도 |
| 4 | `src/app/components/Header.js` | 실제 권한 활용 예시 |

### 핵심 코드 패턴 익히기

```javascript
// 패턴 1: getPermissions() 권한 객체 사용
const { getPermissions } = useAuthContext();
const permissions = getPermissions();

// can 객체로 편리하게 확인
if (permissions.can.playLadder) { /* 래더 기능 표시 */ }
if (permissions.can.approveMembers) { /* 심사 기능 표시 */ }

// 패턴 2: 레벨 비교
if (permissions.hasLevel(80)) { /* admin(80) 이상만 */ }

// 패턴 3: 메뉴 접근 체크
if (permissions.canAccessMenu('/admin')) { /* 관리자 메뉴 표시 */ }

// 패턴 4: 특정 권한 키 확인
if (permissions.hasPermission('tournament.create')) { /* 토너먼트 생성 버튼 */ }

// 패턴 5: 직접 역할 비교 (Header.js 스타일)
const isDeveloper = profile?.role === 'developer';
const isAdminOrHigher = ['developer', 'master', 'admin'].includes(profile?.role);
```

### 역할 레벨 암기표

```
developer(100) > master(90) > admin(80) > elite(60) > associate/member(50) > rookie(35) > applicant(25) > visitor(10)
```

### 확인 포인트

- [ ] `ROLE_PERMISSIONS`이 Single Source of Truth인 이유를 설명할 수 있는가?
- [ ] `DEV_SETTINGS`이 무엇이고 언제 사용되는가?
- [ ] `PermissionChecker.hasLevel()`과 직접 역할 배열 비교의 차이를 알고 있는가?
- [ ] `canAccessMenu()`가 `effectiveRole = userRole || 'visitor'`를 쓰는 이유를 알고 있는가?

---

## 4️⃣ 단계 4: 컴포넌트 연결 이해

**목표:** 주요 컴포넌트들이 어떻게 연결되어 화면을 구성하는지 이해합니다.

**예상 시간:** 약 2시간

### 읽어야 할 파일 (순서대로)

| 순서 | 파일 | 핵심 내용 |
|------|------|--------|
| 1 | `src/app/layout.js` | 루트 레이아웃 (Context 공급) |
| 2 | `src/app/(main)/layout.js` | 메인 레이아웃 (Header, HomeGate) |
| 3 | `src/app/(main)/(sidebar)/layout.js` | 사이드바 레이아웃 |
| 4 | `src/app/components/Header.js` | 헤더 컴포넌트 |
| 5 | `src/app/hooks/useNavigate.js` | 한국어 라우팅 훅 |
| 6 | `src/app/page.js` | 홈 페이지 |
| 7 | `src/app/components/ErrorBoundary.js` | 에러 격리 |
| 8 | `src/app/context/ToastContext.js` | 알림 시스템 |

### 핵심 코드 패턴 익히기

```javascript
// 패턴 1: useNavigate 훅으로 페이지 이동
import { useNavigate } from '@/app/hooks/useNavigate';

function MyComponent() {
  const navigateTo = useNavigate();
  return (
    <button onClick={() => navigateTo('랭킹')}>랭킹 보기</button>
  );
}
```

```javascript
// 패턴 2: useToast 훅으로 알림 표시
import { useToast } from '@/app/context/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('저장되었습니다!');
    } catch (err) {
      toast.error('저장 실패: ' + err.message);
    }
  };
}
```

```javascript
// 패턴 3: SectionErrorBoundary로 에러 격리
import { SectionErrorBoundary } from '@/app/components/ErrorBoundary';

function MyPage() {
  return (
    <SectionErrorBoundary>
      <DangerousComponent />
    </SectionErrorBoundary>
  );
}
```

### 확인 포인트

- [ ] Route Group이 레이아웃을 어떻게 중첩하는지 이해하는가?
- [ ] `useNavigate()`와 Next.js `useRouter()`의 차이를 알고 있는가?
- [ ] `SectionErrorBoundary`가 전체 페이지 크래시를 어떻게 막는가?
- [ ] Toast 알림이 `useReducer` 기반으로 동작한다는 것을 알고 있는가?

---

## 5️⃣ 단계 5: 실제 개발 실습

**목표:** 새 기능을 직접 추가하면서 전체 패턴을 체득합니다.

**예상 시간:** 3시간 이상 (실습 과제에 따라 다름)

### 실습 과제 A: 새 페이지 추가 (초급)

```
목표: '이벤트' (/events) 페이지 추가하기

1. src/app/(main)/(sidebar)/events/page.js 생성
2. src/app/pages/EventsContent.js 생성 (실제 콘텐츠)
3. useNavigate.js의 VIEW_TO_PATH에 '이벤트' → '/events' 추가
4. Header.js 또는 Sidebar.js에 메뉴 항목 추가
5. 권한 설정: 모든 로그인 사용자가 볼 수 있도록
```

### 실습 과제 B: 권한 기반 기능 (중급)

```
목표: '이벤트 생성' 버튼을 admin 이상만 볼 수 있게 구현

1. useAuthContext()로 getPermissions() 호출
2. permissions.hasLevel(80) 조건으로 버튼 표시 제어
3. 서버 측에서도 RLS 정책으로 INSERT 권한 제한
```

### 실습 과제 C: 에러 처리 통합 (고급)

```
목표: Supabase 쿼리에 완전한 에러 처리 추가

1. try-catch로 쿼리 래핑
2. isRetryableError() 확인
3. withRetry()로 재시도 처리
4. logger()로 오류 기록
5. toast.error()로 사용자에게 알림
```

### 개발 명령어

```bash
# 로컬 개발 서버 시작
npm run dev

# 코드 린트 검사
npm run lint

# 프로덕션 빌드 (배포 전 확인)
npm run build
```

---

## 📖 추가 참고 자료

### 공식 문서

| 기술 | 문서 링크 |
|------|--------|
| Next.js App Router | https://nextjs.org/docs/app |
| React Hooks | https://react.dev/reference/react |
| Supabase Auth | https://supabase.com/docs/guides/auth |
| Supabase JS Client | https://supabase.com/docs/reference/javascript |
| Tailwind CSS | https://tailwindcss.com/docs |
| TypeScript | https://www.typescriptlang.org/docs |

### 프로젝트 내 추가 문서

| 문서 | 내용 |
|------|------|
| `docs/guides/DATABASE-GUIDE.md` | DB 스키마, RLS 정책, 쿼리 예시 |
| `sql/queries/DATABASE-QUERIES.sql` | 자주 쓰는 SQL 쿼리 모음 |
| `docs/guides/AUTH-TEST-ACCOUNT-STRATEGY.md` | 테스트 계정 사용 전략 |
| `docs/guides/MOBILE-GUIDE.md` | 모바일 반응형 개발 가이드 |
| `docs/worklog/WORKLOG_NEXT_STEPS.txt` | 진행 중인 작업 및 다음 단계 |

---

## ✅ 최종 체크리스트

학습을 완료했다면 다음 항목을 모두 할 수 있어야 합니다:

### 이해
- [ ] Next.js App Router의 Route Group을 설명할 수 있다
- [ ] Discord OAuth PKCE 흐름을 도식으로 그릴 수 있다
- [ ] 역할 8가지와 각 레벨을 암기하고 있다
- [ ] `getPermissions()`가 반환하는 객체 구조를 안다

### 개발
- [ ] 새 페이지를 혼자 추가할 수 있다
- [ ] 권한 체크를 올바르게 적용할 수 있다
- [ ] 에러 처리 패턴을 적용할 수 있다
- [ ] 주석 스타일 가이드를 따라 코드를 작성할 수 있다

### 디버깅
- [ ] `authLoading`이 true일 때 UI가 어떻게 동작하는지 안다
- [ ] `needsSetup` 상태를 트리거하는 조건을 안다
- [ ] localStorage 키를 확인하여 개발자 설정을 점검할 수 있다
