# 신규 개발자 온보딩 체크리스트

**작성일**: 2026-05-21  
**목적**: 신규 개발자가 빠르게 프로젝트에 적응하도록 돕기  
**예상 소요 시간**: 3-4시간

---

## ✅ Phase 1: 환경 설정 (30분)

### 기본 설정
- [ ] **Git 저장소 클론**
  ```bash
  git clone https://github.com/gkfla0720a/byclan-web.git
  cd byclan-web
  ```

- [ ] **Node.js 버전 확인**
  ```bash
  node --version  # v24.x 확인
  npm --version   # 10.x 이상 확인
  ```

- [ ] **의존성 설치**
  ```bash
  npm install  # 약 5분 소요
  ```

- [ ] **환경 변수 설정**
  ```bash
  # 프로젝트 루트에 .env.local 생성
  NEXT_PUBLIC_SUPABASE_URL=[Supabase URL]
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[Anon Key]
  # 값은 Supabase 프로젝트 설정에서 복사
  ```

### IDE 설정 (VS Code)
- [ ] **필수 확장 설치**
  - ESLint (Microsoft)
  - Prettier (Esbenp)
  - TypeScript Vue Plugin
  - Tailwind CSS IntelliSense

- [ ] **.vscode/settings.json 생성** (자동 포맷팅)
  ```json
  {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
  ```

### 로컬 개발 서버 구동
- [ ] **개발 서버 시작**
  ```bash
  npm run dev
  # http://localhost:3000 에서 접속 가능 확인
  ```

- [ ] **홈 페이지 접속 확인**
  - [ ] 페이지 로딩됨
  - [ ] 주요 UI 요소가 보임

---

## ✅ Phase 2: 프로젝트 이해 (1시간)

### 문서 읽기
- [ ] **README.md** 읽기
  - 프로젝트 개요 이해
  - 핵심 기술 스택 확인

- [ ] **docs/TESTING-STRATEGY.md** 읽기
  - 테스트 철학 이해
  - 테스트 종류 학습

- [ ] **docs/PUBLIC-SCHEMA-SCREEN-SPECS.md** 읽기
  - 데이터베이스 스키마 이해
  - 주요 테이블 관계 파악

### 코드 구조 이해
- [ ] **프로젝트 구조 탐색**
  ```bash
  # 주요 폴더 이해
  src/app          # 라우팅 구조
  src/components/  # UI 컴포넌트
  src/utils/       # 비즈니스 로직
  src/hooks/       # React 훅
  ```

- [ ] **핵심 파일 검토** (각 5분 정도)
  - [ ] `src/supabase.ts` - Supabase 클라이언트
  - [ ] `src/utils/matchMaking.ts` - 팀 빌딩 로직
  - [ ] `src/utils/pointSystem.ts` - 포인트 시스템
  - [ ] `src/hooks/useAuth.ts` - 인증 훅

### 데이터베이스 이해
- [ ] **Supabase 프로젝트 접속**
  - 팀으로부터 프로젝트 ID 받기
  - 대시보드 접속 (https://supabase.com)

- [ ] **주요 테이블 확인**
  - [ ] `profiles` - 사용자 프로필
  - [ ] `ladder_matches` - 래더 매치
  - [ ] `match_sets` - 매치 세트 기록
  - [ ] `ladders` - 순위 스냅샷

---

## ✅ Phase 3: 테스트 및 빌드 (1시간)

### 테스트 실행
- [ ] **단위 테스트 실행**
  ```bash
  npm test -- accountId      # 통과 확인
  npm test -- matchMaking    # 통과 확인
  npm test -- pointSystem    # 통과 확인
  ```

- [ ] **모든 테스트 실행**
  ```bash
  npm test  # 전체 63개 테스트 통과 확인
  ```

- [ ] **테스트 커버리지 확인**
  ```bash
  npm test -- --coverage  # 커버리지 리포트 확인
  ```

### 린팅 및 빌드
- [ ] **ESLint 실행**
  ```bash
  npm run lint  # 에러/경고 없는지 확인
  ```

- [ ] **프로덕션 빌드**
  ```bash
  npm run build  # 성공적으로 빌드되는지 확인
  ```

- [ ] **TypeScript 타입 체크**
  ```bash
  npx tsc --noEmit  # 타입 에러 없는지 확인
  ```

---

## ✅ Phase 4: 첫 번째 코드 작성 (1시간)

### 간단한 함수 작성
- [ ] **유틸리티 함수 작성**
  ```typescript
  // src/utils/example.ts에 간단한 함수 작성
  export function example(input: string): string {
    return input.toUpperCase();
  }
  ```

- [ ] **테스트 작성**
  ```typescript
  // tests/unit/example.test.ts
  describe('example', () => {
    it('입력을 대문자로 변환해야 한다', () => {
      expect(example('hello')).toBe('HELLO');
    });
  });
  ```

- [ ] **테스트 실행**
  ```bash
  npm test -- example
  ```

- [ ] **린팅 확인**
  ```bash
  npm run lint
  ```

### 컴포넌트 수정
- [ ] **간단한 컴포넌트 수정**
  - 기존 컴포넌트의 스타일 또는 텍스트 수정
  - 변경 사항을 브라우저에서 확인

- [ ] **변경 커밋**
  ```bash
  git add .
  git commit -m "docs: 온보딩 테스트 커밋"
  git push origin feature/onboarding
  ```

---

## ✅ Phase 5: 팀 커뮤니케이션 (30분)

### 신규 개발자 소개
- [ ] **팀 채널에 소개 메시지 작성**
  ```
  안녕하세요! OOO입니다.
  - 팀 참여: 2026-05-21
  - 담당 영역: [예: 래더 시스템, 매치 관리]
  - 연락처: [이메일/Slack]
  잘 부탁드립니다!
  ```

### 미해결 질문 정리
- [ ] **질문 목록 작성**
  - 프로젝트 구조 관련 궁금한 점
  - 개발 프로세스 관련 질문
  - 기술 관련 궁금한 점

- [ ] **팀 리드에게 질문 제출**
  - Slack/이메일로 질문 전달
  - 미팅 일정 잡기

### 다음 태스크 확인
- [ ] **할당할 첫 번째 이슈 확인**
  - 쉬운 난이도 (good first issue)
  - 명확한 요구사항
  - 예상 소요 시간: 4-6시간

---

## 🎓 학습 자료

### 필수 학습
| 주제 | 자료 | 소요 시간 |
|------|------|---------|
| Next.js 기초 | [공식 튜토리얼](https://nextjs.org/learn) | 2시간 |
| React Hooks | [React 공식 문서](https://react.dev) | 2시간 |
| TypeScript 기초 | [TypeScript 공식 문서](https://www.typescriptlang.org/docs/) | 2시간 |
| Supabase 기초 | [Supabase 문서](https://supabase.com/docs) | 1시간 |

### 추가 학습 (선택)
| 주제 | 자료 | 설명 |
|------|------|------|
| 테스트 작성 | [Jest 문서](https://jestjs.io/) | 단위 테스트 작성 방법 |
| 상태 관리 | [React Query 문서](https://tanstack.com/query/latest) | 서버 상태 관리 패턴 |
| CSS | [TailwindCSS](https://tailwindcss.com/) | 프로젝트에서 사용하는 CSS |

---

## 🔗 유용한 링크

### 내부 문서
- [개발 가이드](DEVELOPMENT-GUIDE.md) - 상세 개발 규칙
- [테스트 전략](TESTING-STRATEGY.md) - 테스트 작성 방법
- [데이터베이스 명세](PUBLIC-SCHEMA-SCREEN-SPECS.md) - 스키마 상세 정보
- [프로젝트 감사 계획](../PROJECT_AUDIT_PLAN.md) - 프로젝트 상태 및 계획

### 외부 리소스
- [GitHub 저장소](https://github.com/gkfla0720a/byclan-web)
- [Supabase 프로젝트](https://supabase.com)
- [Vercel 배포](https://vercel.com)

---

## ❓ 자주 묻는 질문

### Q: 프로젝트를 시작하려면 뭘 해야 하나요?
**A**: 이 체크리스트의 Phase 1-3을 따라하면 됩니다. 약 2-3시간이 소요됩니다.

### Q: 환경 변수를 어디서 받나요?
**A**: 팀 리드에게 .env.local 값을 요청하세요. Supabase 프로젝트 설정에서 확인할 수 있습니다.

### Q: 첫 번째 PR은 언제쯤?
**A**: Phase 4 완료 후 간단한 문서 수정이나 버그 수정 PR부터 시작하세요. 보통 1-2일 내에 작은 PR이 할당됩니다.

### Q: 테스트가 실패하면?
**A**: [DEVELOPMENT-GUIDE.md](DEVELOPMENT-GUIDE.md)의 문제 해결 섹션을 확인하세요. 또는 팀 채널에 질문해주세요.

---

## 📞 연락처

| 역할 | 이름 | 연락처 |
|------|------|--------|
| 팀 리드 | [리드 이름] | [Slack/이메일] |
| 기술 담당 | [담당자] | [Slack/이메일] |

---

## 🎉 축하합니다!

모든 체크리스트를 완료했다면, 이제 팀의 정식 멤버입니다! 🎊

다음 스텝:
1. 팀 리드에게 첫 번째 이슈 요청
2. PR 프로세스 학습
3. 코드 리뷰 받기
4. 배포 프로세스 학습

**행운을 빕니다! 질문이 있으면 언제든 팀에 물어봐주세요. 🙌**
