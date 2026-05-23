# 개인적인 코드 학습을 포함한 프로젝트 개선 플랜

계획: 시나리오의 흐름을 따라 시작파트(사용자 입력) 부터 AuthProvider로 앱에 공유하기 까지 천천히 공부하면서 파트마다 코드를 점검합니다.

### 시나리오: 로그인부터 프로필 표시까지

```
사용자 입력
"아이디: junho"
"비밀번호: MyP@ss123"
"LOGIN 클릭"
         │
         ↓
    ┌─────────────────────────────┐
    │ AuthForm.tsx                │
    │ handleSubmit() (라인 110)    │
    └────────┬────────────────────┘
             │
             │ getLoginEmailFromInput()로 변환
             ↓ "login.junho@auth.byclan.local"
             │
    ┌─────────────────────────────────────────────┐
    │ supabase.auth.signInWithPassword()           │
    │ (src/supabase.ts의 supabase 객체 사용)      │
    └────────┬────────────────────────────────────┘
             │
             │ HTTPS 암호화 연결
             ↓
    ┌─────────────────────────────┐
    │ 🌐 Supabase 서버            │
    │ 인증 처리                   │
    └────────┬────────────────────┘
             │
             │ access_token + refresh_token 반환
             ↓
    ┌─────────────────────────────────────────────┐
    │ 토큰이 localStorage에 자동 저장              │
    │ (persistSession: true)                      │
    │                                             │
    │ localStorage["supabase.auth.token"]         │
    │ = {access_token: "...", ...}               │
    └────────┬────────────────────────────────────┘
             │
             │ onAuthStateChange 발동
             ↓
    ┌─────────────────────────────────────────────┐
    │ useAuthSession.ts (라인 26-34)              │
    │ event = "SIGNED_IN"                         │
    │ setUser(session?.user)                      │
    └────────┬────────────────────────────────────┘
             │
             │ useProfileData의 useEffect 발동 (user 변경)
             ↓
    ┌─────────────────────────────────────────────┐
    │ fetchAndSetProfile() (라인 119)             │
    │ user 객체로 프로필 조회 시작                │
    └────────┬────────────────────────────────────┘
             │
             │ 토큰이 자동으로 포함된 HTTP 요청
             ↓
    ┌─────────────────────────────────────────────┐
    │ Supabase → 4개 쿼리 병렬 실행               │
    │                                             │
    │ 쿼리1: profiles 테이블 조회                 │
    │ 쿼리2: profile_oauth 조회                   │
    │ 쿼리3: profile_meta 조회                    │
    │ 쿼리4: ladder_rankings 조회                 │
    └────────┬────────────────────────────────────┘
             │
             │ 모든 데이터 반환
             ↓
    ┌─────────────────────────────────────────────┐
    │ mergeOAuthIntoProfile() (라인 65)            │
    │ syncSocialProfileData() (라인 75)            │
    │                                             │
    │ 데이터들 병합 및 동기화                      │
    └────────┬────────────────────────────────────┘
             │
             │ nextProfile 객체 완성
             ↓
    ┌─────────────────────────────────────────────┐
    │ setProfile(nextProfile) (라인 155)          │
    │                                             │
    │ React 상태 업데이트                         │
    └────────┬────────────────────────────────────┘
             │
             │ AuthContext에 포함됨
             ↓
    ┌─────────────────────────────────────────────┐
    │ AuthProvider로 전체 앱에 공유                │
    │                                             │
    │ 모든 컴포넌트가 접근 가능:                  │
    │ const { profile } = useAuthContext()        │
    └────────┬────────────────────────────────────┘
             │
             ↓
    ✅ 프로필 완성!
    
    앱에서 표시:
    • 닉네임: "By_Protoss_Master"
    • 역할: "rookie"
    • 포인트: 1000 CP
    • 게임 전적: MMR 1500점
    • Discord 연동 여부: 확인됨
```

---

## 📊 함수 호출 관계도

```
주요 함수들의 호출 관계:

useAuth() (메인 오케스트레이터)
  ├── useAuthSession()
  │   ├── supabase.auth.getUser()
  │   └── supabase.auth.onAuthStateChange()
  │
  └── useProfileData(user)
      ├── fetchAndSetProfile()
      │   ├── supabase.from('profiles').select()
      │   ├── mergeOAuthIntoProfile()
      │   │   ├── supabase.from('profile_oauth').select()
      │   │   ├── supabase.from('profile_meta').select()
      │   │   └── supabase.from('ladder_rankings').select()
      │   │
      │   └── syncSocialProfileData()
      │       ├── getSocialIdentity()
      │       ├── resolveUniqueById()
      │       ├── supabase.from('profiles').update()
      │       └── supabase.from('profile_oauth').upsert()
      │
      └── normalizeProfileRow()


로그인 흐름:
AuthForm.tsx
  ├── getLoginEmailFromInput()
  │   └── buildInternalAuthEmail()
  └── supabase.auth.signInWithPassword()
      └── onAuthStateChange() 발동
          └── useAuthSession의 setUser() 호출
              └── useProfileData의 fetchAndSetProfile() 호출


회원가입 흐름:
usePasswordSignUp() (useAuthMutations.js)
  ├── supabase.from('profiles').select() (중복확인)
  ├── supabase.auth.signUp()
  └── supabase.from('profiles').insert() (프로필 생성)


소셜 연동 흐름:
MyProfile.tsx (handleLinkDiscord)
  ├── supabase.auth.linkIdentity()
  └── readLinkResultFromUrl() (콜백 처리)
      └── reloadProfile() 호출
          └── useProfileData의 fetchAndSetProfile() 호출
```

---

## 🎯 핵심 정리

### 📌 최초 진입 시 일어나는 일

```
1️⃣ 앱 로드
   ↓
2️⃣ AuthProvider가 useAuth() 실행
   ↓
3️⃣ useAuthSession이 localStorage에서 토큰 확인
   ↓
4️⃣ 토큰 있으면? → 유효성 검사 → 사용자 정보 복구
   없으면? → 로그인 필요 상태로 표시
   ↓
5️⃣ useProfileData가 프로필 로드 (있으면)
   ↓
6️⃣ 모든 정보가 Context에 저장
   ↓
✅ 앱 준비 완료!
```

### 📌 토큰은 언제 갱신되는가?

```
autoRefreshToken: true 설정 덕분에:

1️⃣ 매 요청 전에 토큰 만료 시간 확인
   ↓
2️⃣ 만료 예정? → refresh_token으로 새 토큰 요청
   ↓
3️⃣ 새 토큰 받음 → localStorage 업데이트
   ↓
4️⃣ 사용자는 아무것도 모름! (자동 처리)
   ↓
5️⃣ 거의 로그아웃되지 않음!
```

### 📌 비밀번호는 절대 앱에서 저장하지 않는다

```
흐름:

비밀번호 입력
   ↓
HTTPS로 암호화
   ↓
Supabase 서버로 전송
   ↓
Supabase가 받아서 해시 후 자신의 DB에만 저장
   ↓
앱 서버나 일반 DB에는 저장 안 함!
   ↓
대신 토큰을 받아서 저장
   ↓
이후 모든 요청에 이 토큰만 사용
```

---
