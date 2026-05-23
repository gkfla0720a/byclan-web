# ByClan Web 테스트 전략 및 아키텍처

**작성일**: 2026-05-21  
**상태**: 구축 중

---

## 📋 목차
1. [테스트 철학](#테스트-철학)
2. [테스트 피라미드](#테스트-피라미드)
3. [테스트 종류별 설명](#테스트-종류별-설명)
4. [환경 설정](#환경-설정)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [실행 명령어](#실행-명령어)

---

## 🎯 테스트 철학

### 왜 테스트가 필요한가?

ByClan Web은 래더 매치, MMR 산정, 포인트 시스템 등 **금전적·경쟁적 가치가 있는 데이터**를 다룹니다.

**테스트의 목표:**
- ✅ **신뢰성**: 핵심 로직이 의도대로 동작하는지 보장
- ✅ **회귀 방지**: 변경 시 기존 기능 파괴 방지
- ✅ **문서화**: 코드의 의도와 동작을 테스트로 명시
- ✅ **안전한 리팩토링**: 자신감 있게 코드 개선
- ✅ **버그 조기 발견**: 배포 전에 문제 포착

**테스트 우선순위 기준:**
1. **높음**: 금전 거래, 권한 검증, MMR/순위 계산
2. **중간**: 데이터 변환, 폼 검증, 상태 관리
3. **낮음**: UI 표현, 스타일링, 애니메이션

---

## 📊 테스트 피라미드

```
        /\
       /  \     E2E (10%)
      /────\    - 사용자 시나리오 (로그인 → 매치 → 완료)
     /      \   - Playwright/Cypress
    /────────\
   /          \  통합 (30%)
  /            \ - 워크플로우 테스트
 /──────────────\- API/DB 상호작용
/                \
─────────────────  단위 (60%)
- 개별 함수 테스트
- 빠른 실행, 높은 격리도
- Jest + 순수 함수 중심
```

**각 레이어의 특징:**

| 레이어 | 비율 | 속도 | 격리도 | 도구 | 예시 |
|--------|------|------|--------|------|------|
| **단위** | 60% | ⚡ 매우 빠름 | 높음 | Jest | `buildTeams()` 함수 |
| **통합** | 30% | 🐢 중간 | 중간 | Jest + supertest | MMR 계산 워크플로우 |
| **E2E** | 10% | 🐌 느림 | 낮음 | Playwright | 사용자 전체 흐름 |

---

## 🧪 테스트 종류별 설명

### 1️⃣ 단위 테스트 (Unit Tests) - 60%

**목적**: 개별 함수/모듈이 정확히 동작하는지 검증

**테스트 대상** (우선순위순):

#### A. 비즈니스 로직 (매우 높음)
```typescript
// src/utils/matchMaking.ts
- buildTeams() - 팀 구성 알고리즘 (balance, top, bottom)
- MATCH_TYPES 검증

// src/utils/pointSystem.ts
- grantPoints() - 포인트 지급
- deductPoints() - 포인트 차감
- RANK_BONUS 검증
- checkAndGrantDailyBonus() - 출석 보상

// src/utils/joinProcess.ts
- 클랜 입장 승인/거절 로직

// src/utils/profiles.ts
- 프로필 조회/업데이트
```

#### B. 데이터 변환 (높음)
```typescript
// src/utils/accountId.ts
- normalizeAccountId() - 계정 ID 정규화
- buildInternalAuthEmail() - 이메일 생성
- extractAccountIdFromAuthUser() - 계정 ID 추출

// src/utils/permissions/
- 권한 검증 함수들
```

#### C. 유틸리티 (중간)
```typescript
// src/utils/statusConstants.ts
// src/utils/errorLogger.ts
// src/utils/retry.ts
```

**예시 테스트:**
```typescript
describe('matchMaking.buildTeams', () => {
  it('인원이 부족하면 null을 반환해야 한다', () => {
    const players = [{ id: '1', mmr: 100 }];
    const result = buildTeams(players, 3, 'balance');
    expect(result).toBeNull();
  });

  it('balance 옵션으로 균형잡힌 팀을 구성해야 한다', () => {
    const players = [
      { id: '1', mmr: 1000 },
      { id: '2', mmr: 900 },
      { id: '3', mmr: 100 },
      { id: '4', mmr: 200 },
    ];
    const result = buildTeams(players, 2, 'balance');
    
    expect(result).not.toBeNull();
    expect(result.teamA).toHaveLength(2);
    expect(result.teamB).toHaveLength(2);
    // 두 팀의 MMR 합계가 유사해야 함
  });
});
```

### 2️⃣ 통합 테스트 (Integration Tests) - 30%

**목적**: 여러 모듈이 함께 제대로 작동하는지 검증

**테스트 시나리오** (우선순위순):

#### A. 워크플로우 (매우 높음)
```typescript
// 래더 매치 전체 흐름
describe('래더 매치 워크플로우', () => {
  it('매치 생성 → 세트 진행 → MMR 적용 → 순위 업데이트 완료', async () => {
    // 1. 프로필 생성
    // 2. 매치 등록
    // 3. 세트 진행 (1,2,3세트)
    // 4. 매치 완료 → 트리거 실행
    // 5. MMR/순위 업데이트 확인
  });
});

// 클랜 입장 신청 흐름
describe('클랜 입장 프로세스', () => {
  it('신청 → 테스터 검증 → 승인 → 포인트 지급', async () => {
    // 신청 생성 → 상태 변경 → 포인트 로그 확인
  });
});

// 배팅 정산 흐름
describe('매치 배팅 정산', () => {
  it('배팅 생성 → 매치 완료 → 자동 정산 (승리시 x2)', async () => {
    // 배팅 기록 → 매치 완료 → 정산 로그 확인
  });
});
```

#### B. API 통합 (높음)
```typescript
// hooks 테스트
describe('useAuth 훅', () => {
  it('로그인 후 사용자 데이터 로드', async () => {
    // Supabase 클라이언트 모킹
    // 훅 렌더링
    // 상태 변경 확인
  });
});

describe('useLadderData 훅', () => {
  it('래더 데이터 페칭 및 정렬', async () => {
    // 쿼리 모킹
    // 로딩/에러 상태 확인
  });
});
```

### 3️⃣ E2E 테스트 (E2E Tests) - 10%

**목적**: 실제 사용자 시나리오를 브라우저에서 검증

**주요 시나리오** (Playwright 예정):

```typescript
// 신규 사용자 첫 경험
describe('신규 사용자 온보딩', () => {
  it('로그인 → 프로필 작성 → 홈 → 래더 조회 가능', async () => {
    // 로그인 페이지 이동
    // 계정 입력
    // 프로필 정보 입력
    // 홈 페이지 로드 확인
  });
});

// 매치 참여 흐름
describe('사용자가 매치에 참여한다', () => {
  it('매치 생성 → 입장 → 준비 → 게임 진행 → 완료', async () => {
    // 래더 페이지
    // 매치 찾기/생성
    // 입장
    // 경기 결과 입력
  });
});
```

---

## ⚙️ 환경 설정

### Jest 설치 및 설정

**1. 패키지 설치:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
npm install --save-dev @types/jest jest-environment-jsdom
```

**2. jest.config.js 생성:**
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    '!src/components/**', // 나중에 추가
  ],
};
```

**3. jest.setup.js 생성:**
```javascript
import '@testing-library/jest-dom';

// Supabase 클라이언트 모킹 (전역)
jest.mock('@/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));
```

### TypeScript 테스트 타입 설정

tsconfig.json에 추가:
```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

---

## 📝 테스트 작성 가이드

### 1. 테스트 파일 구조

```
src/
└── utils/
    ├── matchMaking.ts
    └── __tests__/
        └── matchMaking.test.ts    ← 같은 폴더 내 __tests__ 폴더
        
또는

tests/
├── unit/
│   ├── matchMaking.test.ts
│   ├── pointSystem.test.ts
│   └── accountId.test.ts
├── integration/
│   ├── workflow.test.ts
│   └── hooks.test.ts
└── e2e/
    └── scenarios.spec.ts
```

### 2. 테스트 작성 패턴 (AAA 패턴)

```typescript
describe('기능명', () => {
  // ARRANGE: 테스트 데이터 준비
  const mockPlayers = [
    { id: '1', mmr: 1000 },
    { id: '2', mmr: 900 },
  ];

  // ACT: 함수 실행
  it('예상되는 동작을 한다', () => {
    const result = buildTeams(mockPlayers, 1, 'balance');

    // ASSERT: 결과 검증
    expect(result).toBeDefined();
    expect(result?.teamA).toHaveLength(1);
  });
});
```

### 3. 테스트 네이밍 컨벤션

```typescript
✅ 좋은 예:
it('인원이 부족하면 null을 반환해야 한다')
it('balance 옵션으로 MMR 차이를 최소화한 팀을 구성해야 한다')
it('포인트가 음수이면 에러를 반환해야 한다')

❌ 나쁜 예:
it('works')
it('test buildTeams')
it('should handle case')  // 너무 일반적
```

### 4. Mock 및 Stub 패턴

```typescript
// Supabase 클라이언트 모킹
const mockSupabase = {
  from: jest.fn((table) => ({
    select: jest.fn().mockResolvedValue({
      data: mockData[table],
      error: null,
    }),
    update: jest.fn().mockResolvedValue({ error: null }),
  })),
};

// 테스트에서 사용
jest.mock('@/supabase', () => ({
  supabase: mockSupabase,
}));
```

### 5. 비동기 함수 테스트

```typescript
it('포인트를 지급하고 로그를 기록해야 한다', async () => {
  const result = await grantPoints(mockSb, 'user-1', 100, 'test');
  
  expect(result.ok).toBe(true);
  expect(mockSb.from).toHaveBeenCalledWith('point_logs');
  expect(mockSb.from).toHaveBeenCalledWith('notifications');
});
```

---

## 🚀 실행 명령어

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 파일 테스트
npm test matchMaking.test.ts

# 감시 모드 (파일 변경시 자동 실행)
npm test -- --watch

# 커버리지 리포트
npm test -- --coverage

# 특정 테스트 스위트만 실행
npm test -- --testNamePattern="buildTeams"
```

### package.json에 추가할 스크립트

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern='tests/unit'",
    "test:integration": "jest --testPathPattern='tests/integration'",
    "test:e2e": "playwright test"
  }
}
```

---

## 📈 테스트 커버리지 목표

| 레이어 | 목표 | 타임라인 |
|--------|------|---------|
| utils/ | 90% | 1주 |
| hooks/ | 80% | 1.5주 |
| services/ | 80% | 2주 |
| components/ (핵심) | 60% | 3주 |
| **전체** | **80%** | **3주** |

---

## 🔍 체크리스트

### Phase 1: 기초 구축 (이번주)
- [ ] Jest + @testing-library 설치
- [ ] jest.config.js 생성
- [ ] jest.setup.js 생성
- [ ] 테스트 파일 구조 생성
- [ ] 첫 번째 단위 테스트 작성 (accountId.test.ts)

### Phase 2: 핵심 로직 테스트 (1.5주)
- [ ] matchMaking.test.ts - 팀 구성 알고리즘
- [ ] pointSystem.test.ts - 포인트 지급/차감
- [ ] permissions.test.ts - 권한 검증
- [ ] joinProcess.test.ts - 입장 프로세스

### Phase 3: 통합 테스트 (2주)
- [ ] 래더 매치 워크플로우 테스트
- [ ] useAuth 훅 테스트
- [ ] useLadderData 훅 테스트
- [ ] API 통합 테스트

### Phase 4: E2E 테스트 (3주)
- [ ] Playwright 설치
- [ ] 신규 사용자 온보딩 시나리오
- [ ] 매치 참여 흐름
- [ ] 배팅 정산 흐름

---

## 📚 참고자료

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library 문서](https://testing-library.com/react)
- [Testing Library Best Practices](https://testing-library.com/best-practices)
- [테스트 피라미드 원칙](https://martinfowler.com/bliki/TestPyramid.html)

---

**다음 단계**: Jest 설치 및 첫 번째 테스트 파일 생성
