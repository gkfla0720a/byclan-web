# ByClan 데이터베이스 완전 가이드

> 코딩 초보자를 위한 ByClan 데이터베이스 구조, 사용법, 장단점 설명서

---

## 📌 목차

1. [데이터베이스란?](#1-데이터베이스란)
2. [ByClan이 사용하는 Supabase란?](#2-byclan이-사용하는-supabase란)
3. [테이블 구조 상세 설명](#3-테이블-구조-상세-설명)
4. [SQL 쿼리 파일 분석 (sql/queries/DATABASE-QUERIES.sql)](#4-sql-쿼리-파일-분석)
5. [데이터 흐름 (어떻게 연결되나?)](#5-데이터-흐름)
6. [RLS (행 수준 보안) 이해하기](#6-rls-행-수준-보안)
7. [인덱스 (성능 최적화)](#7-인덱스)
8. [Supabase 사용법 (코드에서)](#8-supabase-사용법)
9. [장점과 단점](#9-장점과-단점)
10. [자주 묻는 질문 (FAQ)](#10-자주-묻는-질문)
11. [SQL 파일별 역할 요약](#11-sql-파일별-역할-요약)

---

## 1. 데이터베이스란?

**데이터베이스(Database)**는 정보를 체계적으로 저장하고 꺼내 쓸 수 있는 "디지털 창고"입니다.

엑셀 표(스프레드시트)와 비슷하게 생각하면 됩니다:
- 각 **테이블(Table)** = 엑셀의 시트
- 각 **열(Column)** = 엑셀의 컬럼 제목 (예: 이름, 나이, 역할)
- 각 **행(Row)** = 실제 데이터 한 줄 (예: 홍길동, 25, 클랜원)

---

## 2. ByClan이 사용하는 Supabase란?

**Supabase**는 다음 기능을 한 번에 제공하는 클라우드 서비스입니다:

| 기능 | 설명 | ByClan에서 사용 |
|------|------|-----------------|
| **PostgreSQL** | 데이터 저장 DB | 프로필, 매치, 신청서 저장 |
| **Auth(인증)** | 로그인/로그아웃 | Discord OAuth 로그인 |
| **Realtime** | 실시간 데이터 구독 | 래더 큐 실시간 업데이트 |
| **RLS** | 행 수준 보안 정책 | 내 데이터만 읽기/쓰기 허용 |
| **Storage** | 파일 저장 | (현재 미사용) |

### 연결 방법
```javascript
// src/supabase.js 에서 초기화
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 3. 테이블 구조 상세 설명

### 3-1. `profiles` 테이블 (사용자 프로필)

ByClan 클랜원의 모든 정보를 저장합니다.

| 컬럼명 | 타입 | 설명 | 예시 값 |
|--------|------|------|---------|
| `id` | UUID | 기본 키. Supabase Auth의 사용자 ID와 동일 | `a1b2c3d4-...` |
| `ByID` | TEXT | 클랜 내 고유 닉네임 | `By_홍길동` |
| `discord_name` | TEXT | Discord 사용자 이름 | `홍길동#1234` |
| `discord_id` | TEXT | Discord 고유 번호 (래더 필수) | `123456789012345678` |
| `role` | TEXT | 클랜 역할 (권한 수준 결정) | `member`, `elite`, `admin` |
| `points` | INT | 클랜 활동 포인트 | `150` |
| `race` | TEXT | 스타크래프트 종족 | `Terran`, `Zerg`, `Protoss` |
| `intro` | TEXT | 자기소개 문구 | `안녕하세요!` |
| `Ladder_MMR` | INT | 래더 레이팅 (기본값: 1000) | `1250` |
| `is_in_queue` | BOOL | 현재 래더 대기열 참여 중 여부 | `true` / `false` |
| `vote_to_start` | BOOL | 래더 시작 투표 여부 | `true` / `false` |
| `wins` | INT | 래더 승리 수 | `30` |
| `losses` | INT | 래더 패배 수 | `20` |
| `queue_joined_at` | TIMESTAMP | 대기열 합류 시간 | `2026-01-15 14:30:00+09` |
| `promoted_at` | TIMESTAMP | 마지막 역할 승격 시간 | `2026-02-01 10:00:00+09` |
| `promoted_by` | UUID | 승격시킨 관리자의 ID | `b2c3d4e5-...` |
| `created_at` | TIMESTAMP | 계정 생성 시간 | `2026-01-01 00:00:00+09` |

**역할(role) 값 설명:**

| 역할 값 | 한국어 이름 | 레벨 | 설명 |
|---------|-----------|------|------|
| `developer` | 개발자 | 100 | 시스템 개발 및 모든 권한 |
| `master` | 마스터 | 90 | 클랜 총괄 운영자 |
| `admin` | 관리자 | 80 | 클랜 일반 운영자 |
| `elite` | 정예 | 60 | 경험 있는 클랜원 |
| `associate` | 테스트신청자 | 50 | 테스트 신청 단계 |
| `member` | 일반 클랜원 | 50 | 정식 클랜원 |
| `rookie` | 신입 길드원 | 35 | 신규 가입자 (2주) |
| `applicant` | 신규 가입자 | 25 | 테스트 대기 중 |
| `visitor` | 방문자 | 10 | 로그인만 완료 |

---

### 3-2. `ladder_record` 및 `ladder_match_sets` (래더 매치 기록)

- **`ladder_record`**: 유저 개인 기준으로 변경된 경기 본체 기록 테이블입니다. (기존 `ladder_matches` 역할 대체)
- **`ladder_match_sets`**: 다수의 사용자가 래더 시스템을 통해 경기를 치를 때, 하나의 매치에 포함된 세부 경기(세트)마다의 승패 및 여러 정보를 저장합니다.

### 3-3. `ladder_rankings` 테이블 (래더 랭킹)

랭킹 보드에 기록하기 위한 테이블입니다. (기존 `ladders` 대체)

- 포함되어야 할 정보: `mmr`, `경기 승패 기록`, `승률`, `선호 종족`, `by_id` 등

---

### 3-4. `applications` 테이블 (가입/승급 신청서)

클랜 가입 및 승급 신청 리스트를 저장합니다. 가입 테스터의 정보와 메모도 같이 보관합니다.

| 컬럼명 | 타입 | 설명 | 예시 값 |
|--------|------|------|---------|
| `id` | UUID | 기본 키 | `d4e5f6g7-...` |
| `user_id` | UUID | 신청자의 프로필 ID | `a1b2c3d4-...` |
| `discord_name` | TEXT | 신청 당시 Discord 이름 | `홍길동#1234` |
| `status` | TEXT | 신청 상태 | `대기`, `승인`, `거절` |
| `test_result` | JSONB | 테스트 결과 (JSON 형태) | `{"score": 85, "pass": true}` |
| `tester_id` | UUID | 테스트를 진행한 운영진 ID | `b2c3d4e5-...` |
| `created_at` | TIMESTAMP | 신청 시간 | `2026-01-10 09:00:00+09` |
| `processed_at` | TIMESTAMP | 처리 완료 시간 | `2026-01-12 14:00:00+09` |

---

### 3-5. `notifications` 테이블 (알림)

사용자에게 보내는 알림 목록을 저장합니다.

| 컬럼명 | 타입 | 설명 | 예시 값 |
|--------|------|------|---------|
| `id` | UUID | 기본 키 | `e5f6g7h8-...` |
| `user_id` | UUID | 알림 수신자 ID | `a1b2c3d4-...` |
| `title` | TEXT | 알림 제목 | `가입 신청 승인` |
| `message` | TEXT | 알림 내용 | `클랜 가입이 승인되었습니다!` |
| `is_read` | BOOL | 읽음 여부 | `false` |
| `created_at` | TIMESTAMP | 알림 발송 시간 | `2026-01-12 14:00:00+09` |

---

### 3-6. `clanpoint_logs` 및 `mmr_logs` (포인트 및 MMR 로그)

- **`clanpoint_logs`**: 클랜 포인트(cp) 변경 내역을 저장합니다. (기존 `point_logs`)
- **`mmr_logs`**: 트리거 발동을 통해 클랜원의 MMR 포인트 변경 내역을 저장합니다.

### 3-7. `developer_settings` 테이블 (개발자 도구 목록)

개발자 도구 목록 및 시스템 설정값을 저장합니다.

| 컬럼명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `key` | TEXT | 설정 키 이름 | `test_accounts_enabled` |
| `value_bool` | BOOL | Boolean 설정값 | `true` |

---

### 3-8. `match_bets` 테이블 (매치 배팅 내역)

각 매치에 대한 배팅 내역 처리 목록을 저장합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 기본 키 |
| `user_id` | UUID | 베팅한 사용자 ID |
| `match_id` | UUID | 베팅 대상 매치 ID |
| `amount` | INT | 베팅한 포인트 수 |
| `team` | TEXT | 베팅한 팀 (`A` 또는 `B`) |
| `created_at` | TIMESTAMP | 베팅 시간 |

---

### 3-9. 게시판 및 커뮤니티 관련 테이블

- **`admin_posts`**: 운영자 전용 게시판입니다.
- **`notice_posts`**: 공지사항 게시판입니다.
- **`comments`**: 게시글의 댓글 목록을 저장합니다.
- **`post_votes`**: 자유게시판의 추천, 비추천 선택 여부를 기록합니다. (추후 다른 게시판 기록도 추가 예정)

---

### 3-10. 시스템 감사 및 기타 테이블

- **`admin_audit_logs`**: 관리자(admin)의 활동 내역 로그이며 감사 수단입니다.
- **`v_manual_activity_review`**: 감사 목적의 뷰/테이블이지만 아직 코드가 완벽히 정립되지 않았습니다.
- **무시해도 되는 테이블 (외부 참고자료)**: `latest_rankings`, `legacy_matches`, `player_analytics`, `synergy_scores`

---

## 4. SQL 쿼리 파일 분석

### sql/queries/DATABASE-QUERIES.sql 섹션별 설명

이 파일은 **Supabase SQL Editor**에서 직접 실행하는 관리용 쿼리 모음입니다.

#### 섹션 1: 프로필 테이블 스키마 확인
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```
→ profiles 테이블에 어떤 컬럼이 있는지 확인합니다.
→ **언제 사용?** 새 기능을 추가하거나 테이블 구조가 맞는지 확인할 때

#### 섹션 2: promotion_logs 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS promotion_logs (...)
```
→ 역할 변경 이력 테이블을 없으면 생성합니다.
→ `IF NOT EXISTS`로 이미 있어도 에러가 발생하지 않습니다.

#### 섹션 3: ladder_record 구조 확인
→ 래더 매치 기록 테이블 컬럼 목록 확인

#### 섹션 4: 역할별 사용자 확인
```sql
SELECT id, discord_name, role FROM profiles WHERE role = 'visitor';
```
→ 특정 역할을 가진 사용자 목록을 봅니다.

#### 섹션 5: applications 테이블 수정
```sql
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS test_result JSONB,
ADD COLUMN IF NOT EXISTS tester_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
```
→ 기존 테이블에 새 컬럼을 추가합니다.
→ `IF NOT EXISTS`로 이미 있어도 안전합니다.
→ `JSONB`는 JSON 데이터를 저장하는 타입입니다 (유연한 구조).
→ `REFERENCES profiles(id)`는 외래 키 제약 (profiles 테이블의 id와 연결).

#### 섹션 6: 가입 신청 현황 확인
```sql
SELECT a.id, a.discord_name, a.status, a.created_at, p.role as profile_role
FROM applications a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;
```
→ `JOIN`: 두 테이블을 연결해서 함께 보여줍니다.
→ `LEFT JOIN`: 왼쪽(applications)에 데이터가 있으면 오른쪽(profiles)에 없어도 결과에 포함.
→ 신청서와 해당 사용자의 역할을 한 번에 조회합니다.

#### 섹션 7: 역할별 통계
```sql
SELECT role, COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM profiles GROUP BY role ORDER BY COUNT(*) DESC;
```
→ `SUM(COUNT(*)) OVER()`: 윈도우 함수 - 전체 합계를 계산해 비율 산출
→ 각 역할의 사용자 수와 전체 대비 비율을 계산합니다.

#### 섹션 8: Discord 연동 상태 확인
→ 역할별로 Discord 연동된 사용자 수와 비율 집계
→ `COUNT(discord_id) FILTER (WHERE discord_id IS NOT NULL)`: 조건부 카운트

#### 섹션 10: 인덱스 생성
```sql
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
-- 변경 필요: 개인 기준 테이블인 ladder_record 구조에 맞춘 인덱스로 재설정해야 합니다.
```
→ 자주 검색하는 컬럼에 인덱스를 만들어 쿼리 속도를 높입니다.
→ `GIN 인덱스`: 배열 컬럼 검색에 최적화된 인덱스 유형

#### 섹션 11: 데이터 정리 쿼리 (주의 필요!)
```sql
DELETE FROM applications
WHERE status = '대기' AND created_at < NOW() - INTERVAL '30 days';
```
→ 30일 이상 된 대기 신청을 삭제합니다.
→ ⚠️ **실행 전 반드시 백업하세요!** 삭제된 데이터는 복구 불가

#### 섹션 12: 테스트 데이터 생성
→ 개발 환경에서 래더 매치 테스트 데이터를 추가합니다.
→ `WHERE NOT EXISTS`: 이미 데이터가 있으면 추가하지 않습니다.

#### 섹션 13: RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'applications', 'ladder_matches', 'ladders')
ORDER BY tablename, policyname;
```
→ 현재 적용된 RLS 보안 정책 목록을 확인합니다.

#### 섹션 15: 백업 쿼리 (가장 중요!)
```sql
CREATE TABLE profiles_backup AS SELECT * FROM profiles;
```
→ 현재 데이터를 그대로 복사한 백업 테이블을 만듭니다.
→ **중요 작업 전에 항상 실행하세요!**

---

## 5. 데이터 흐름

### 신규 가입자 흐름
```
1. Discord 로그인
   ↓
2. Supabase Auth에 사용자 등록 (auth.users 테이블)
   ↓
3. useAuth.ts → profiles 테이블에 없으면 자동 생성
   - role: 'visitor'
   - discord_name, discord_id 자동 설정
   - Ladder_MMR: 1000 (기본값)
   ↓
4. 사용자가 가입 신청 → applications 테이블에 저장
   ↓
5. 운영진이 승인 → profiles.role = 'applicant' → 'rookie' 또는 'member'
   ↓
6. promotion_logs에 역할 변경 기록 저장
```

### 래더 매치 흐름
```
1. 사용자가 대기열 참여 → profiles.is_in_queue = true
   ↓
2. 충분한 인원 모이면 → ladder_matches 테이블에 새 행 생성
   - status: '모집중'
   ↓
3. 팀 구성 완료 → status: '진행중'
   ↓
4. 게임 결과 입력 → score_a, score_b 업데이트
   - status: '완료'
   ↓
5. 참가자 Ladder_MMR, wins/losses 업데이트
```

---

## 6. RLS (행 수준 보안)

### RLS란?
**Row Level Security (행 수준 보안)**는 테이블의 각 행에 대한 접근을 제어합니다.

예를 들어:
- 내 프로필은 나만 수정 가능
- 다른 사람의 비밀 데이터는 볼 수 없음
- 관리자는 모든 데이터 조회 가능

### sql/policies/MATCH-BETS-RLS.sql 분석

```sql
-- match_bets 테이블에 RLS 활성화
alter table if exists public.match_bets enable row level security;

-- 내 베팅만 볼 수 있는 정책
create policy "Users can view own match bets"
  on public.match_bets
  for select          -- 읽기(SELECT) 작업에 적용
  to authenticated    -- 로그인한 사용자에게만 적용
  using (auth.uid() = user_id);  -- 내 user_id와 같은 행만 허용

-- 내 베팅만 추가할 수 있는 정책
create policy "Users can insert own match bets"
  on public.match_bets
  for insert          -- 쓰기(INSERT) 작업에 적용
  to authenticated
  with check (auth.uid() = user_id);  -- 추가하려는 user_id가 내 것이어야 함
```

**핵심 개념:**
- `auth.uid()`: 현재 로그인한 사용자의 UUID를 반환하는 함수
- `using`: 읽기(SELECT) 조건
- `with check`: 쓰기(INSERT/UPDATE) 조건

---

## 7. 인덱스

### 인덱스란?
책의 **색인(목차)**와 같습니다. 색인이 없으면 내용을 찾으려고 책 전체를 뒤져야 하지만, 색인이 있으면 바로 원하는 페이지로 이동할 수 있습니다.

### ByClan의 인덱스 목록

```sql
-- profiles 테이블
idx_profiles_role        → role 컬럼 검색 최적화 (역할별 필터링)
idx_profiles_created_at  → 가입 시간 정렬 최적화
idx_profiles_discord_id  → Discord ID 검색 최적화 (NULL 값은 제외)

-- applications 테이블
idx_applications_status      → 신청 상태별 필터링 최적화
idx_applications_user_id     → 특정 사용자 신청서 조회 최적화
idx_applications_created_at  → 신청 시간 정렬 최적화

-- ladder_matches 테이블
idx_ladder_matches_status    → 매치 상태별 필터링 최적화
idx_ladder_matches_created_at → 매치 시간 정렬 최적화
idx_ladder_matches_team_a    → A팀 멤버 검색 최적화 (GIN 인덱스)
idx_ladder_matches_team_b    → B팀 멤버 검색 최적화 (GIN 인덱스)
```

**GIN 인덱스 특별 설명:**
- `GIN (Generalized Inverted Index)`: 배열, JSON 등 복합 타입에 사용
- `team_a_ids`는 UUID 배열이므로 일반 B-Tree 인덱스 불가 → GIN 사용
- 예: "이 유저가 A팀에 있는 매치 찾기" 같은 쿼리가 매우 빠름

---

## 8. Supabase 사용법

### 데이터 읽기 (SELECT)
```javascript
// 모든 프로필 조회
const { data, error } = await supabase
  .from('profiles')    // 테이블 선택
  .select('*');        // 모든 컬럼 선택 (* = 전체)

// 특정 조건으로 조회
const { data } = await supabase
  .from('profiles')
  .select('ByID, role, Ladder_MMR')  // 특정 컬럼만
  .eq('role', 'elite')                  // role = 'elite'인 행만
  .order('Ladder_MMR', { ascending: false })  // 래더 MMR 내림차순
  .limit(10);                           // 최대 10개만
```

### 데이터 추가 (INSERT)
```javascript
const { error } = await supabase
  .from('profiles')
  .insert({
    id: userId,
    ByID: 'By_홍길동',
    role: 'visitor',
    Ladder_MMR: 1000,
  });
```

### 데이터 수정 (UPDATE)
```javascript
const { error } = await supabase
  .from('profiles')
  .update({ role: 'member' })    // 변경할 값
  .eq('id', targetUserId);       // 어떤 행을 수정할지
```

### 데이터 삭제 (DELETE)
```javascript
const { error } = await supabase
  .from('applications')
  .delete()
  .eq('id', applicationId);
```

### 실시간 구독 (Realtime)
```javascript
// 래더 큐 변경사항을 실시간으로 받기
const channel = supabase
  .channel('ladder-queue')
  .on('postgres_changes', {
    event: '*',           // 모든 이벤트 (INSERT/UPDATE/DELETE)
    schema: 'public',
    table: 'profiles',
    filter: 'is_in_queue=eq.true'  // 대기열에 있는 사용자만
  }, (payload) => {
    console.log('대기열 변경:', payload);
    // 화면 업데이트 처리
  })
  .subscribe();
```

---

## 9. 장점과 단점

### 🟢 장점

#### Supabase 전반
| 장점 | 설명 |
|------|------|
| **빠른 개발** | 백엔드 서버 없이 DB + Auth + Realtime을 한 번에 제공 |
| **PostgreSQL 기반** | 강력하고 신뢰할 수 있는 오픈소스 DB |
| **무료 티어 제공** | 소규모 프로젝트는 무료로 운영 가능 |
| **RLS 지원** | 서버 코드 없이 데이터 보안 정책 적용 가능 |
| **실시간 기능** | WebSocket 없이 실시간 데이터 구독 가능 |
| **관리 대시보드** | SQL Editor, 테이블 뷰어 등 편리한 관리 UI |
| **TypeScript 지원** | 타입 안전성 확보 가능 |

#### ByClan 데이터 설계의 장점
| 장점 | 설명 |
|------|------|
| **UUID 기본 키** | 충돌 없는 전역 고유 ID |
| **인덱스 최적화** | 자주 쓰는 컬럼에 인덱스로 쿼리 속도 향상 |
| **GIN 인덱스** | 배열 컬럼(team_ids) 검색 최적화 |
| **JSONB 활용** | test_result처럼 구조가 다양한 데이터 유연하게 저장 |
| **외래 키** | 참조 무결성 보장 (존재하지 않는 user_id 입력 불가) |
| **승격 로그** | 역할 변경 이력 추적 가능 |
| **IF NOT EXISTS** | 쿼리 재실행 시 중복 오류 방지 |

---

### 🔴 단점 및 한계

#### Supabase 한계
| 단점 | 설명 | 해결 방법 |
|------|------|-----------|
| **무료 플랜 제한** | 월 50,000 행 읽기, 500MB 스토리지 한도 | 유료 플랜 업그레이드 |
| **콜드 스타트** | 7일 이상 미사용 시 프로젝트 일시 중단 | 유료 플랜 또는 주기적 접속 |
| **벤더 락인** | Supabase 종속적이라 마이그레이션 어려움 | 표준 PostgreSQL 기능 최대한 활용 |
| **복잡한 RLS** | 정책이 많아지면 디버깅 어려움 | RLS 정책 최소화, 문서화 철저히 |

#### ByClan 설계의 단점
| 단점 | 설명 | 개선 방안 |
|------|------|-----------|
| **team_ids 배열** | GIN 인덱스는 B-Tree보다 느림 (write 시) | 별도 team_members 테이블 분리 고려 |
| **테스트 데이터 미분리** | is_test_data 컬럼 미구현으로 실데이터 혼용 가능 | DB 컬럼 추가 후 filterVisibleTestData 활성화 |
| **Ladder_MMR 기본값** | 모두 1000으로 시작해 초기 랭킹 의미 없음 | 첫 게임 후 MMR 계산 보정 알고리즘 도입 |
| **역할 경로 불일치** | ROLE_CHANGE_RULES의 'guest' vs DB의 'visitor' | 코드와 DB 역할명 통일 필요 |
| **joinProcess.js 미구현** | 가입 처리 로직이 비어 있음 | 구현 필요 |
| **백업 자동화 없음** | 수동 쿼리로만 백업 가능 | Supabase Point-in-Time Recovery 활성화 |
| **CASCADE 삭제** | `ON DELETE CASCADE`로 프로필 삭제 시 승격 기록 모두 삭제 | 논리 삭제(soft delete) 고려 |

---

## 10. 자주 묻는 질문

### Q: UUID가 뭔가요?
**A:** Universally Unique IDentifier의 약자로, `a1b2c3d4-e5f6-7890-abcd-ef1234567890` 같은 형태의 고유 번호입니다. 전 세계에서 겹칠 확률이 거의 0에 수렴합니다.

### Q: TIMESTAMP WITH TIME ZONE이 뭔가요?
**A:** 날짜+시간+시간대 정보를 함께 저장하는 타입입니다. `2026-01-15 14:30:00+09`에서 `+09`는 한국 시간(UTC+9)을 의미합니다. 시간대를 포함하면 다른 나라 서버에서도 시간이 정확합니다.

### Q: JSONB와 JSON의 차이는?
**A:** 둘 다 JSON 데이터를 저장하지만, JSONB는 저장 시 파싱해서 이진 형태로 최적화합니다. 검색/조회가 빠르고 인덱스도 걸 수 있어 JSONB를 권장합니다.

### Q: 외래 키(REFERENCES)가 뭔가요?
**A:** 다른 테이블의 키를 참조하는 제약입니다. `tester_id UUID REFERENCES profiles(id)`는 "tester_id에 넣는 값은 반드시 profiles 테이블의 id에 존재해야 한다"는 규칙입니다. 없는 사용자 ID를 넣으면 오류가 발생합니다.

### Q: Supabase에서 SQL을 직접 실행하려면?
**A:**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. ByClan 프로젝트 선택
3. 왼쪽 메뉴 → **SQL Editor** 클릭
4. 쿼리 입력 후 **Run** 버튼 클릭

---

## 11. SQL 파일별 역할 요약

| 파일명 | 역할 | 실행 시점 |
|--------|------|-----------|
| `sql/queries/DATABASE-QUERIES.sql` | 구조 확인, 컬럼 추가, 인덱스 생성, 데이터 조회 등 일반 관리 쿼리 모음 | 필요할 때마다 |
| `sql/policies/MATCH-BETS-RLS.sql` | match_bets 테이블 RLS(보안 정책) 설정 | 최초 1회 |
| `sql/migrations/TEST-DATA-SEED.sql` | 개발용 테스트 계정 및 데이터 생성 | 개발 환경에서만 |
| `sql/migrations/STREAMER-FIELDS-MIGRATION.sql` | 스트리머 관련 필드 추가 마이그레이션 | 해당 기능 배포 시 |
| `sql/migrations/PROFILE-DATA-BACKFILL.sql` | 기존 프로필 데이터 보완/정리 | 데이터 정합성 작업 시 |

### 실행 권장 순서 (처음 설정할 때)

```
1단계: sql/queries/DATABASE-QUERIES.sql (섹션 1,3,5) - 현재 구조 확인
2단계: sql/queries/DATABASE-QUERIES.sql (섹션 2,5)  - 필요한 테이블/컬럼 추가
3단계: sql/policies/MATCH-BETS-RLS.sql               - 보안 정책 설정
4단계: sql/queries/DATABASE-QUERIES.sql (섹션 10)   - 인덱스 생성
5단계: sql/migrations/TEST-DATA-SEED.sql             - 개발용 테스트 데이터 (개발 환경만)
```

> ⚠️ **주의:** 섹션 11 (데이터 삭제), 섹션 15 (백업)은 반드시 데이터 상태를 확인 후 신중하게 실행하세요.

---

*이 문서는 ByClan 웹 프로젝트의 데이터베이스 구조를 코딩 초보자도 이해할 수 있도록 작성되었습니다.*
*최종 업데이트: 2026-04-06*
