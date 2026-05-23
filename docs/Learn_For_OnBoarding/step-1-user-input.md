# 🎯 Step 1: 사용자 입력 - 상세 학습 가이드

> 로그인 프로세스의 첫 단계: 사용자가 화면에서 어떻게 입력하고, 그 입력이 어떻게 처리되는지 면밀하게 살펴봅니다.

---

## 📋 목차

1. [개요](#개요)
2. [로그인 화면의 구조](#로그인-화면의-구조)
3. [사용자 입력의 종류](#사용자-입력의-종류)
4. [입력 데이터 흐름 - 로그인](#입력-데이터-흐름---로그인)
5. [입력 데이터 흐름 - 회원가입](#입력-데이터-흐름---회원가입)
6. [입력 검증 (Validation)](#입력-검증-validation)
7. [입력된 데이터의 저장소](#입력된-데이터의-저장소)

---

## 개요

"사용자 입력"은 인증 시스템의 **가장 첫 번째 시작점**입니다.

```
사용자가 키보드/마우스로 입력
         ↓
브라우저가 HTML 폼에서 값을 읽음
         ↓
JavaScript가 그 값을 받아서 처리
         ↓
(이후 Supabase로 전송 - 다음 단계)
```

이 문서에서는 "↑ 이 부분"만 자세히 살펴봅니다.

---

## 로그인 화면의 구조

### 시각적 모습

```
┌────────────────────────────────────────────┐
│                                            │
│         ByClan 로그인 화면                  │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ "BATTLE-NET LOGIN"  (타이틀)         │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ "LOGIN ID"  (라벨)                   │ │
│  │ ┌────────────────────────────────┐  │ │
│  │ │ 아이디 입력 필드                │  │ │
│  │ │ (사용자가 여기에 "junho" 입력) │  │ │
│  │ └────────────────────────────────┘  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ "PASSWORD"  (라벨)                   │ │
│  │ ┌────────────────────────────────┐  │ │
│  │ │ 비밀번호 입력 필드              │  │ │
│  │ │ (사용자가 여기에 "MyP@ss123"   │  │ │
│  │ │  입력하면 ●●●●●●●로 표시)    │  │ │
│  │ └────────────────────────────────┘  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ ◯ 로그인하기 (버튼)                  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  다른 로그인 방법:                         │
│  🎮 Discord로 로그인 (버튼)                │
│  🔍 Google로 로그인 (버튼)                 │
│                                            │
│  아직 계정이 없나요?                       │
│  👉 회원가입 (링크)                        │
│                                            │
└────────────────────────────────────────────┘
```

### HTML 코드의 구조

파일: `src/components/AuthForm.tsx` (라인 154-249)

```html
<form onSubmit={handleSubmit}>
  <!-- 1️⃣ 아이디 입력 필드 -->
  <div>
    <label>Login ID</label>
    <input 
      type="text" 
      value={accountId}                    ← 입력값이 여기 저장됨
      onChange={(e) => setAccountId(...)}  ← 입력할 때마다 업데이트
      placeholder="아이디 또는 기존 이메일"
    />
  </div>
.

  <!-- 2️⃣ 비밀번호 입력 필드 -->
  <div>
    <label>Password</label>
    <input 
      type="password"                      ← password 타입이므로 ●●● 표시
      value={password}
      onChange={(e) => setPassword(...)}
      placeholder="8자 이상, 영문+숫자"
    />
  </div>

  <!-- 3️⃣ 로그인 버튼 -->
  <button type="submit">
    LOGIN SYSTEM
  </button>
</form>
```

---

## 사용자 입력의 종류

### 로그인 모드에서의 입력

```
┌─────────────────────────────────────────────────┐
│ 입력 항목 1️⃣: 아이디                              │
├─────────────────────────────────────────────────┤
│ 가능한 입력:                                     │
│  • 자체 아이디: "junho"                          │
│  • 기존 이메일: "user@gmail.com"                 │
│  • 숫자: "12345"                                │
│                                                 │
│ 입력 제한:                                       │
│  • 특수문자는 자동 제거됨                         │
│  • 공백 자동 제거                                │
│  • 대문자는 소문자로 변환될 수 있음               │
│                                                │
│ React 상태 변수:                                │
│  const [accountId, setAccountId] = useState('')│
│                                                │
│ 코드 위치: AuthForm.tsx (라인 35)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 입력 항목 2️⃣: 비밀번호                            │
├─────────────────────────────────────────────────┤
│ 가능한 입력:                                     │
│  • 영문: "abc"                                  │
│  • 숫자: "123"                                  │
│  • 특수문자: "!@#$"                             │
│  • 공백: "sp ace" (공백 포함 가능)               │
│                                                │
│ 입력 제한:                                      │
│  • 최소 8글자 이상                              │
│  • 영문자 필수 (a-z, A-Z)                      │
│  • 숫자 필수 (0-9)                             │
│  • 특수문자 권장 (선택사항)                      │
│                                                │
│ 보안:                                          │
│  • type="password" → 화면에 ●●●●●로 표시       │
│  • 입력된 실제값은 JavaScript 메모리에만 존재   │
│  • localStorage에 저장되지 않음!                │
│                                                │
│ React 상태 변수:                                │
│  const [password, setPassword] = useState('')  │
│                                                │
│ 코드 위치: AuthForm.tsx (라인 37)               │
└─────────────────────────────────────────────────┘
```

### 회원가입 모드에서의 추가 입력

```
┌─────────────────────────────────────────────────┐
│ 추가 입력 항목 1️⃣: 닉네임                          │
├─────────────────────────────────────────────────┤
│ 가능한 입력:                                     │
│  • 한글: "프로토스마스터"                        │
│  • 영문: "ProtossMaster"                        │
│  • 숫자: "2024"                                 │
│  • 혼합: "Protoss2024"                          │
│                                                │
│ 입력 처리:                                      │
│  • 공백은 자동 제거됨                            │
│  • 예: "Protoss Master" → "ProtossMaster"       │
│  • 최소 2글자 이상 필수                          │
│                                                 │
│ 최종 형태:                                       │
│  • 입력값: "ProtossMaster"                       │
│  • DB에 저장: "By_ProtossMaster" (By_ 접두사 추가)|
│                                                 │
│ React 상태 변수:                                 │
│  const [nickname, setNickname] = useState('')   │
│                                                 │
│ 코드 위치: AuthForm.tsx (라인 41)                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 추가 입력 항목 2️⃣: 비밀번호 확인                   │
├─────────────────────────────────────────────────┤
│ 용도:                                            │
│  • 첫 번째 비밀번호와 동일한지 확인                │
│  • 오타 방지                                     │
│                                                 │
│ 입력 요구사항:                                   │
│  • password와 동일해야 함                        │
│  • 다르면 "비밀번호가 일치하지 않습니다" 경고      │
│                                                 │
│ React 상태 변수:                                 │
│  const [confirmPassword, setConfirmPassword] =  │
│    useState('')                                 │
│                                                 │
│ 코드 위치: AuthForm.tsx (라인 39)                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 추가 입력 항목 3️⃣: 약관 동의                       │
├─────────────────────────────────────────────────┤
│ 입력 형태:                                       │
│  • 체크박스 클릭                                 │
│  • 체크: ☑️  미체크: ☐                          │
│                                                 │
│ 필수 동의:                                      │
│  • [필수] 이용약관 동의                          │
│  • [필수] 개인정보 수집·이용 동의                │
│  • 클랜 내 매너 수칙 준수                        │
│                                                │
│ 검증:                                          │
│  • 체크되지 않으면 가입 불가                     │
│  • 코드: if (!agreed) return alert("동의하세요")|
│                                                │
│ React 상태 변수:                                │
│  const [agreed, setAgreed] = useState(false)   │
│                                                │
│ 코드 위치: AuthForm.tsx (라인 45)               │
└─────────────────────────────────────────────────┘
```

---

## 입력 데이터 흐름 - 로그인

### 실제 코드 따라가기

#### Step 1️⃣: 사용자가 아이디를 입력할 때

**시나리오:** 사용자가 로그인 아이디 필드를 클릭하고 "junho"를 타이핑합니다.

```
사용자 행동: accountId 입력 필드에 "j" 입력
         ↓
HTML 이벤트 발생: onChange 이벤트
         ↓
```

**코드 위치:** `src/components/AuthForm.tsx` (라인 187-189)

```jsx
<input 
  type="text" 
  value={accountId}
  onChange={(e) => setAccountId(isSignUp ? normalizeAccountId(e.target.value) : e.target.value)}
  placeholder="아이디 또는 기존 이메일"
/>
```

**무슨 일이 일어나는가?**

```
사용자가 "j" 타이핑
         ↓
onChange 이벤트 발동
         ↓
콜백 함수 실행:
(e) => setAccountId(isSignUp ? normalizeAccountId(e.target.value) : e.target.value)
         ↓
isSignUp 확인:
  • false (로그인 모드) → e.target.value 그대로 사용
  • true (회원가입 모드) → normalizeAccountId() 적용
         ↓
React 상태 업데이트:
setAccountId("j")  ← accountId = "j"
         ↓
컴포넌트 리렌더링:
<input value={accountId} /> → 화면에 "j" 표시
```

#### Step 2️⃣: 사용자가 계속 입력하면

```
사용자: "j" → "ju" → "jun" → "junh" → "junho"
         ↓      ↓      ↓       ↓        ↓
setAccountId("j")
             setAccountId("ju")
                         setAccountId("jun")
                                     setAccountId("junho")
```

**이 시점의 React 상태:**

```javascript
{
  accountId: "junho",        // ← 사용자가 입력한 값
  password: "",              // ← 아직 입력 안 함
  isSignUp: false,           // ← 로그인 모드
  loading: false             // ← 처리 중이 아님
}
```

#### Step 3️⃣: 사용자가 비밀번호를 입력할 때

```
사용자 행동: password 입력 필드에 "MyP@ss123" 입력
         ↓
onChange 이벤트 발동
         ↓
```

**코드 위치:** `src/components/AuthForm.tsx` (라인 196-199)

```jsx
<input 
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}  // ← 모드 상관없이 그대로 사용
  placeholder="8자 이상, 영문+숫자"
/>
```

**무슨 일이 일어나는가?**

```
사용자가 "MyP@ss123" 타이핑
         ↓
onChange 이벤트 발동
         ↓
setPassword("MyP@ss123")  ← password 상태 업데이트
         ↓
화면에는 ●●●●●●●●●로 표시됨 (type="password" 덕분)
```

**이 시점의 React 상태:**

```javascript
{
  accountId: "junho",              // ← 입력된 아이디
  password: "MyP@ss123",           // ← 입력된 비밀번호
  isSignUp: false,                 // ← 로그인 모드
  loading: false
}
```

#### Step 4️⃣: 사용자가 "LOGIN SYSTEM" 버튼을 클릭할 때

```
사용자 행동: "LOGIN SYSTEM" 버튼 클릭
         ↓
HTML 폼의 onSubmit 이벤트 발동
         ↓
```

**코드 위치:** `src/components/AuthForm.tsx` (라인 160)

```jsx
<form onSubmit={handleSubmit}>
  {/* 입력 필드들 */}
</form>
```

**무슨 일이 일어나는가?**

```
폼 제출 이벤트 발동
         ↓
handleSubmit() 함수 호출 (라인 110)
         ↓
매개변수: e (이벤트 객체)
```

---

## 입력 데이터 흐름 - 회원가입

### 회원가입 모드로 전환하기

**코드 위치:** `src/components/AuthForm.tsx` (라인 56-64)

```jsx
const toggleMode = () => {
  setIsSignUp(!isSignUp);           // ← 모드 전환
  setAccountId('');                 // ← 입력값 초기화
  setPassword('');
  setConfirmPassword('');
  setNickname('');
  setIsNicknameChecked(false);       // ← 중복확인 상태 초기화
  setAgreed(false);
};
```

**사용자가 "No account yet? Register Here" 링크 클릭**

```
사용자 클릭
         ↓
toggleMode() 함수 실행
         ↓
isSignUp: false → true로 변경
         ↓
모든 입력 필드 초기화
         ↓
화면이 회원가입 폼으로 변경됨
```

### 회원가입 입력 Step 1️⃣: 닉네임 입력

**코드 위치:** `src/components/AuthForm.tsx` (라인 163-181)

```jsx
{isSignUp && (
  <div>
    <label>Clan Nickname</label>
    <div className="flex gap-2">
      <div className="flex items-center">
        <span>By_</span>  {/* 접두사 자동 표시 */}
        <input 
          type="text" 
          value={nickname}
          onChange={(e) => { 
            setNickname(e.target.value.replace(/\s/g, '')); // ← 공백 제거
            setIsNicknameChecked(false);                    // ← 확인 상태 초기화
          }} 
          placeholder="닉네임"
        />
      </div>
      <button 
        type="button" 
        onClick={checkNicknameDuplicate}  // ← "중복확인" 버튼
      >
        중복확인
      </button>
    </div>
  </div>
)}
```

**사용자가 "ProtossMaster"를 입력할 때:**

```
사용자 입력: "P" "r" "o" "t" "o" "s" "s" "M" "a" "s" "t" "e" "r"
         ↓
onChange 이벤트 매번 발동
         ↓
setNickname("ProtossMaster")
         ↓
setIsNicknameChecked(false)  ← "중복확인" 버튼이 다시 비활성화됨
         ↓
React 상태:
{
  nickname: "ProtossMaster",
  isNicknameChecked: false
}
```

### 회원가입 입력 Step 2️⃣: 중복 확인

**코드 위치:** `src/components/AuthForm.tsx` (라인 73-92)

```jsx
const checkNicknameDuplicate = async () => {
  if (!nickname) return alert("닉네임을 입력해주세요.");
  if (nickname.length < 2) return alert("닉네임은 최소 2글자 이상이어야 합니다.");
  
  const fullID = `By_${nickname}`;  // ← "By_ProtossMaster"로 변환
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('by_id', fullID);

  if (error) {
    alert("오류 발생: " + error.message);
  } else if (count > 0) {
    alert("이미 전장에 참여 중인 닉네임입니다.");
    setIsNicknameChecked(false);
  } else {
    alert("사용 가능한 닉네임입니다!");
    setIsNicknameChecked(true);  // ← 중복 확인 완료!
  }
};
```

**사용자가 "중복확인" 버튼을 클릭할 때:**

```
사용자 클릭
         ↓
checkNicknameDuplicate() 함수 실행
         ↓
검증:
  • nickname 입력됨? ✓
  • 2글자 이상? ✓
         ↓
닉네임 변환:
  "ProtossMaster" → "By_ProtossMaster"
         ↓
이 시점의 상태:
{
  nickname: "ProtossMaster",
  isNicknameChecked: false (아직)
}
         ↓
Supabase 서버로 쿼리 전송 (다음 단계)
         ↓
결과:
  • 사용 가능 → setIsNicknameChecked(true) ✓
  • 중복 → alert 표시, isNicknameChecked = false
```

### 회원가입 입력 Step 3️⃣: 아이디 입력

**코드 위치:** `src/components/AuthForm.tsx` (라인 186-191)

```jsx
<div>
  <label>Login ID</label>
  <input 
    type="text" 
    value={accountId}
    onChange={(e) => setAccountId(
      isSignUp ? normalizeAccountId(e.target.value) : e.target.value
    )}  // ← 회원가입 모드면 normalizeAccountId() 적용!
    placeholder="yourid"
  />
</div>
```

**사용자가 "Junho"를 입력할 때 (회원가입 모드):**

```
사용자 입력: "Junho"
         ↓
isSignUp = true이므로 normalizeAccountId() 실행!
         ↓
normalizeAccountId() 함수:
  입력: "Junho"
    ↓
  처리: 대소문자 제외, 영문+숫자만 남김
    ↓
  출력: "junho"
         ↓
setAccountId("junho")
         ↓
화면에 표시: "junho" (이미 소문자로 변환됨)
```

### 회원가입 입력 Step 4️⃣: 비밀번호 입력

**코드 위치:** `src/components/AuthForm.tsx` (라인 193-208)

```jsx
<div>
  <label>Password</label>
  <input 
    type="password" 
    value={password} 
    onChange={(e) => setPassword(e.target.value)} 
    minLength={8}
    placeholder="8자 이상, 영문+숫자"
  />
  {isSignUp && password && (
    <div className="flex gap-3 mt-1.5">
      <span className={password.length >= 8 ? 'text-green-400' : 'text-gray-600'}>
        ✓ 8자 이상
      </span>
      <span className={/[a-zA-Z]/.test(password) ? 'text-green-400' : 'text-gray-600'}>
        ✓ 영문 포함
      </span>
      <span className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-600'}>
        ✓ 숫자 포함
      </span>
    </div>
  )}
</div>
```

**사용자가 "MyP@ss123"을 입력할 때 (회원가입 모드):**

```
사용자 입력: "MyP@ss123"
         ↓
onChange 이벤트 발동
         ↓
setPassword("MyP@ss123")
         ↓
isSignUp = true && password 값 존재?
  → 비밀번호 요구사항 체크박스 표시!
         ↓
검증 표시:
  ✓ 8자 이상: "MyP@ss123" (9자) → ✓ 초록색
  ✓ 영문 포함: M, y, P, s, s → ✓ 초록색
  ✓ 숫자 포함: 1, 2, 3 → ✓ 초록색
         ↓
사용자가 화면에서 즉시 조건을 만족하는지 확인 가능!
```

### 회원가입 입력 Step 5️⃣: 비밀번호 확인 입력

**코드 위치:** `src/components/AuthForm.tsx` (라인 210-219)

```jsx
{isSignUp && (
  <>
    <div>
      <label>Confirm Password</label>
      <input 
        type="password" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} 
        className={`
          ${password && confirmPassword ? 
            (password === confirmPassword ? 'border-emerald-500' : 'border-red-500') 
            : 'border-gray-700'
          }`}  // ← 일치하면 초록색, 불일치하면 빨간색!
        placeholder="비밀번호 확인"
      />
    </div>
  </>
)}
```

**사용자가 "MyP@ss123"을 입력할 때:**

```
사용자 입력: "MyP@ss123"
         ↓
onChange 이벤트 발동
         ↓
setConfirmPassword("MyP@ss123")
         ↓
password와 confirmPassword 비교:
  password = "MyP@ss123"
  confirmPassword = "MyP@ss123"
  → 같음! ✓
         ↓
border 스타일 변경:
  className → "border-emerald-500" (초록색)
         ↓
사용자가 비밀번호가 일치하는 것을 즉시 확인 가능!
```

### 회원가입 입력 Step 6️⃣: 약관 동의

**코드 위치:** `src/components/AuthForm.tsx` (라인 222-238)

```jsx
{isSignUp && (
  <div className="bg-gray-900/50 p-4 rounded-2xl">
    <div className="flex items-start gap-3">
      <input 
        type="checkbox"  // ← 체크박스
        id="agreed"
        checked={agreed}  // ← 체크 여부 상태
        onChange={(e) => setAgreed(e.target.checked)}  // ← 체크 상태 업데이트
        className="mt-1 w-4 h-4 accent-yellow-500"
      />
      <label htmlFor="agreed" className="text-gray-400">
        [필수] 이용약관 및 개인정보 수집·이용에 동의하며, 
        클랜 내 매너 수칙을 준수할 것을 약속합니다.
      </label>
    </div>
  </div>
)}
```

**사용자가 체크박스를 클릭할 때:**

```
사용자 클릭: ☐ → ☑️
         ↓
onChange 이벤트 발동
         ↓
e.target.checked = true
         ↓
setAgreed(true)
         ↓
React 상태:
{
  agreed: true  // ← 이제 회원가입 가능!
}
         ↓
화면에: ☑️ (체크됨) 표시
```

---

## 입력 검증 (Validation)

### 로그인 입력 검증

로그인 버튼을 클릭했을 때, `handleSubmit()` 함수 내부에서 검증이 이루어집니다.

**코드 위치:** `src/components/AuthForm.tsx` (라인 145-152)

```jsx
} else {
  setLoading(true);
  
  // 검증 없음 - 그냥 바로 로그인 시도!
  // (실패하면 Supabase가 에러 메시지 반환)
  
  const { error } = await supabase.auth.signInWithPassword({ 
    email: getLoginEmailFromInput(accountId), 
    password 
  });
  
  if (error) alert("로그인 정보가 정확하지 않습니다.");
}
```

**로그인 검증 흐름:**

```
사용자가 빈 값으로 로그인 시도?
  → HTML의 required 속성이 막음
  → "이 필드를 입력하세요" 메시지 (브라우저 기본 메시지)
         ↓
입력값이 있으면?
  → Supabase로 바로 전송 (클라이언트 검증 없음)
  → Supabase가 답변:
    • 맞음 → 토큰 반환
    • 틀림 → error 반환
  → error가 있으면 alert 표시
```

### 회원가입 입력 검증

회원가입은 로그인보다 훨씬 많은 검증이 있습니다.

**코드 위치:** `src/components/AuthForm.tsx` (라인 113-119)

```jsx
if (isSignUp) {
  // ✓ 검증 1: 닉네임 중복확인
  if (!isNicknameChecked) 
    return alert("닉네임 중복 확인을 먼저 해주세요.");
  
  // ✓ 검증 2: 비밀번호 일치
  if (password !== confirmPassword) 
    return alert("비밀번호가 서로 일치하지 않습니다.");
  
  // ✓ 검증 3: 비밀번호 길이
  if (password.length < 8) 
    return alert("비밀번호는 최소 8자 이상이어야 합니다.");
  
  // ✓ 검증 4: 비밀번호에 영문 포함
  if (!/[a-zA-Z]/.test(password)) 
    return alert("비밀번호에 영문자가 포함되어야 합니다.");
  
  // ✓ 검증 5: 비밀번호에 숫자 포함
  if (!/[0-9]/.test(password)) 
    return alert("비밀번호에 숫자가 포함되어야 합니다.");
  
  // ✓ 검증 6: 약관 동의
  if (!agreed) 
    return alert("이용약관 및 개인정보 처리방침에 동의해주세요.");
}
```

**검증 흐름도:**

```
사용자가 "REGISTER ACCOUNT" 클릭
         ↓
검증 1: isNicknameChecked?
  ✗ false → "중복 확인을 먼저 해주세요" ← 여기서 중단!
  ✓ true → 다음으로
         ↓
검증 2: password === confirmPassword?
  ✗ 불일치 → "비밀번호가 일치하지 않습니다" ← 여기서 중단!
  ✓ 일치 → 다음으로
         ↓
검증 3: password.length >= 8?
  ✗ < 8글자 → "8자 이상이어야 합니다" ← 여기서 중단!
  ✓ >= 8글자 → 다음으로
         ↓
검증 4: /[a-zA-Z]/.test(password)?
  ✗ 영문 없음 → "영문자가 포함되어야 합니다" ← 여기서 중단!
  ✓ 영문 있음 → 다음으로
         ↓
검증 5: /[0-9]/.test(password)?
  ✗ 숫자 없음 → "숫자가 포함되어야 합니다" ← 여기서 중단!
  ✓ 숫자 있음 → 다음으로
         ↓
검증 6: agreed?
  ✗ false → "약관에 동의해주세요" ← 여기서 중단!
  ✓ true → 다음으로
         ↓
모든 검증 통과! ✓
모든 입력값이 안전함을 확인됨
  → 다음 단계로 진행 (Supabase로 전송)
```

### 정규표현식 설명

검증 코드에 사용된 정규표현식을 쉽게 설명:

```javascript
// ✓ 영문 포함 확인
/[a-zA-Z]/.test(password)

의미:
  [a-zA-Z]  = 소문자 a~z 또는 대문자 A~Z
  .test()   = 이 패턴이 포함되어 있나? (true/false 반환)
  
예시:
  "MyP@ss123".test(...) → true ✓ (M, y, P, s, s 포함)
  "123456".test(...)    → false ✗ (영문 없음)


// ✓ 숫자 포함 확인
/[0-9]/.test(password)

의미:
  [0-9]  = 숫자 0~9
  
예시:
  "MyP@ss123".test(...) → true ✓ (1, 2, 3 포함)
  "abcdefgh".test(...)  → false ✗ (숫자 없음)
```

---

## 입력된 데이터의 저장소

### 로그인 입력값이 어디에 저장되나?

**1️⃣ React 컴포넌트의 상태(State)**

```javascript
// src/components/AuthForm.tsx

const [accountId, setAccountId] = useState('');      // 아이디
const [password, setPassword] = useState('');        // 비밀번호
const [isSignUp, setIsSignUp] = useState(false);     // 모드
const [loading, setLoading] = useState(false);       // 처리 중?
```

**저장 위치:** 브라우저의 JavaScript 메모리

**특징:**
- 페이지를 새로고침하면 초기화됨
- localStorage나 다른 곳에 저장되지 않음
- 비밀번호가 노출되지 않도록 메모리에만 저장
- 화면을 떠나면 자동 삭제됨

**저장 기간:**
```
사용자 입력 시작
         ↓
입력되는 동안: 메모리에 유지
         ↓
"LOGIN" 버튼 클릭
         ↓
1️⃣ Supabase로 전송
2️⃣ 응답받음 (토큰)
         ↓
로그인 성공 또는 실패
         ↓
모드 초기화 또는 폼 초기화
setPassword('') ← 메모리에서 삭제!
```

### 회원가입 입력값이 어디에 저장되나?

로그인과 동일합니다:

```javascript
const [nickname, setNickname] = useState('');               // 닉네임
const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인
const [agreed, setAgreed] = useState(false);               // 약관 동의
const [isNicknameChecked, setIsNicknameChecked] = useState(false); // 중복확인
```

**저장 위치:** 브라우저의 JavaScript 메모리 (component state)

### 입력 데이터와 localStorage의 관계

**중요:** 입력값은 localStorage에 저장되지 않습니다!

```
입력값: 메모리 (ephemeral - 일시적)
  • 로그인/회원가입 폼에 입력되는 동안만 유지
  • 페이지 새로고침하면 초기화됨
  • 보안 목적: 비밀번호가 디스크에 저장되지 않음
         ↓
로그인 성공 후 받는 토큰: localStorage (persistent - 영구적)
  • supabase.auth.token 키로 저장됨
  • 페이지 새로고침 후에도 유지됨
  • 토큰은 비밀번호가 아니므로 저장 가능
```

### 입력 데이터의 생명주기 (Lifecycle)

```
┌─────────────────────────────────────────────────────┐
│ 1️⃣ 로그인 폼 페이지 방문                            │
│                                                     │
│ React 상태 초기화:                                  │
│ {                                                   │
│   accountId: '',          // 빈 값                  │
│   password: '',           // 빈 값                  │
│   isSignUp: false,                                  │
│   loading: false                                    │
│ }                                                   │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ 2️⃣ 사용자가 입력 시작                               │
│                                                     │
│ accountId: "" → "j" → "ju" → "junho"               │
│ password: "" → "M" → "My" → ... → "MyP@ss123"      │
│                                                     │
│ (매번 setAccountId(), setPassword() 호출)          │
│ (매번 컴포넌트 리렌더링)                            │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ 3️⃣ 입력 완료 - "LOGIN SYSTEM" 버튼 클릭              │
│                                                     │
│ 상태:                                               │
│ {                                                   │
│   accountId: "junho",                               │
│   password: "MyP@ss123",                            │
│   loading: true  ← 처리 시작                        │
│ }                                                   │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ 4️⃣ Supabase로 전송 (다음 단계)                     │
│                                                     │
│ HTTPS 암호화 연결을 통해 전송됨                     │
│ (이 시점부터는 다음 단계에서 배움)                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 실제 코드 따라가기 - 전체 과정

### 시나리오: 사용자 "junho"가 로그인하는 과정

#### Phase 1️⃣: 페이지 로드

```
사용자가 로그인 페이지 방문
         ↓
AuthForm.tsx 컴포넌트 렌더링
         ↓
초기 상태:
{
  accountId: '',
  password: '',
  isSignUp: false,
  loading: false,
  // ... 기타 상태들
}
         ↓
화면에 빈 입력 필드와 버튼이 표시됨
```

#### Phase 2️⃣: 첫 번째 입력 - 아이디

**사용자 행동:** 아이디 입력 필드에 클릭하고 "junho" 입력

```
인풋 필드에 포커스 (클릭)
         ↓
사용자가 "j" 타이핑
         ↓
onChange 콜백 실행:
(e) => setAccountId(
  isSignUp ? normalizeAccountId(e.target.value) : e.target.value
)
         ↓
isSignUp = false (로그인 모드)
  → e.target.value 그대로 사용
  → setAccountId("j")
         ↓
React 상태 업데이트:
accountId = "j"
         ↓
컴포넌트 리렌더링
화면에 "j" 표시
```

**사용자가 계속 입력...**

```
"j" → "ju" → "jun" → "junh" → "junho"

각 타이핑마다 위의 과정 반복
최종: accountId = "junho"
```

**이 시점의 상태:**

```javascript
{
  accountId: "junho",
  password: "",
  isSignUp: false,
  loading: false
}
```

#### Phase 3️⃣: 두 번째 입력 - 비밀번호

**사용자 행동:** 비밀번호 입력 필드에 클릭하고 "MyP@ss123" 입력

```
비밀번호 인풋 필드에 포커스
         ↓
사용자가 "M" 타이핑
         ↓
onChange 콜백 실행:
(e) => setPassword(e.target.value)
         ↓
setPassword("M")
         ↓
React 상태 업데이트
화면에 "●" 표시 (password 타입이므로)
         ↓
사용자가 계속 입력...
```

**계속 입력...**

```
"M" → "My" → "MyP" → "MyP@" → "MyP@s" → ... → "MyP@ss123"

각 타이핑마다 위의 과정 반복
최종: password = "MyP@ss123"
```

**이 시점의 상태:**

```javascript
{
  accountId: "junho",
  password: "MyP@ss123",  // ← 입력 완료
  isSignUp: false,
  loading: false
}
```

#### Phase 4️⃣: 버튼 클릭

**사용자 행동:** "LOGIN SYSTEM" 버튼 클릭

```
사용자가 버튼 클릭
         ↓
HTML form의 onSubmit 이벤트 발동
         ↓
handleSubmit(e) 함수 호출 (라인 110-152)
```

**handleSubmit 함수 내부:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();  // ← form의 기본 동작 (페이지 새로고침) 막음
  
  // 로그인 모드인지 확인
  if (isSignUp) {
    // 회원가입 로직 (이 경우 실행 안 됨)
  } else {
    // ← 여기 실행됨 (로그인)
    
    setLoading(true);  // ← 버튼 비활성화, "PROCESSING..." 표시
    
    // 아이디를 이메일로 변환 (다음 단계)
    const { error } = await supabase.auth.signInWithPassword({ 
      email: getLoginEmailFromInput(accountId),  // "junho" → "login.junho@auth.byclan.local"
      password  // "MyP@ss123"
    });
    
    if (error) alert("로그인 정보가 정확하지 않습니다.");
  }
  
  setLoading(false);  // ← 처리 완료, 버튼 다시 활성화
};
```

**이 시점의 상태:**

```javascript
{
  accountId: "junho",
  password: "MyP@ss123",
  isSignUp: false,
  loading: true  // ← 처리 중!
}
```

#### Phase 5️⃣: 요약

| Phase | accountId | password | loading | 화면 상태 |
|-------|-----------|----------|---------|---------|
| **1️⃣** | "" | "" | false | 빈 폼 |
| **2️⃣** | "junho" | "" | false | 아이디만 입력됨 |
| **3️⃣** | "junho" | "MyP@ss123" | false | 모두 입력됨 |
| **4️⃣** | "junho" | "MyP@ss123" | true | "PROCESSING..." |
| **5️⃣** | "junho" | "MyP@ss123" | false | 로그인 완료 또는 에러 |

---

## 🎓 오늘의 학습 정리

### ✅ 이해할 수 있는 것들

1. **입력 필드와 상태의 관계**
   - 사용자가 타이핑할 때마다 React 상태가 업데이트됨
   - 상태 변경 → 컴포넌트 리렌더링 → 화면 업데이트

2. **입력 데이터의 저장 위치**
   - 메모리에만 저장됨 (component state)
   - 페이지 새로고침하면 초기화됨
   - 특히 비밀번호는 절대 localStorage에 저장 안 됨

3. **입력 검증**
   - 로그인: 거의 없음 (Supabase에서 처리)
   - 회원가입: 6단계 검증

4. **입력값의 변환**
   - normalizeAccountId: 아이디 정규화
   - getLoginEmailFromInput: 아이디 → 이메일 변환

5. **UI 반응성**
   - onChange 이벤트로 실시간 입력 감지
   - 비밀번호 강도 표시 (회원가입)
   - 닉네임 중복확인 상태 표시

### 📝 다음 단계에서 배울 것

- 입력된 데이터가 어떻게 Supabase로 전송되는가
- 네트워크를 통해 어떤 정보가 오고 가는가
- Supabase가 받은 데이터를 어떻게 처리하는가

---

## 🧪 실습 과제 (선택사항)

브라우저 개발자 도구(F12)를 사용해서 실제로 상태 변화를 관찰해보세요:

### 과제 1️⃣: React DevTools로 상태 추적

1. Chrome에서 "React Developer Tools" 확장프로그램 설치
2. 로그인 페이지에서 F12 → Components 탭
3. `<AuthForm />` 컴포넌트를 클릭
4. 아이디 입력 필드에 입력하면서 오른쪽 Props 패널의 accountId 값 변화 관찰

### 과제 2️⃣: Console에서 입력값 추적

1. F12 → Console 탭
2. 다음 코드를 붙여넣기:

```javascript
// 이것은 실제로 AuthForm.tsx에서 실행되지는 않지만,
// 상태 추적 개념을 이해하는 데 도움됨

let userInput = "";
let passwordInput = "";

function trackInput(type, value) {
  if (type === "accountId") userInput = value;
  if (type === "password") passwordInput = value;
  console.log("현재 입력:", { userInput, passwordInput });
}

// 입력 시뮬레이션
trackInput("accountId", "j");      // {userInput: "j", passwordInput: ""}
trackInput("accountId", "ju");     // {userInput: "ju", passwordInput: ""}
trackInput("password", "My");      // {userInput: "ju", passwordInput: "My"}
```

### 과제 3️⃣: Network 탭에서 준비하기

다음 Step에서 네트워크를 관찰할 준비:

1. F12 → Network 탭 열기
2. 로그인 폼에 입력
3. "LOGIN" 버튼 클릭
4. 네트워크 탭에서 요청이 나타나는 것 관찰 (다음 단계에서 분석)

---

## 📚 코드 참고 자료

### 가장 중요한 파일: `src/components/AuthForm.tsx`

```
파일명: src/components/AuthForm.tsx
총 라인 수: 275라인

주요 부분:
• 라인 31-49: 모드별 상태 선언
• 라인 56-64: toggleMode() - 로그인/회원가입 전환
• 라인 110-152: handleSubmit() - 폼 제출 처리
• 라인 73-92: checkNicknameDuplicate() - 닉네임 중복확인
• 라인 160-249: JSX - HTML 폼 구조
```

### 보조 파일

```
파일명: src/utils/accountId.ts
주요 함수:
• normalizeAccountId() - 아이디 정규화
• buildInternalAuthEmail() - 아이디 → 이메일 변환
• getLoginEmailFromInput() - 입력값 → 로그인 이메일 변환
```

---

> **작성일**: 2026-05-23  
> **학습 단계**: Step 1 - 사용자 입력  
> **다음 학습**: 입력 데이터 → Supabase 전송
