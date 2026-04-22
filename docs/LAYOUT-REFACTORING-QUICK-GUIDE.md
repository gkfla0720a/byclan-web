# Header/Footer 문제 해결 - 빠른 참고

## 🎯 문제와 해결책

### 문제
- ❌ 배포된 홈페이지(`/`)에서 header와 footer가 보이지 않음
- ✅ 다른 경로(`/(main)/*`)에서는 정상 표시

### 원인
- 루트 `/` 경로가 `(main)` 라우트 그룹 **밖**에 있음
- 루트 page.js에 Header/Footer 컴포넌트가 없음

---

## ✨ 적용된 해결책

### 1️⃣ 환경변수 추가 (`.env.local`)
```env
NEXT_PUBLIC_HOME_GATE_ENABLED=true  # 현재: 임시 대문 활성화
```

### 2️⃣ HomeGate 개선 (`src/app/components/HomeGate.js`)
- 환경변수 기반 조건부 렌더링
- `false`로 설정하면 대문 자동 제거

### 3️⃣ 루트 page.js 수정 (`src/app/page.js`)
- Header/Footer 컴포넌트 추가
- `(main)/layout.js`와 동일한 구조

---

## 🚀 향후 임시 대문 제거 방법

**서버 완성 후 대문을 완전히 제거하려면:**

### Step 1: 환경변수만 변경
```env
NEXT_PUBLIC_HOME_GATE_ENABLED=false
```

### Step 2: 배포
```bash
npm run build
npm run start
```

**끝!** (코드 수정 불필요)

---

## 📝 수정된 파일

```
✅ .env.local
   - NEXT_PUBLIC_HOME_GATE_ENABLED=true 추가

✅ src/app/components/HomeGate.js
   - 환경변수 기반 조건부 렌더링 로직 추가
   - 150줄 → 160줄 (코드 추가)

✅ src/app/page.js
   - Header 컴포넌트 import 추가
   - Footer 컴포넌트 import 추가
   - 두 경로 모두에 Header/Footer 래핑 추가
```

---

## 🔍 확인 방법

### 로컬에서 테스트
```bash
npm run dev
# http://localhost:3000 방문
# 비밀번호 입력 후 header/footer 표시 확인
```

### 환경변수로 대문 비활성화 테스트
```env
# .env.local 에서 변경
NEXT_PUBLIC_HOME_GATE_ENABLED=false
```

```bash
npm run dev
# http://localhost:3000 방문
# 대문 없이 바로 content 표시 확인
```

---

## 💡 구조 개선의 이점

| 항목 | 이전 | 개선 후 |
|------|------|--------|
| 루트 `/` 헤더 | ❌ 없음 | ✅ 있음 |
| 루트 `/` 푸터 | ❌ 없음 | ✅ 있음 |
| 대문 제거 용이성 | ❌ 어려움 | ✅ 환경변수만 변경 |
| 레이아웃 일관성 | ❌ 불일치 | ✅ 통일 |
| 유지보수성 | ⚠️ 낮음 | ✅ 높음 |

---

## 📚 자세한 문서

[LAYOUT-REFACTORING.md](./LAYOUT-REFACTORING.md) 참고
