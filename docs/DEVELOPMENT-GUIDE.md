# ByClan Web 개발자 가이드

**작성일**: 2026-05-21  
**대상**: 신규 개발자, 팀 멤버  
**상태**: v1.0 - 기본 가이드 완성

---

## 📚 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [개발 워크플로우](#개발-워크플로우)
4. [코드 스타일 및 컨벤션](#코드-스타일-및-컨벤션)
5. [테스트 작성](#테스트-작성)
6. [주요 패턴 및 Best Practices](#주요-패턴-및-best-practices)
7. [자주 묻는 질문](#자주-묻는-질문)
8. [문제 해결](#문제-해결)

---

## 🚀 개발 환경 설정

### 1. 사전 요구사항
```bash
# 필수 버전
- Node.js 24.x
- npm >= 10
- Git

# 확인 방법
node --version    # v24.x.x 확인
npm --version     # 10.x 이상 확인
```

### 2. 프로젝트 클론 및 설치
```bash
# 1. 저장소 클론
git clone https://github.com/gkfla0720a/byclan-web.git
cd byclan-web

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일 생성 (프로젝트 루트)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Supabase 프로젝트 설정에서 URL과 KEY를 복사하세요
```

### 3. 로컬 개발 서버 시작
```bash
# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 다른 포트에서 실행
npm run dev -- -p 3001

# 빌드 및 프로덕션 서버 실행
npm run build
npm start
```

### 4. IDE 설정 (VS Code 권장)
```bash
# 추천 확장프로그램 설치
- ESLint (Microsoft)
- Prettier (Esbenp)
- TypeScript Vue Plugin (Vue)
- Tailwind CSS IntelliSense (Bradlley Schofield)

# .vscode/settings.json 자동 포맷팅 설정
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 📁 프로젝트 구조

```
byclan-web/
├── docs/                 # 개발 문서
│   ├── TESTING-STRATEGY.md
│   ├── DEVELOPMENT-GUIDE.md (이 파일)
│   └── README.md
│
├── src/
│   ├── app/              # Next.js 앱 라우터 (페이지 및 레이아웃)
│   │   ├── (main)/       # 메인 영역 라우트
│   │   ├── api/          # API 라우트
│   │   ├── auth/         # 인증 관련
│   │   └── layout.jsx    # 루트 레이아웃
│   │
│   ├── components/       # 재사용 가능한 UI 컴포넌트
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── AdminBoard.js
│   │   └── ...
│   │
│   ├── views/            # 페이지 레벨 컴포넌트
│   │   ├── HomeContent.tsx
│   │   ├── ClanMembers.tsx
│   │   ├── MatchRecords.tsx
│   │   └── ...
│   │
│   ├── hooks/            # 커스텀 React 훅
│   │   ├── useAuth.ts         # 인증 상태
│   │   ├── useLadderData.ts   # 래더 데이터
│   │   ├── useMatchCenter.ts  # 매치 중심 로직
│   │   └── ...
│   │
│   ├── services/         # API 통합 레이어
│   │   ├── applicationService.ts
│   │   ├── memberService.ts
│   │   └── ...
│   │
│   ├── stores/           # Zustand 상태 관리
│   │   └── useAuthStore.ts
│   │
│   ├── context/          # React Context
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.js
│   │
│   ├── utils/            # 유틸리티 함수 (비즈니스 로직)
│   │   ├── matchMaking.ts   # 팀 빌딩 알고리즘
│   │   ├── pointSystem.ts   # 포인트 시스템
│   │   ├── permissions/     # 권한 검증
│   │   ├── joinProcess.ts   # 입장 프로세스
│   │   └── ...
│   │
│   ├── types/            # TypeScript 타입 정의
│   │   ├── domain.ts      # 비즈니스 도메인 타입
│   │   ├── supabase.ts    # Supabase 자동 생성 타입
│   │   └── ...
│   │
│   ├── globals.css       # 글로벌 스타일
│   └── supabase.ts       # Supabase 클라이언트 설정
│
├── tests/                # 테스트 파일
│   ├── unit/             # 단위 테스트
│   │   ├── accountId.test.ts
│   │   ├── matchMaking.test.ts
│   │   └── ...
│   ├── integration/      # 통합 테스트
│   └── e2e/              # E2E 테스트
│
├── scripts/              # 유틸리티 스크립트
│   ├── seed/             # 데이터 시딩
│   └── verification/     # 워크플로우 검증
│
├── public/               # 정적 파일 (이미지 등)
├── jest.config.js        # Jest 설정
├── jest.setup.js         # Jest 초기화
├── tsconfig.json         # TypeScript 설정
├── next.config.mjs       # Next.js 설정
└── package.json          # 의존성 관리
```

### 핵심 폴더별 책임
| 폴더 | 책임 | 예시 |
|------|------|------|
| `app/` | 라우팅 및 레이아웃 | 페이지 구조, API 엔드포인트 |
| `components/` | 재사용 UI 컴포넌트 | 버튼, 모달, 테이블 |
| `views/` | 페이지 규모 뷰 | 홈페이지, 대시보드 |
| `hooks/` | React 로직 캡슐화 | 데이터 페칭, 상태 관리 |
| `services/` | API 통합 | Supabase 쿼리 래핑 |
| `utils/` | 순수 비즈니스 로직 | MMR 계산, 팀 빌딩 |
| `types/` | 타입 정의 | 인터페이스, 타입 별칭 |

---

## 🔄 개발 워크플로우

### 1. 브랜치 전략
```bash
# 브랜치 네이밍
main              # 프로덕션 배포 브랜치
develop           # 개발 브랜치
feature/...       # 기능 개발 (예: feature/ladder-mmr-fix)
bugfix/...        # 버그 수정 (예: bugfix/match-creation-error)
docs/...          # 문서 작업 (예: docs/api-guide)

# 작업 시작
git checkout -b feature/new-feature
git pull origin develop   # 최신 코드 동기화

# 커밋 메시지
# ✅ 좋은 예
git commit -m "feat: 래더 MMR 계산 알고리즘 개선"
git commit -m "fix: 매치 생성 시 팀 구성 오류 수정"
git commit -m "docs: 개발 가이드 추가"

# ❌ 나쁜 예
git commit -m "fix stuff"
git commit -m "update"
```

### 2. PR (Pull Request) 워크플로우
```bash
# 1. 기능 개발 완료 후 커밋
git add .
git commit -m "feat: 새로운 기능 설명"

# 2. 푸시
git push origin feature/new-feature

# 3. GitHub에서 PR 생성
# - Base: develop
# - Compare: feature/new-feature
# - 제목: "feat: 기능 설명"
# - 설명: 변경사항 상세 설명

# 4. 리뷰 대기 및 피드백 반영
# 5. Approve 후 merge
```

### 3. 일반적인 개발 사이클
```
1. 이슈 선택 및 브랜치 생성
   ↓
2. 코드 작성 및 테스트
   npm run test                # 테스트 작성
   npm run dev                 # 로컬 테스트
   npm run lint                # 린팅 체크
   ↓
3. 커밋 및 푸시
   git add .
   git commit -m "feat: ..."
   git push origin feature/...
   ↓
4. PR 생성 및 리뷰
   ↓
5. Merge 및 배포
```

---

## 🎨 코드 스타일 및 컨벤션

### 1. TypeScript 규칙
```typescript
// ✅ 좋은 예: 명시적인 타입 지정
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(userId: string): Promise<User> {
  // ...
}

// ❌ 나쁜 예: any 사용
function getUser(userId: any): any {
  // ...
}

// ✅ 좋은 예: 유니온 타입 활용
type Role = 'admin' | 'member' | 'guest';

// ✅ 좋은 예: Strict null checking
const value: string | null = getValue();
if (value !== null) {
  console.log(value.length);
}
```

### 2. React 컴포넌트 패턴
```typescript
// ✅ 함수형 컴포넌트 (권장)
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ 클래스 컴포넌트 (구식)
class Button extends React.Component {
  // ...
}
```

### 3. Hook 사용 규칙
```typescript
// ✅ 좋은 예: 커스텀 훅 분리
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}

// ❌ 나쁜 예: 컴포넌트 내 복잡한 로직
function UserProfile({ userId }: Props) {
  const [user, setUser] = useState(null);
  // 로직이 섞여있음
}
```

### 4. 파일/함수 네이밍
```typescript
// 파일
✅ matchMaking.ts        (소문자 카멜케이스)
✅ useAuth.ts            (훅은 use 접두사)
✅ UserProfile.tsx       (컴포넌트는 PascalCase)
❌ MatchMaking.ts        (컴포넌트 아닌데 PascalCase)
❌ use_auth.ts           (스네이크케이스 금지)

// 함수/변수
✅ const buildTeams = () => {}
✅ const getUserName = () => {}
✅ const isValidEmail = () => {}
❌ const BuldTeams = () => {}
❌ const get_user_name = () => {}
```

### 5. 주석 작성 가이드
```typescript
// ✅ 좋은 예: 의도를 설명하는 주석
// MMR 차이가 최소가 되도록 팀을 구성합니다
function buildBalancedTeams(players: Player[]) {
  // ...
}

// ❌ 나쁜 예: 코드를 반복하는 주석
// count를 1 증가시킴
count++;

// ✅ 좋은 예: 복잡한 로직 설명
/**
 * 선택하는 조합을 모두 시도하여 MMR 차이가 가장 적은 팀을 찾습니다
 * 시간 복잡도: O(C(n,k)) - 조합 개수만큼 비교
 * @param players - 플레이어 목록
 * @param perTeam - 팀당 인원
 * @returns 가장 균형잡힌 팀 배치
 */
```

---

## 🧪 테스트 작성

### 1. 테스트 환경
```bash
# 테스트 실행
npm test                      # 모든 테스트 실행
npm test -- accountId         # 특정 테스트만 실행
npm test -- --watch           # 감시 모드
npm test -- --coverage        # 커버리지 리포트

# 테스트 디렉토리 구조
tests/
├── unit/                # 단위 테스트 (빠른 속도)
│   ├── accountId.test.ts
│   └── matchMaking.test.ts
├── integration/         # 통합 테스트 (중간 속도)
└── e2e/                 # E2E 테스트 (느린 속도)
```

### 2. 단위 테스트 작성
```typescript
// tests/unit/example.test.ts
import { buildTeams } from '@/utils/matchMaking';

describe('buildTeams', () => {
  // ARRANGE: 테스트 데이터 준비
  const mockPlayers = [
    { id: '1', mmr: 1000 },
    { id: '2', mmr: 900 },
    { id: '3', mmr: 100 },
    { id: '4', mmr: 200 },
  ];

  // ACT & ASSERT
  it('인원이 부족하면 null을 반환해야 한다', () => {
    const result = buildTeams([{ id: '1', mmr: 1000 }], 3, 'balance');
    expect(result).toBeNull();
  });

  it('MMR 차이를 최소화하는 팀을 구성해야 한다', () => {
    const result = buildTeams(mockPlayers, 2, 'balance');
    
    expect(result).not.toBeNull();
    expect(result?.teamA).toHaveLength(2);
    expect(result?.teamB).toHaveLength(2);
  });
});
```

### 3. Mock 사용
```typescript
// Supabase 클라이언트 모킹
jest.mock('@/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    })),
  },
}));

// 함수 모킹
const mockGetPlayerMmr = jest.fn((player) => player.mmr);
```

### 4. 테스트 작성 체크리스트
```
[ ] 테스트 파일이 작성되었나?
[ ] 정상 케이스가 테스트되나?
[ ] 에러 케이스가 테스트되나?
[ ] 엣지 케이스가 고려되었나? (null, undefined, 빈 배열 등)
[ ] Mock이 올바르게 설정되었나?
[ ] 테스트가 독립적인가? (다른 테스트에 영향 없음)
[ ] 테스트 이름이 명확한가?
[ ] 테스트 커버리지가 80% 이상인가?
```

---

## 💡 주요 패턴 및 Best Practices

### 1. Supabase 쿼리 패턴
```typescript
// ✅ 좋은 예: 타입 안전성
import { supabase } from '@/supabase';

const { data, error } = await supabase
  .from('profiles')
  .select('id, name, mmr')
  .eq('id', userId)
  .single();

if (error) {
  console.error('프로필 조회 실패:', error);
  return null;
}

return data; // 타입 안전 (Database 타입 자동 완성)

// ❌ 나쁜 예: 타입 없음
const result = await supabase.from('profiles').select('*').single();
```

### 2. React Query 패턴
```typescript
// ✅ 좋은 예: React Query 사용
import { useQuery } from '@tanstack/react-query';

function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
  });
}

// ✅ 사용
function UserCard({ userId }: Props) {
  const { data: profile, isLoading, error } = useUserProfile(userId);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생</div>;
  return <div>{profile?.name}</div>;
}
```

### 3. 비즈니스 로직 분리
```typescript
// ✅ 좋은 예: 순수 함수 (테스트하기 쉬움)
// utils/matchMaking.ts
export function buildTeams(players, perTeam, sortOption) {
  // 부작용 없는 순수 함수
  return { teamA, teamB };
}

// ✅ 사용
// hooks/useMatchCenter.ts
function useMatchCenter() {
  const { data: players } = useQuery(...);
  const teams = buildTeams(players, 3, 'balance');
  return { teams };
}
```

### 4. 에러 처리 패턴
```typescript
// ✅ 좋은 예: 명확한 에러 처리
async function createLadderMatch(matchData) {
  try {
    const { data, error } = await supabase
      .from('ladder_matches')
      .insert([matchData])
      .select()
      .single();

    if (error) {
      throw new Error(`매치 생성 실패: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('매치 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
}

// ✅ 사용
const result = await createLadderMatch(matchData);
if (!result.success) {
  toast.error(result.error);
}
```

### 5. 로깅 패턴
```typescript
// ✅ 좋은 예: 구조화된 로깅
console.error('[pointSystem] grantPoints 실패:', {
  userId,
  amount,
  error: error.message,
});

// ✅ Sentry 통합
import * as Sentry from "@sentry/browser";
Sentry.captureException(error, {
  tags: { context: 'pointSystem' },
});

// ❌ 나쁜 예: 무분별한 로깅
console.log('something');
console.log(data);
```

---

## ❓ 자주 묻는 질문

### Q1. TypeScript strict mode는 언제 해제할 수 있나요?
**A**: strict mode는 항상 활성 상태를 유지해야 합니다. any 타입이 필요한 경우는 `@ts-ignore` 또는 `as unknown as Type`으로 명시해주세요. 이를 통해 의도적인 타입 무시임을 명확히 합니다.

### Q2. 컴포넌트는 어디에 만드나요? (components vs views)
**A**:
- `components/`: 재사용 가능한 UI 컴포넌트 (Button, Modal, Table 등)
- `views/`: 페이지 규모의 로직이 담긴 뷰 (HomeContent, MatchRecords 등)

### Q3. 새로운 라우트를 추가하려면?
**A**: `src/app` 폴더에 폴더를 생성하고 `page.jsx` 또는 `page.tsx` 파일을 만드세요. Next.js App Router가 자동으로 라우팅해줍니다.

### Q4. 테스트를 실패하면?
**A**: 아래 순서로 체크하세요:
1. Jest 설정 (`jest.config.js`, `jest.setup.js`) 확인
2. Mock이 올바르게 설정되었나 확인
3. `npm test -- --clearCache` 실행 후 재시도
4. node_modules 삭제 후 `npm install` 재실행

### Q5. 데이터베이스 스키마가 변경되면?
**A**: Supabase 타입을 동기화하세요:
```bash
npx supabase login
npx supabase gen types typescript --project-id mmsmedvdwmisewngmuka --schema public > src/types/supabase.ts
```

---

## 🔧 문제 해결

### 문제: "모듈을 찾을 수 없습니다" 에러
```bash
# 해결 방법 1: 캐시 초기화
npm run dev  # 종료
npm cache clean --force
npm install

# 해결 방법 2: 경로 별칭 확인
# tsconfig.json에서 "@/*" -> "./src/*" 매핑 확인
```

### 문제: 테스트가 실패합니다
```bash
# 해결 방법
npm test -- --clearCache
npm test -- --testNamePattern="failed test name"

# 디버그 모드
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 문제: 타입 에러가 계속 나타납니다
```bash
# 해결 방법
npm run build  # 전체 빌드 확인
npm run lint   # ESLint 확인

# IDE에서 TypeScript 재로드 (VS Code)
Cmd+Shift+P > TypeScript: Restart TS Server
```

### 문제: 로컬에서 작동하지만 배포 시 오류
```bash
# 해결 방법 1: 프로덕션 빌드 로컬 테스트
npm run build
npm start

# 해결 방법 2: 환경 변수 확인
# Vercel/배포 플랫폼에서 환경 변수 설정 확인
```

---

## 📖 참고 자료

### 공식 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [Supabase 문서](https://supabase.com/docs)
- [TailwindCSS 문서](https://tailwindcss.com/docs)

### 테스트
- [Jest 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### 상태 관리
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [React Query 문서](https://tanstack.com/query/latest)

---

## 🎯 개발 체크리스트

### 새 기능 개발 시
- [ ] 브랜치 생성 (`feature/...`)
- [ ] TypeScript 타입 정의
- [ ] 함수/컴포넌트 구현
- [ ] 테스트 작성 (최소 80% 커버리지)
- [ ] `npm run lint` 통과
- [ ] `npm test` 통과
- [ ] `npm run build` 성공
- [ ] PR 생성 및 리뷰

### PR 리뷰 시 확인사항
- [ ] TypeScript 타입이 명시적인가?
- [ ] 테스트가 충분한가?
- [ ] 코드 스타일이 일관성있는가?
- [ ] 주석이 명확한가?
- [ ] 에러 처리가 적절한가?

---

**질문이나 개선 사항은 팀 채널에 공유해주세요! 🎉**
