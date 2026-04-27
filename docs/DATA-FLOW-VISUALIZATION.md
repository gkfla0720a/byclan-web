# 🔄 데이터 흐름 시각화

ByClan Web에서 데이터가 어떻게 이동하는지 시퀀스 다이어그램과 흐름도로 설명합니다.

> 📎 관련 문서: [아키텍처 다이어그램](./ARCHITECTURE-DIAGRAMS.md) | [빠른 참조](./QUICK-REFERENCE.md)

---

## 1️⃣ 최초 진입 흐름

```
브라우저 진입 (/)
      │
      ▼
app/layout.js
  AuthProvider 마운트
  ToastProvider 마운트
      │
      ▼
(main)/layout.js
  ┌──────────────────────────┐
  │  HomeGate.js              │
  │  sessionStorage 확인      │
  │  'byclan_home_gate' 키    │
  └──────────┬───────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
  인증됨           미인증
  (이미 방문)      (최초 방문)
    │                 │
    ▼                 ▼
  콘텐츠 렌더링    비밀번호 입력 화면
                       │
                  올바른 비밀번호 입력
                       │
                       ▼
                  sessionStorage 저장
                  콘텐츠 렌더링
```

---

## 2️⃣ Discord 로그인 흐름 (Sequence Diagram)

```
사용자         AuthForm.js      /auth/callback     useAuth.ts        Supabase
  │               │                  │                 │                │
  │  로그인 클릭  │                  │                 │                │
  │─────────────→│                  │                 │                │
  │              │                  │                 │                │
  │              │ signInWithOAuth() │                 │                │
  │              │─────────────────────────────────────────────────────→│
  │              │                  │                 │                │
  │◄─ Discord OAuth 리다이렉트 ──────────────────────────────────────────│
  │              │                  │                 │                │
  │  Discord에서 로그인 승인          │                 │                │
  │─────────────────────────────────→│                │                │
  │              │                  │                 │                │
  │              │                  │ exchangeCodeForSession()         │
  │              │                  │────────────────────────────────→│
  │              │                  │                 │                │
  │              │                  │                 │←─ 세션 생성 ───│
  │              │                  │                 │                │
  │◄─ 홈(/) 리다이렉트 ─────────────────────────────────────────────────│
  │              │                  │                 │                │
  │              │                  │    onAuthStateChange 이벤트      │
  │              │                  │─────────────────→│               │
  │              │                  │                 │                │
  │              │                  │            loadUserData()        │
  │              │                  │                 │─ profiles 조회 →│
  │              │                  │                 │←─ 프로필 데이터 ─│
  │              │                  │                 │                │
  │              │◄── useAuthContext() 업데이트 ────────│               │
  │              │    (user, profile, permissions)    │                │
  │              │                  │                 │                │
  │  권한별 메뉴  │                  │                 │                │
  │◄─────────────│                  │                 │                │
```

---

## 3️⃣ 인증 초기화 상세 흐름

```
useAuth.ts 초기화 (useEffect)
      │
      ├─ loadServerSettings()
      │     └─ developer_settings 테이블 조회
      │         └─ 서버 설정값 state 저장
      │
      └─ initializeData()
            │
            ├─ supabase.auth.getSession()
            │     ├─ 세션 있음 → loadUserData(authUser)
            │     └─ 세션 없음 → visitor 상태 유지
            │
            └─ supabase.auth.onAuthStateChange() 구독
                  ├─ SIGNED_IN  → loadUserData(authUser)
                  ├─ SIGNED_OUT → 상태 초기화
                  └─ TOKEN_REFRESHED → loadUserData(authUser)

loadUserData(authUser)
      │
      ├─ getDiscordIdentity(authUser)
      │     └─ user.identities 배열에서 provider='discord' 추출
      │
      ├─ profiles 테이블 조회 (id = authUser.id)
      │     ├─ 프로필 없음 → visitor 프로필 자동 생성 (INSERT)
      │     ├─ role = 'applicant' → needsSetup = true
      │     └─ 정식 멤버 → profile state 업데이트
      │
      └─ Discord 정보 자동 갱신
            └─ discord_id 또는 discord_name 변경 시 UPDATE
```

---

## 4️⃣ 권한 확인 흐름

```
컴포넌트에서 권한 확인 요청
      │
      ▼
useAuthContext().getPermissions()
      │
      ▼
useAuth.ts: getPermissions() 실행
      │
      ├─ loadDevSettings()
      │     └─ localStorage 'byclan_dev_settings' 읽기
      │
      ├─ shouldBypassDiscordForTestAccount()
      │     └─ localStorage 'byclan_test_account_setting' 확인
      │
      ├─ profile.role 기반 권한 계산
      │     └─ PermissionChecker.hasPermission(role, key) 호출
      │           └─ ROLE_PERMISSIONS[role].permissions.includes(key)
      │
      └─ 권한 객체 반환
            {
              can: {
                playLadder: boolean,
                approveMembers: boolean,
                manageMembers: boolean,
                postAnnouncement: boolean,
                adminSystem: boolean,
                ...
              },
              role: string,
              level: number,
              hasPermission(key): boolean,
              hasLevel(minLevel): boolean,
              isInGroup(group): boolean,
              canAccessMenu(path): boolean,
            }
```

---

## 5️⃣ 함수 호출 맵 (useAuth.ts)

```
export useAuth()
│
├─ [초기화] useEffect
│   ├─ loadServerSettings()
│   │    └─ supabase.from('developer_settings').select()
│   │
│   └─ initializeData()
│        ├─ supabase.auth.getSession()
│        └─ supabase.auth.onAuthStateChange()
│             └─ loadUserData(authUser)
│                  ├─ getDiscordIdentity(authUser)
│                  ├─ supabase.from('profiles').select().eq('id', ...)
│                  │    ├─ [없음] supabase.from('profiles').insert(visitorProfile)
│                  │    └─ [있음] setProfile(data)
│                  └─ [Discord 변경 시] supabase.from('profiles').update(...)
│
├─ getPermissions()
│   ├─ loadDevSettings()   → localStorage
│   ├─ shouldBypassDiscordForTestAccount()  → localStorage
│   ├─ PermissionChecker.hasPermission(role, 'ladder.play')
│   ├─ PermissionChecker.hasPermission(role, 'member.approve')
│   ├─ PermissionChecker.isInGroup(role, 'admin_group')
│   └─ 권한 객체 반환
│
├─ handleAuthSuccess(authUser)
│   └─ [래더 진행 중 확인] supabase.from('ladder_match_sets').select()
│
├─ handleSetupComplete()
│   └─ withRetry(() => loadUserData(user))
│        └─ isRetryableError(error) 확인
│
├─ reloadProfile()
│   └─ withRetry(() => supabase.from('profiles').select().eq('id', ...))
│
└─ setIsAuthorized(value)
     └─ sessionStorage.setItem('byclan_home_gate', ...)
```

---

## 6️⃣ 래더 매치 데이터 흐름

```
LadderDashboard.js
      │
      ├─ 매치 목록 조회
      │   └─ supabase.from('ladder_match_sets')
      │        .select('*, profiles(*)')   ← host_id FK join (개최자 프로필)
      │        .eq('status', 'waiting')
      │
      ├─ 팀원 프로필 별도 조회
      │   ├─ allTeamIds 수집 (team_a_ids + team_b_ids)
      │   └─ supabase.from('profiles')
      │        .select('id, ByID, discord_name, race')
      │        .in('id', allTeamIds)
      │        → matchProfiles Map (id → profile) 저장
      │
      ├─ 대기열 진입 (Queue Join)
      │   ├─ 권한 확인: permissions.can.playLadder
      │   ├─ Discord 확인: profile.discord_id 존재 여부
      │   └─ supabase.from('profiles').update({ is_in_queue: true })
      │
      └─ 실시간 구독
           └─ supabase.channel('ladder_matches').on('postgres_changes', ...)
                └─ 매치 상태 변경 시 자동 리렌더
```

---

## 7️⃣ 에러 처리 흐름

```
네트워크/DB 오류 발생
      │
      ▼
isRetryableError(error) 확인
  ├─ true  (네트워크 오류, 5xx 서버 오류)
  │    └─ withRetry(fn, { maxRetries: 3, baseDelay: 1000 })
  │         ├─ 1차 시도
  │         ├─ 실패 → 1000ms 후 2차 시도 (지수 백오프)
  │         ├─ 실패 → 2000ms 후 3차 시도
  │         └─ 모두 실패 → 오류 throw
  │
  └─ false (인증 오류, 권한 오류, 404 등)
       └─ 즉시 오류 throw

오류 기록
  └─ logger(Severity.ERROR, '컨텍스트', error)
       ├─ console.error 출력
       └─ NEXT_PUBLIC_SENTRY_DSN 설정 시 Sentry 전송

UI 에러 표시
  ├─ setAuthError(message) → 4초 후 자동 삭제
  ├─ toast.error(message) → ToastContainer 표시
  └─ SectionErrorBoundary → 섹션 단위 에러 격리
```

---

## 8️⃣ 사용자 행동별 데이터 흐름

### 클랜원 가입 신청
```
방문자(visitor)
  → /join 페이지에서 신청서 작성
  → profiles 테이블: role = 'applicant'로 업데이트
  → 운영진(admin/elite 이상) 심사
  → 승인: role = 'rookie' 또는 'associate'
  → 거절: role = 'visitor' 유지
```

### 래더 참여
```
래더 가능 역할(elite/associate/member/rookie/admin/master/developer)
  → permissions.can.playLadder 확인
  → discord_id 존재 확인 (rookie 이상 필요)
  → profiles.is_in_queue = true (대기열 등록)
  → 3명 이상 대기 시 매치 자동 생성 또는 vote_to_start
  → ladder_matches 테이블에 매치 생성
  → 결과 입력: score_a, score_b 업데이트
  → Ladder_MMR 증감
```

### 프로필 편집
```
로그인한 사용자
  → /profile 페이지
  → MyProfile.js 폼 제출
  → profiles.update({ ByID, race, intro })
  → reloadProfile() 호출로 최신 데이터 반영
```
