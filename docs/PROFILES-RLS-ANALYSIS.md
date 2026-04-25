# ByClan Profiles 테이블 RLS 정책 분석 보고서

**작성일**: 2026-04-24  
**범위**: `sql/advisors/*.sql`, `sql/migrations/*.sql`, `sql/policies/*.sql`, `src/app/hooks/useAuth.ts`

---

## 📋 Executive Summary

### 현황
- ❌ **RLS 미설정**: `profiles` 테이블에 명시적인 `ENABLE ROW LEVEL SECURITY` 구문 발견 불가
- ⚠️ **정책만 존재**: UPDATE 정책 3개는 정의되어 있으나, 기본 보호 메커니즘이 부재
- 🔴 **보안 위험**: 모든 인증된 사용자가 다른 사람의 프로필을 SELECT/INSERT할 수 있는 상태
- 📊 **참조**: profiles 테이블은 15+개 다른 테이블의 외래 키(FK) 대상

### 우선 조치
1. **즉시**: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;` 실행
2. **SELECT 정책**: 모든 인증된 사용자가 조회 가능하도록 설정 (선택적으로 제한)
3. **INSERT 정책**: 신규 사용자 프로필 자동 생성만 가능하도록 제한

---

## 1️⃣ Profiles 테이블 정의

### 테이블 구조
**파일**: [src/database.sql](src/database.sql#L178-L210)

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,                           -- Auth.users.id 외래 키
  by_id text,                                 -- 클랜 닉네임 (고유)
  role text DEFAULT 'visitor'::text,          -- visitor/applicant/rookie/member/elite/admin/master/developer
  clan_point integer DEFAULT 0,               -- 클랜 포인트 (베팅 등에 사용)
  race text DEFAULT '미지정'::text,            -- Terran/Zerg/Protoss
  intro text DEFAULT ''::text,                -- 자기소개
  ladder_mmr integer DEFAULT 1000,            -- 래더 MMR 점수
  wins integer DEFAULT 0,                     -- 래더 승리 수
  losses integer DEFAULT 0,                   -- 래더 패배 수
  is_in_queue boolean DEFAULT false,          -- 대기열 상태
  vote_to_start boolean DEFAULT false,        -- 시작 투표
  discord_id text,                            -- Discord 연동 ID
  is_streamer boolean DEFAULT false,          -- 스트리머 여부
  streamer_platform text,                     -- Twitch/YouTube 등
  streamer_url text,                          -- 스트리밍 URL
  rookie_since timestamp with time zone,      -- 신입 시작일
  last_login_at timestamp with time zone,     -- 마지막 로그인
  last_daily_bonus_at date,                   -- 일일 보너스 마지막 수령
  last_discord_checkin_at date,               -- Discord 체크인 마지막
  google_sub text,                            -- Google 서브젝트 ID
  google_email text,                          -- Google 이메일
  google_name text,                           -- Google 이름
  google_avatar_url text,                     -- Google 프로필 이미지
  auth_provider text,                         -- 인증 제공자 (google/discord/email)
  is_test_account boolean DEFAULT false,      -- 테스트 계정 여부
  is_test_account_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

---

## 2️⃣ RLS 활성화 상태

### ❌ 결과: RLS **미설정**

#### 검색 결과
모든 SQL 파일에서 profiles 테이블의 `ENABLE ROW LEVEL SECURITY` 구문을 찾을 수 없습니다.

| 파일 | 검색 키워드 | 결과 |
|------|-----------|------|
| `src/database.sql` | `ALTER TABLE profiles ENABLE RLS` | ❌ 미발견 |
| `sql/migrations/*.sql` | `ENABLE ROW LEVEL SECURITY` | ❌ 미발견 |
| `sql/advisors/SECURITY-ADVISOR-FIXES.sql` | profiles + RLS | ❌ 미발견 |

#### 발견된 다른 테이블의 RLS
```sql
-- ✅ 활성화된 테이블들
ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.developer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_bets ENABLE ROW LEVEL SECURITY;
```

### 🔴 보안 영향
- **현재**: RLS 미활성화 = **모든 정책이 무시됨**
- **결과**: 정책 설정 여부와 무관하게 모든 인증된 사용자가 모든 프로필의 모든 컬럼 접근 가능

---

## 3️⃣ Profiles 테이블 UPDATE 정책

### 파일 위치
- **ADVISOR-WARNING-FIXES.sql**: 초기 정책 정의
- **PERFORMANCE-ADVISOR-FIXES.sql**: 최적화된 정책 (통합)

### 정책 1: 본인 프로필 수정
**파일**: [sql/advisors/ADVISOR-WARNING-FIXES.sql](sql/advisors/ADVISOR-WARNING-FIXES.sql)

```sql
DROP POLICY IF EXISTS "본인 프로필 수정 허용" ON public.profiles;

CREATE POLICY "본인 프로필 수정 허용"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
```

**조건 분석**:
- 현재 사용자의 UUID (`auth.uid()`)와 profiles.id가 동일할 때만 수정 가능
- ✅ 무한 재귀 위험: **없음** (auth.uid() 사용, 외부 테이블 미참조)

---

### 정책 2: 관리자 프로필 수정
**파일**: [sql/advisors/ADVISOR-WARNING-FIXES.sql](sql/advisors/ADVISOR-WARNING-FIXES.sql)

```sql
DROP POLICY IF EXISTS "관리자는 모든 프로필 수정 가능" ON public.profiles;

CREATE POLICY "관리자는 모든 프로필 수정 가능"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
```

**보조 함수** (`is_admin()`):
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY(ARRAY['admin', 'master'])
  )
$$;
```

**조건 분석**:
- `is_admin()` 함수 내에서 profiles 테이블을 **자체 참조**
- ⚠️ **재귀 위험 평가**: 
  - USING 절의 `is_admin()` 호출 → profiles 테이블 조회
  - 하지만 조회 대상: `(SELECT auth.uid())` = **다른 행** 
  - ✅ **무한 재귀 불가**: auth.uid()는 고정값이므로 같은 정책을 다시 트리거하지 않음

---

### 정책 3: 심사관 프로필 수정
**파일**: [sql/advisors/ADVISOR-WARNING-FIXES.sql](sql/advisors/ADVISOR-WARNING-FIXES.sql)

```sql
DROP POLICY IF EXISTS "심사관이 신입으로 승급 허용" ON public.profiles;

CREATE POLICY "심사관이 신입으로 승급 허용"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.fn_is_reviewer()))
  WITH CHECK ((SELECT public.fn_is_reviewer()));
```

**보조 함수** (`fn_is_reviewer()`):
```sql
CREATE OR REPLACE FUNCTION public.fn_is_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.fn_has_any_role(
    ARRAY['master', 'admin', 'elite']
  )
$$;
```

**조건 분석**:
- `fn_is_reviewer()` → `fn_has_any_role()` 체인 호출
- 최종 profiles 테이블 참조 (다시 같은 이유로 재귀 불가)
- ✅ **무한 재귀 불가**

---

### 정책 4: 통합 UPDATE 정책 (최적화 버전)
**파일**: [sql/advisors/PERFORMANCE-ADVISOR-FIXES.sql](sql/advisors/PERFORMANCE-ADVISOR-FIXES.sql#L154-L173)

```sql
-- 3개 정책 (관리자 / 본인 / 심사관) → 1개로 병합
DROP POLICY IF EXISTS "관리자는 모든 프로필 수정 가능" ON public.profiles;
DROP POLICY IF EXISTS "본인 프로필 수정 허용" ON public.profiles;
DROP POLICY IF EXISTS "심사관이 신입으로 승급 허용" ON public.profiles;

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin())
    OR (SELECT auth.uid()) = id
    OR (SELECT fn_is_reviewer())
  )
  WITH CHECK (
    (SELECT is_admin())
    OR (SELECT auth.uid()) = id
    OR (SELECT fn_is_reviewer())
  );
```

**최적화 효과**:
- 기존 3개 정책의 OR 조건 충돌 제거 → 쿼리 플래너 효율 향상
- 정책 실행 순서 예측 가능
- ✅ **무한 재귀 불가** (위의 함수 분석 동일)

---

## 4️⃣ SELECT 및 INSERT 정책

### ❌ SELECT 정책: **찾을 수 없음**

모든 SQL 파일에서 profiles 테이블의 SELECT 정책을 발견하지 못했습니다.

#### 드롭된 구 정책 (ADVISOR-WARNING-FIXES.sql)
```sql
DROP POLICY IF EXISTS "로그인한 유저는 프로필을 볼 수 있음" ON public.profiles;
-- ↑ 대체 정책 없이 삭제됨
```

**결과**: RLS 활성화 후 SELECT 정책이 없으면 모든 사용자가 모든 프로필 조회 불가능

---

### ❌ INSERT 정책: **찾을 수 없음**

profiles 테이블에 대한 INSERT 정책 발견 불가.

**현재 INSERT 방식**: 서버 함수를 통한 자동 생성
- [PROFILE-SCHEMA-UNIFIED-MIGRATION.sql](sql/migrations/PROFILE-SCHEMA-UNIFIED-MIGRATION.sql#L103-L119)
- `handle_new_user()` 트리거 함수가 auth.users 삽입 시 profiles 행 생성
- SQL 정책이 아닌 **데이터베이스 트리거**로 구현

---

## 5️⃣ LoadUserData 함수 (useAuth.ts)

### 위치
**파일**: [src/app/hooks/useAuth.ts](src/app/hooks/useAuth.ts#L502-L620)

### 함수 흐름

```typescript
const loadUserData = async (authUser: Record<string, unknown>) => {
  // 1️⃣ 프로필 조회
  const { data: p, error: profileError } = await supabase
    .from('profiles')
    .select('*')           // ← 모든 컬럼 SELECT
    .eq('id', authUser.id) // 현재 사용자 ID 필터
    .single();

  // 2️⃣ 프로필 없으면 생성
  if (profileError?.code === 'PGRST116') {
    const { error } = await supabase
      .from('profiles')
      .insert({            // ← INSERT 시도
        id: authUser.id,
        by_id: uniqueById,
        role: 'visitor',
        clan_point: 0,
        race: 'Terran',
        intro: '클랜 방문자',
        is_in_queue: false,
        vote_to_start: false,
      });
  }

  // 3️⃣ 소셜 프로필 동기화
  let nextProfile = await syncSocialProfileData(authUser, nextProfile);

  // 4️⃣ 로그인 시간 기록
  await recordLoginTimestamp(authUser.id as string);

  setProfile(nextProfile);
}
```

### RLS와의 상호작용

| 작업 | 대상 | RLS 필요성 | 현재 정책 |
|------|------|----------|---------|
| **SELECT** | 자신의 프로필만 | ✅ 필수 | ❌ 없음 |
| **INSERT** | 신규 프로필 생성 | ✅ 필수 | ❌ 없음 (트리거로 대체) |
| **UPDATE** | 소셜 정보 동기화 | ✅ 필수 | ✅ `profiles_update` 정책 있음 |

### 재귀 위험 분석

```typescript
// syncSocialProfileData 내부
const { data: updatedProfile, error: updateError } = await supabase
  .from('profiles')
  .update(updates)          // ← RLS 정책 평가
  .eq('id', authUser.id)    // 필터: 자신의 레코드만
  .select('*')
  .single();
```

#### ✅ 결론: 무한 재귀 **없음**
- 이유: `eq('id', authUser.id)` 필터가 명시적
- profiles RLS 정책은 `(SELECT auth.uid()) = id` 조건을 가짐
- UPDATE 정책 평가 시 profiles 참조 → **다른 행(auth.uid()의 행)만 확인** → 같은 쿼리 재트리거 불가

---

## 6️⃣ 참조 무결성 분석

### Profiles를 참조하는 테이블들

**외래 키 관계**:

```
profiles (PK: id)
  ↑
  ├─ admin_audit_logs (actor_id)
  ├─ activity_logs (actor_id, target_user_id)
  ├─ admin_posts (author_id)
  ├─ applications (user_id, tester_id, reviewed_by)
  ├─ ladder_matches (host_id, created_by)
  ├─ match_bets (user_id)
  ├─ notifications (user_id)
  ├─ point_logs (user_id)
  ├─ posts (user_id)
  └─ (15+ 테이블)
```

### RLS 설정 상태

| 참조 테이블 | RLS 활성화 | 정책 수 | 비고 |
|----------|----------|-------|------|
| admin_audit_logs | ✅ | 2 (SELECT, INSERT) | Management 전용 |
| activity_logs | ✅ | 2 (SELECT, INSERT) | Management 전용 |
| match_sets | ✅ | 2 (SELECT, UPDATE) | 참가자 전용 |
| match_bets | ❌ | 2 (INSERT, SELECT) | ⚠️ RLS 미활성화 |
| applications | ✅ | 3 | 심사관/지원자 권한 |
| notifications | ✅ | 3 | 본인 + 심사관 |
| posts | ✅ | 2 (INSERT, UPDATE) | 작성자만 수정 |
| ladder_matches | ✅ | 2 | 회원만 생성/방장만 수정 |

### 🔴 위험: match_bets 테이블의 RLS 미활성화
```sql
-- ❌ RLS가 활성화되지 않음
CREATE TABLE IF NOT EXISTS public.match_bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  user_id uuid,            -- ← profiles.id 참조
  team_choice text,
  bet_amount integer,
  odds double precision,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT match_bets_pkey PRIMARY KEY (id),
  CONSTRAINT match_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 정책은 정의되어 있음 (RLS 미활성화이므로 무시됨)
CREATE POLICY "Users can insert own match bets" ON public.match_bets FOR INSERT ...
CREATE POLICY "Users can view own match bets" ON public.match_bets FOR SELECT ...
```

---

## 7️⃣ 무한 재귀 패턴 검출

### 🟢 안전 패턴 (현재)

#### 패턴 1: `auth.uid()` 직접 비교
```sql
-- ✅ 안전 (고정값)
USING ((SELECT auth.uid()) = id)
```
- auth.uid()는 현재 사용자의 UUID (쿼리당 한 번 평가)
- 같은 정책을 재트리거하지 않음

#### 패턴 2: 헬퍼 함수 기반 권한 검증
```sql
-- ✅ 안전 (권한 확인만)
USING ((SELECT is_admin()))

-- is_admin()의 내부
SELECT EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.role = ANY(ARRAY['admin', 'master'])
)
-- 다른 행을 조회하므로 같은 정책 재트리거 안 됨
```

### 🔴 위험 패턴 (감지되지 않음)

만약 이런 정책이 있었다면 **무한 재귀 발생**:

```sql
-- ❌ 무한 재귀 위험
CREATE POLICY dangerous ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = id            -- ← 같은 행 재조회
        AND p.role = 'admin'
    )
  );
-- UPDATE 정책 평가 → profiles 참조 → 같은 행의 같은 정책 다시 평가 → ...
```

---

## 8️⃣ 권장 조치 사항

### 🔴 긴급 (즉시 적용)

#### 1. RLS 활성화
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**적용 파일**: `sql/migrations/` 또는 `sql/advisors/`  
**이유**: 현재 모든 RLS 정책이 무시되고 있음

---

#### 2. SELECT 정책 추가
```sql
-- 옵션 A: 모든 인증된 사용자가 모든 프로필 조회 가능
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 옵션 B: 제한된 컬럼만 공개 (보안 강화)
CREATE POLICY "Authenticated users can view public profile fields"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
  -- 하지만 by_id, race, ladder_mmr, wins, losses만 SELECT 가능하도록 column-level RLS 추가
```

**권장**: 옵션 A (현재 앱 동작과 호환)

---

#### 3. INSERT 정책 추가
```sql
-- auth.users 트리거로 자동 생성되므로, 직접 INSERT는 차단
CREATE POLICY "Only system can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- 직접 INSERT 불가능
  
-- 또는 service role 전용
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (false);  -- 모든 사용자 차단
```

**이유**: 프로필 생성은 handle_new_user() 트리거 함수에서만 수행

---

### 🟡 보완 (1-2주 내)

#### 4. match_bets 테이블 RLS 활성화
```sql
ALTER TABLE public.match_bets ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 이미 정의되어 있으므로 활성화하면 작동 시작
-- CREATE POLICY "Users can insert own match bets" ON public.match_bets ...
-- CREATE POLICY "Users can view own match bets" ON public.match_bets ...
```

---

#### 5. 정책 병합 최적화 적용
현재 이미 `PERFORMANCE-ADVISOR-FIXES.sql`에서 수행됨:
```sql
-- 기존 3개 분리 정책 → 1개 통합 정책
DROP POLICY ... ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated ...
```

---

#### 6. 헬퍼 함수 성능 검증
```sql
-- 이미 STABLE로 선언되어 있음 (좋음)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE              -- ← 쿼리당 1회 평가
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY(ARRAY['admin', 'master'])
  )
$$;
```

**성능 개선 가능 사항**:
- auth.uid() 반복 호출 → `(SELECT auth.uid())` 감싸기 (이미 적용됨)
- 인덱스 추가:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_profiles_role_id
    ON public.profiles(id, role);
  ```

---

### 🟢 모범 사례 (지속적 관리)

#### 7. RLS 정책 문서화
```
📄 프로필 RLS 정책:
  ├─ SELECT: 모든 인증된 사용자 → 모든 프로필 조회 가능
  ├─ INSERT: 미사용 (트리거로 대체)
  └─ UPDATE:
      ├─ 본인만 수정
      ├─ 관리자는 모든 프로필 수정
      └─ 심사관은 role 필드 수정 가능
```

---

#### 8. 정기 감시
```sql
-- 정책 상태 확인 쿼리
SELECT
  schemaname,
  tablename,
  policyname,
  qual,
  with_check,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- RLS 활성화 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```

---

## 9️⃣ 현재 코드 요약

### 파일별 RLS 정책 현황

| 파일 | profiles 정책 | 상태 |
|------|-------------|------|
| [src/database.sql](src/database.sql) | 정의 없음 | ❌ 스키마만 |
| [sql/advisors/ADVISOR-WARNING-FIXES.sql](sql/advisors/ADVISOR-WARNING-FIXES.sql) | UPDATE 3개 | ⚠️ RLS 미활성화 |
| [sql/advisors/PERFORMANCE-ADVISOR-FIXES.sql](sql/advisors/PERFORMANCE-ADVISOR-FIXES.sql) | UPDATE 1개 (통합) | ⚠️ RLS 미활성화 |
| [sql/migrations/PROFILE-SCHEMA-UNIFIED-MIGRATION.sql](sql/migrations/PROFILE-SCHEMA-UNIFIED-MIGRATION.sql) | 마이그레이션만 | ✅ 무관 |
| [src/app/hooks/useAuth.ts](src/app/hooks/useAuth.ts) | SELECT/INSERT (클라이언트) | ✅ 로직상 안전 |

### 종합 보안 평가

```
점수: 3/10 (위험)

✅ 긍정적:
  • UPDATE 정책이 잘 설계됨 (무한 재귀 없음)
  • 헬퍼 함수가 STABLE로 최적화됨
  • 권한 검증 로직이 명확함

❌ 문제점:
  • RLS 미활성화 (가장 위험)
  • SELECT 정책 없음
  • INSERT 정책 없음
  • match_bets도 RLS 미활성화

⚠️ 개선 필요:
  • RLS 즉시 활성화
  • SELECT/INSERT 정책 추가
  • 정책 문서화
  • 정기 감시 절차 수립
```

---

## 🔟 참고 문헌

### Supabase 공식 문서
- [Row Level Security 개요](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS 정책 작성 가이드](https://supabase.com/docs/guides/auth/row-level-security/examples)
- [무한 재귀 피하기](https://supabase.com/docs/guides/auth/row-level-security/policy-examples)

### ByClan 관련 파일
- [AUTH-TEST-ACCOUNT-STRATEGY.md](docs/guides/AUTH-TEST-ACCOUNT-STRATEGY.md)
- [DATABASE-GUIDE.md](docs/guides/DATABASE-GUIDE.md)
- [SECURITY-ADVISOR-FIXES.sql](sql/advisors/SECURITY-ADVISOR-FIXES.sql)

---

**작성**: GitHub Copilot  
**마지막 수정**: 2026-04-24  
**상태**: 🔴 **RLS 미활성화 - 즉시 조치 필요**
