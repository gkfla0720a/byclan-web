# 💻 코드 품질 평가 리포트

ByClan Web 프로젝트의 코드 품질 및 주석 분석 리포트입니다.

> 📎 관련 문서: [아키텍처 다이어그램](./ARCHITECTURE-DIAGRAMS.md) | [빠른 참조](./QUICK-REFERENCE.md)

---

## 📊 전체 품질 요약

| 항목 | 평가 | 메모 |
|------|------|------|
| **주석 품질** | ⭐⭐⭐⭐⭐ | 매우 상세한 JSDoc 주석 |
| **코드 구조** | ⭐⭐⭐⭐⭐ | 계층별 분리가 명확함 |
| **타입 안정성** | ⭐⭐⭐⭐ | TypeScript 사용 + 인터페이스 정의 |
| **권한 관리** | ⭐⭐⭐⭐⭐ | 중앙 관리식 (ROLE_PERMISSIONS) |
| **에러 처리** | ⭐⭐⭐⭐ | errorLogger + retry 로직 |
| **문서화** | ⭐⭐⭐⭐⭐ | CODE-STRUCTURE.md 완비 |
| **가독성** | ⭐⭐⭐⭐⭐ | 명확한 변수명과 한글 주석 |
| **재사용성** | ⭐⭐⭐⭐ | Context/Hooks 패턴 일관 적용 |

---

## 1️⃣ 파일별 주석 품질 평가

### ✅ 우수 파일

#### `src/app/utils/permissions.js` — ⭐⭐⭐⭐⭐
- **파일 상단** JSDoc 블록으로 파일 역할, 사용법, 개념 설명 완비
- 권한 키 각각에 한글 인라인 주석 (`// 시스템 관리`, `// 데이터베이스 수정`)
- `ROLE_PERMISSIONS` 객체의 모든 역할에 구조화된 설명 포함
- `PermissionChecker` 메서드마다 파라미터·반환값 문서화

```javascript
// ✅ 모범 예시 — permissions.js
/**
 * PermissionChecker.hasPermission(role, permission)
 * - 특정 역할(role)이 특정 권한(permission)을 가지고 있는지 확인합니다.
 *
 * 매개변수:
 *   role:       확인할 역할 문자열 (예: 'admin', 'elite')
 *   permission: 확인할 권한 키 (예: 'ladder.play', 'member.approve')
 *
 * 반환값: boolean (권한 있으면 true)
 */
hasPermission(role, permission) { ... }
```

#### `src/app/hooks/useAuth.ts` — ⭐⭐⭐⭐⭐
- TypeScript 인터페이스(UserProfile, AuthPermissions, UseAuthReturn)에 각 필드 설명 포함
- 6개 주요 기능을 상단 블록에 번호로 나열
- 각 내부 함수(`loadServerSettings`, `loadUserData`, `getPermissions`)에 목적 주석

```typescript
// ✅ 모범 예시 — useAuth.ts 상단 블록
/**
 * ■ 주요 기능
 *   1. 로그인/로그아웃 상태 추적 (Supabase Auth 연동)
 *   2. 사용자 프로필 로드 및 자동 생성 (신규 가입자)
 *   3. Discord 계정 연동 감지 및 자동 업데이트
 *   4. 역할/권한 계산 (getPermissions 함수)
 *   5. 홈 게이트(비밀번호 인증) 상태 관리
 *   6. 진행 중인 래더 매치 확인
 */
```

#### `src/app/hooks/useNavigate.js` — ⭐⭐⭐⭐⭐
- 파일 역할 배경(Background) 설명 포함
- `VIEW_TO_PATH` 매핑 목적 명시
- `PATH_TO_VIEW` 역방향 생성 로직 설명
- 경고 동작(unmapped view name) 문서화

#### `src/app/components/Header.js` — ⭐⭐⭐⭐
- 컴포넌트 목적, 렌더링 조건 주석
- `openMenuIndex`, `isMobileMenuOpen` 등 상태 변수 설명
- 조건부 렌더링 블록마다 의도 명시

---

### ⚠️ 개선 여지가 있는 파일

#### `src/app/page.js` (홈 페이지)
일부 상수·인라인 스타일에 주석이 없습니다.

```javascript
// ❌ 현재
const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/...";
return (
  <div className="flex items-center justify-center ...">
```

```javascript
// ✅ 개선안
/**
 * ByClan 클랜 로고 이미지 URL
 * - GitHub에 호스팅되는 공개 이미지
 * - 12×12 크기, 마우스 오버 시 확대 효과 적용
 */
const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
```

---

## 2️⃣ 주석 스타일 가이드

새 코드를 작성할 때 아래 기준을 따르세요.

### 파일 상단 블록
```javascript
/**
 * =====================================================================
 * 파일명: src/app/components/MyComponent.js
 * 역할  : 한 문장으로 컴포넌트 역할 설명
 *
 * ■ 주요 기능
 *   1. 기능 A
 *   2. 기능 B
 *
 * ■ 사용 방법
 *   import MyComponent from '@/app/components/MyComponent';
 *   <MyComponent propA="값" />
 *
 * ■ Props
 *   propA: string  - 설명
 *   propB: boolean - 설명 (기본값: false)
 * =====================================================================
 */
```

### 함수 주석 (JSDoc)
```javascript
/**
 * functionName(param1, param2)
 * - 함수가 하는 일을 한 문장으로
 *
 * 매개변수:
 *   param1: 타입 - 설명
 *   param2: 타입 - 설명
 *
 * 반환값: 반환 타입 - 설명
 *
 * 예외:
 *   오류 상황 - 발생 조건
 */
```

### 인라인 주석
```javascript
// ✅ 좋은 예: 코드의 "왜"를 설명
const isApplicant = profile?.role === 'applicant'; // 가입 대기 중인 신청자

// ❌ 나쁜 예: 코드를 그대로 반복
const isApplicant = profile?.role === 'applicant'; // role이 applicant인지 확인
```

### 복잡한 조건 블록
```javascript
// ✅ 블록 의도를 먼저 설명
// 래더 대기열 진입 가능 여부: Discord 연동 + 권한 + 매치 미진행 모두 충족해야 함
const canEnterQueue =
  hasDiscord &&
  permissions.can.playLadder &&
  !profile.is_in_queue;
```

---

## 3️⃣ 개선 권장사항

### 🔴 긴급 개선 (보안/버그)

#### Header.js — 역할 문자열 비교 null 안전성

```javascript
// ❌ 현재 — role이 null/undefined일 때 .toString()이 TypeError를 던질 수 있음
const currentRole = role?.toString().trim().toLowerCase();
```

```javascript
// ✅ 개선 — 빈 문자열 fallback으로 null 안전 처리
const currentRole = (profile?.role ?? '').toLowerCase().trim() || 'visitor';
```

**이유:** `role?.toString()` 이후 `trim()`·`toLowerCase()` 체이닝은 옵셔널 체이닝이 적용되지 않아 `null`이 중간에 끼면 런타임 오류가 발생할 수 있습니다.

---

### 🟡 중요 개선 (구조/가독성)

#### Header.js — 역할 권한 상수에 주석 추가

```javascript
// ❌ 현재 — 의미 파악에 시간 필요
const isDeveloper = currentRole === 'developer';
const isDevOrHigher = ['developer', 'master', 'admin', 'elite'].includes(currentRole);
const isAdminOrHigher = ['developer', 'master', 'admin'].includes(currentRole);
```

```javascript
// ✅ 개선 — 각 상수의 목적과 대상 역할 명시
/** 개발자 전용 메뉴 (DevConsole) 표시 여부 */
const isDeveloper = currentRole === 'developer';

/** 가입 심사 메뉴 (elite 이상) 표시 여부 — permissions.js의 member.approve 참조 */
const isDevOrHigher = ['developer', 'master', 'admin', 'elite'].includes(currentRole);

/** 관리자 메뉴 (admin 이상) 표시 여부 */
const isAdminOrHigher = ['developer', 'master', 'admin'].includes(currentRole);
```

#### permissions.js — `canAccessMenu` 공개 메뉴 목록 상수화

```javascript
// ❌ 현재 — 매직 배열이 함수 안에 하드코딩
canAccessMenu(userRole, menuPath) {
  const publicMenus = ['community', 'notice', '경기기록', 'ranking'];
  ...
}
```

```javascript
// ✅ 개선 — 모듈 상단에 상수로 분리하여 재사용 가능
/** 로그인 없이도 접근 가능한 공개 메뉴 경로 목록 */
export const PUBLIC_MENU_PATHS = ['community', 'notice', '경기기록', 'ranking'];

canAccessMenu(userRole, menuPath) {
  if (PUBLIC_MENU_PATHS.some(m => menuPath.includes(m))) return true;
  ...
}
```

---

### 🟢 선택적 개선 (최적화/명확성)

#### useAuth.ts — UserProfile 선택 필드 주석 보강

```typescript
// ✅ 개선안 — 자동 생성 필드와 선택 필드를 그룹으로 구분
export interface UserProfile {
  // ─── 필수 필드 (DB NOT NULL) ─────────────────────────
  id: string;           // Supabase Auth UUID (PK)
  ByID: string;         // 클랜 닉네임 (예: 'By_홍길동')
  role: string;         // 역할 (visitor/applicant/rookie/associate/elite/admin/master/developer)
  points: number;       // 클랜 활동 포인트
  Ladder_MMR: number; // 래더 레이팅 (기본값: 1000)
  is_in_queue: boolean; // 래더 대기열 상태
  vote_to_start: boolean;

  // ─── 선택 필드 (nullable) ────────────────────────────
  discord_name: string | null; // Discord 표시 이름 (OAuth 연동 시 자동 설정)
  discord_id: string | null;   // Discord 고유 ID (래더 참여 필요)
  race: string;                // 스타크래프트 종족 (Terran/Zerg/Protoss)
  intro: string;               // 자기소개

  // ─── 집계 필드 (optional) ────────────────────────────
  wins?: number;               // 래더 누적 승리
  losses?: number;             // 래더 누적 패배
  queue_joined_at?: string;    // 대기열 진입 시각 (ISO 8601)
}
```

---

## 4️⃣ 품질 유지 체크리스트

새 코드를 PR하기 전 아래 항목을 확인하세요.

### 주석
- [ ] 파일 상단에 역할 설명 블록이 있는가?
- [ ] 공개 함수에 JSDoc 주석이 있는가?
- [ ] 복잡한 조건/알고리즘에 "왜"를 설명하는 주석이 있는가?
- [ ] 매직 넘버/문자열에 의미 주석이 있는가?

### 타입 안전성
- [ ] `?.` 옵셔널 체이닝이 null 가능성 있는 값에 적용되었는가?
- [ ] `?? 'fallback'` 또는 기본값으로 null 안전성이 확보되었는가?

### 권한 처리
- [ ] 역할 하드코딩 배열 대신 `permissions.js`의 함수를 사용했는가?
- [ ] 새 권한 키는 `ROLE_PERMISSIONS`에 추가했는가?

### 에러 처리
- [ ] 네트워크 호출에 try-catch 또는 `withRetry()`가 적용되었는가?
- [ ] 오류를 `logger`를 통해 기록하는가?
