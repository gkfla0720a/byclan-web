# 📚 ByClan Web 문서 인덱스

ByClan Web 프로젝트의 종합 개발 문서 모음입니다. 신규 개발자 온보딩과 코드 품질 유지를 위해 작성되었습니다.

---

## 🗂️ 문서 목록

| 📄 문서 | 📝 설명 | ⏱️ 읽기 시간 |
|--------|--------|------------|
| [CODE-QUALITY-REVIEW.md](./CODE-QUALITY-REVIEW.md) | 코드 품질 평가, 주석 분석, 개선 권장사항 | 15분 |
| [ARCHITECTURE-DIAGRAMS.md](./ARCHITECTURE-DIAGRAMS.md) | 아키텍처 레이어, 권한 시스템, 컴포넌트 의존성 시각화 | 20분 |
| [DATA-FLOW-VISUALIZATION.md](./DATA-FLOW-VISUALIZATION.md) | 인증 흐름, 데이터 레이어 관계도, Sequence Diagram | 18분 |
| [LEARNING-ROADMAP.md](./LEARNING-ROADMAP.md) | 5단계 학습 경로, 실습 과제, 참고 자료 | 25분 |
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | 권한 매트릭스, 라우팅 매핑, 주요 훅 사용법 | 10분 |

---

## 🎓 신규 개발자 온보딩 순서

```
1️⃣  CODE-QUALITY-REVIEW.md        ← 코드 품질 기준 이해
2️⃣  ARCHITECTURE-DIAGRAMS.md      ← 전체 시스템 구조 파악
3️⃣  LEARNING-ROADMAP.md           ← 단계별 학습 시작
4️⃣  DATA-FLOW-VISUALIZATION.md    ← 데이터 흐름 이해
5️⃣  QUICK-REFERENCE.md            ← 실제 개발 시 빠른 참조
```

---

## 📁 프로젝트 관련 기존 문서

루트 디렉토리에도 유용한 문서들이 있습니다:

| 📄 문서 | 📝 설명 |
|--------|--------|
| [CODE-STRUCTURE.md](../CODE-STRUCTURE.md) | 전체 프로젝트 파일 구조 및 역할 설명 |
| [DATABASE-GUIDE.md](../DATABASE-GUIDE.md) | Supabase DB 스키마 및 RLS 정책 가이드 |
| [ENVIRONMENT-SETUP.md](../ENVIRONMENT-SETUP.md) | 로컬 개발 환경 설정 방법 |
| [AUTH-TEST-ACCOUNT-STRATEGY.md](../AUTH-TEST-ACCOUNT-STRATEGY.md) | 테스트 계정 전략 |
| [MOBILE-GUIDE.md](../MOBILE-GUIDE.md) | 모바일 UX 가이드 |

---

## 🔗 문서 간 상호참조

```
ARCHITECTURE-DIAGRAMS.md
    ↕ 권한 시스템 상세
CODE-QUALITY-REVIEW.md
    ↕ 함수 호출 흐름
DATA-FLOW-VISUALIZATION.md
    ↕ 핵심 파일 목록
LEARNING-ROADMAP.md
    ↕ 빠른 조회 가이드
QUICK-REFERENCE.md
```

---

## 💡 활용 방법

### 개발 중 빠른 확인
- **권한 시스템 확인** → `QUICK-REFERENCE.md` → 권한 매트릭스 섹션
- **라우팅 경로 확인** → `QUICK-REFERENCE.md` → 라우팅 매핑 섹션
- **새 컴포넌트 주석 작성** → `CODE-QUALITY-REVIEW.md` → 주석 스타일 가이드

### 신규 기능 추가 시
1. `DATA-FLOW-VISUALIZATION.md`에서 관련 데이터 흐름 파악
2. `ARCHITECTURE-DIAGRAMS.md`에서 영향 범위 확인
3. `QUICK-REFERENCE.md`에서 필요한 훅/권한 찾기
4. 코드 작성 후 `CODE-QUALITY-REVIEW.md` 기준으로 검토
