# 홈페이지 Header/Footer 렌더링 문제 해결 및 구조 개선

## 🔴 문제점 분석

### 증상
- 배포된 홈페이지(루트 `/`)에서 header와 footer가 보이지 않음
- `/(main)` 라우트 그룹 하위의 다른 경로들은 정상적으로 표시됨

### 근본 원인

**Next.js App Router 구조의 레이아웃 적용 범위 문제:**

```
src/app/
├── layout.js                    ← 최상위 (모든 페이지에 적용)
│   (Provider 계층: ErrorBoundary, ToastProvider, AuthProvider)
│   (Header/Footer 없음 ❌)
│
├── page.js                      ← 루트 경로 '/'
│   (HomeGate만 포함, Header/Footer 없음 ❌)
│
└── (main)/
    ├── layout.js                ← 메인 라우트 그룹 (Header/Footer/HomeGate ✅)
    ├── (sidebar)/
    ├── admin/
    ├── developer/
    └── profile/
```

**문제:**
- 루트 `/`는 `(main)` 라우트 그룹 **밖**에 있음
- 따라서 `(main)/layout.js`가 적용되지 않음
- 루트 `page.js`는 Header/Footer를 포함하지 않아 렌더링되지 않음

---

## ✅ 해결 방법 (3단계 리팩토링)

### Step 1: 환경변수 추가 (향후 대문 제거 대비)

**파일:** `.env.local`

```env
# 홈게이트 설정 (임시 대문 활성화)
# 서버 개발 완료 시 false로 변경하면 쉽게 대문 제거 가능
NEXT_PUBLIC_HOME_GATE_ENABLED=true
```

**목적:**
- `NEXT_PUBLIC_HOME_GATE_ENABLED=true`: 임시 대문 사용 (현재)
- `NEXT_PUBLIC_HOME_GATE_ENABLED=false`: 임시 대문 제거 (향후 서버 배포 후)

### Step 2: HomeGate 컴포넌트 개선

**파일:** `src/app/components/HomeGate.js`

```javascript
export default function HomeGate({ children }) {
  const homeGateEnabled = process.env.NEXT_PUBLIC_HOME_GATE_ENABLED === 'true';
  
  // HomeGate가 비활성화되면 자식 컴포넌트를 바로 렌더링 (대문 없음)
  if (!homeGateEnabled) {
    return children;
  }

  // HomeGate 활성화 시 인증 로직 진행
  // ... (기존 로직)
}
```

**개선점:**
- 환경변수 기반 조건부 렌더링
- 대문 제거가 단 한 줄 변경으로 가능
- 기존 기능 100% 유지

### Step 3: 루트 page.js 수정

**파일:** `src/app/page.js`

```javascript
'use client';

import Header from './components/Header';
import Footer from './components/Footer';
import HomeGate from './components/HomeGate';
// ... (기타 imports)

export default function Home() {
  // ... (기존 로직)

  // 가입 대기 중인 경우
  if (user && profile?.role === 'applicant') {
    return (
      <HomeGate>
        <div className="min-h-screen flex flex-col ...">
          <Header />
          <main>
            {/* 내용 */}
          </main>
          <Footer />
        </div>
      </HomeGate>
    );
  }

  // 일반 홈 화면 — (main)/layout.js와 동일한 구조
  return (
    <HomeGate>
      <div className="min-h-screen flex flex-col ...">
        <Header />
        <main>
          {/* 내용 */}
        </main>
        <Footer />
      </div>
    </HomeGate>
  );
}
```

**개선점:**
- Header와 Footer가 루트 경로에서도 렌더링됨
- `(main)/layout.js`와 동일한 구조 유지
- 레이아웃 일관성 확보

---

## 📊 개선 전후 비교

### 개선 전
```
루트 `/` → HomeGate → content
           (Header/Footer 없음 ❌)

/(main)/* → Header → content → Footer
           (정상 ✅)
```

### 개선 후
```
루트 `/` → HomeGate → Header → content → Footer
          (정상 ✅)

/(main)/* → Header → content → Footer
          (정상 ✅)
```

---

## 🚀 향후 대문 제거 절차

서버 개발 완료 후 임시 대문을 제거하려면:

### 1단계: 환경변수 변경
```env
NEXT_PUBLIC_HOME_GATE_ENABLED=false
```

### 2단계: 프로덕션 배포
```bash
npm run build
npm run start
```

### 3단계: (선택사항) 코드 정리
필요 시 `HomeGate` 컴포넌트 import 제거:
```javascript
// 제거 가능
// import HomeGate from './components/HomeGate';
// <HomeGate> wrapper 제거
return (
  <div className="...">
    <Header />
    {/* content */}
    <Footer />
  </div>
);
```

---

## 📁 수정된 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `.env.local` | `NEXT_PUBLIC_HOME_GATE_ENABLED=true` 추가 |
| `src/app/components/HomeGate.js` | 환경변수 기반 조건부 렌더링 추가 |
| `src/app/page.js` | Header/Footer 추가, 구조 통일 |

---

## ✨ 개선의 이점

### 1. **배포 문제 즉시 해결**
- 루트 경로에서 header/footer가 정상 렌더링

### 2. **향후 대문 제거 용이성**
- 환경변수 한 줄만 변경
- 코드 수정 불필요
- 배포 재설정만으로 완료

### 3. **레이아웃 구조 일관성**
- 루트와 (main) 그룹의 구조 통일
- 유지보수 성 향상
- 신규 기능 추가 시 예측 가능성 증가

### 4. **보안성 유지**
- 기존 HomeGate 인증 로직 100% 유지
- 추가 보안 기능 없음 (기존 기능만 유지)

---

## 🧪 테스트 방법

### 로컬 개발 환경에서
```bash
# 1. 현재 상태 확인 (대문 활성화)
npm run dev
# http://localhost:3000 방문
# 비밀번호 입력 후: Header + content + Footer 보임

# 2. 대문 제거 테스트
# .env.local에서 NEXT_PUBLIC_HOME_GATE_ENABLED=false로 변경
npm run dev
# http://localhost:3000 방문
# Header + content + Footer가 대문 없이 바로 보임
```

---

## 📝 커밋 메시지

```
feat: Header/Footer 렌더링 문제 해결 및 홈게이트 구조 개선

- 루트 경로(/)에서 Header/Footer가 렌더링되지 않는 문제 해결
- HomeGate를 환경변수(NEXT_PUBLIC_HOME_GATE_ENABLED)로 제어 가능하게 개선
- 루트 page.js 구조를 (main)/layout.js와 통일
- 향후 대문 제거 시 환경변수만 변경하면 되도록 구조화

개선 내용:
1. .env.local에 NEXT_PUBLIC_HOME_GATE_ENABLED 추가
2. HomeGate.js에 환경변수 기반 조건부 렌더링 로직 추가
3. src/app/page.js에 Header/Footer 컴포넌트 추가
```

---

## 🔗 관련 파일

- [HomeGate.js](../components/HomeGate.js) - 임시 대문 컴포넌트
- [page.js](../page.js) - 루트 페이지
- [(main)/layout.js](../(main)/layout.js) - 메인 라우트 그룹 레이아웃
- [.env.local](../../../../.env.local) - 환경변수 설정
