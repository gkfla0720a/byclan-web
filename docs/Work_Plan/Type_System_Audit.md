# Type System Audit: `src/types` vs `src/utils/permissions`, and God Object Risk

## 1) `src/types`의 역할

`src/types`는 **도메인 전반의 타입 시스템 계층**입니다.

- **기본 타입/유니온 정의**: `UUID`, `UserRole`, `RaceCode`, 상태 문자열 유니온 등. (`primitives.ts`)
- **DB Row 스키마 타입**: 프로필/래더/매치/게시글 등의 레코드 구조를 정규화. (`rows.ts`)
- **조합형 뷰모델 타입**: 화면/쿼리에서 자주 쓰는 합성 타입(`AuthProfile`, `LadderMatchCard` 등). (`models.ts`)
- **JSON 유틸 타입/가드**: JSON object 판별, 매치 엔트리 판별. (`json.ts`)
- **배럴(export 집약)**: `index.ts`에서 전체 타입 모듈 re-export.

즉, `src/types`는 **권한에 한정되지 않고 앱 전체 데이터 계약(contract)과 타입 안정성**을 담당합니다.

## 2) `src/utils/permissions`의 역할

`src/utils/permissions`는 **권한 정책 엔진 계층**입니다.

- **역할/권한 도메인 모델**: 역할 집합(ROLES), 권한 액션(PERMISSIONS), 역할 그룹 등. (`types.ts`)
- **역할별 권한 매핑**: 역할 레벨, 설명, 실제 허용 권한. (`role-permissions.ts`)
- **접근 정책**: 메뉴별 접근 가능 역할 매핑. (`menu-policy.ts`)
- **규칙 정의**: 위임 규칙, 승급/강등 경로 규칙. (`rules.ts`)
- **평가 로직**: 역할 정규화, hasPermission/hasLevel/group 판별. (`checker.ts`)
- **배럴(export 집약)**: `index.ts`.

즉, `src/utils/permissions`는 **인증 후 인가(authorization) 정책의 정의 + 판정**을 담당합니다.

## 3) 중복 여부 점검

### 결론
- **직접적인 기능 중복은 크지 않음** (타입 계층 vs 권한 정책 계층으로 책임이 다름).
- 다만 **역할 문자열 정의의 중복/불일치 위험**은 존재.

### 상세
1. `src/types/primitives.ts`의 `UserRole` 유니온과, `src/utils/permissions/types.ts`의 `ROLES`/`ActiveRole`이 **역할 어휘를 각각 보유**합니다.
   - 현재는 의미가 유사하지만, 한쪽만 수정될 경우 드리프트 가능.
2. `UserRole`은 `| string`을 포함해 매우 느슨하고, `ActiveRole`은 엄격한 closed set입니다.
   - 이 자체는 의도(외부 데이터 수용 후 내부 정규화)일 수 있으나, 경계가 문서화되지 않으면 혼란 유발.
3. `LADDER_MEMBER_ROLES`는 `ActiveRole[]`로 잘 제한되어 있으나, 앱의 다른 영역에서 별도 role 배열을 만들면 정책 파편화 가능.

### 권장 개선
- 역할의 **Single Source of Truth**를 하나로 정하고(예: `permissions/types.ts`), `src/types/primitives.ts`는 이를 재사용하도록 통합.
- 외부 입력 타입(`UserRoleRaw = string`)과 내부 검증 통과 타입(`ActiveRole`)을 명시적으로 분리.
- 메뉴 접근/기능 접근 체크는 `hasPermission` 중심으로 수렴하고, `menu-policy`는 최소한의 UI 표시 정책만 유지.

## 4) God Object 형태 점검 (components + pages)

라인 수와 상태 수를 기준으로 고위험 후보를 점검했습니다.

- `src/components/MyProfile.tsx` (약 820 lines): 프로필 조회/수정, 계정 보안, 소셜 연동, 유효성 검증, 메시지 처리까지 한 파일에 집중.
- `src/components/MatchCenter.tsx` (약 576 lines): 매치 상태 관리 + 다중 UI 상태 + 액션 처리 결합.
- `src/components/GuestWelcome.tsx` (약 493 lines): 안내/신청 폼/상태 전환 로직 동시 보유.
- `src/components/AdminPointManager.tsx` (약 457 lines): 권한 확인, 로그 조회/필터, 포인트 지급/차감까지 결합.
- `src/components/ApplicationList.tsx` (약 443 lines): 목록, 탭, 모달 상태, 승인/반려 액션 혼합.
- `src/components/Header.tsx` (약 418 lines): 네비게이션 렌더링, 모바일 메뉴, 알림 카운트, 접근 정책 처리 결합.
- `src/app/(main)/(sidebar)/community/[id]/page.tsx` (약 314 lines): 게시글 조회, 댓글 CRUD, 반응(vote), 인접 글 로직 결합.

### 판단
- 위 파일들은 **“UI + 비즈니스 로직 + 데이터 접근 + 권한 분기 + 상태기계”가 한 컴포넌트에 몰려 있는 God Object 경향**이 있습니다.

## 5) 해결안 (실행 우선순위)

### A. 세로 분해(Vertical Slice) 우선
- 페이지 단위로 `view / hooks / services / types`를 같은 도메인 폴더로 묶습니다.
- 예: `src/features/profile/` 아래로 `MyProfile` 관련 코드 이동.

### B. 상태 분리
- 로컬 UI 상태는 컴포넌트, 서버 상태는 React Query/SWR 훅으로 분리.
- 폼 상태는 `react-hook-form + zod`로 통일해 검증/에러 처리 표준화.

### C. 권한 분기 중앙화
- 컴포넌트 내 role if-else 남발 대신 `can(action)` 형태 훅/헬퍼 사용.
- 메뉴 권한과 기능 권한의 기준을 문서화해 불일치 방지.

### D. 데이터 접근 계층화
- Supabase 호출을 컴포넌트에서 직접 하지 않고 `services/*`로 이관.
- 컴포넌트는 service/hook 결과를 소비만 하도록 단순화.

### E. 프레젠테이션 컴포넌트 분리
- 대형 컴포넌트를 `Container + Presentational` 패턴으로 분리.
- 예: `MyProfileContainer`(데이터/액션) + `ProfileForm`, `SecurityPanel`, `SocialLinkPanel`.

### F. 정량 기준 도입 (지속 관리)
- 경고 기준 예시:
  - 파일 길이 300~400줄 초과
  - `useState` 8개 초과
  - `useEffect` 3개 초과
  - 핸들러 함수 10개 초과
- 기준 초과 시 분해 이슈 자동 생성(ESLint custom rule 또는 CI 스크립트).

## 6) 권장 리팩터링 순서 (ROI 기준)
1. `MyProfile.tsx`
2. `AdminPointManager.tsx`
3. `ApplicationList.tsx`
4. `Header.tsx`
5. `community/[id]/page.tsx`

초기 목표는 “파일 분해 + 권한 체크 경로 단일화 + 데이터 접근 이관”으로 잡는 것이 효과적입니다.
