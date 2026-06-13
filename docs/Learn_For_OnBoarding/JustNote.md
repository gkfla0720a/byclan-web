# 학습 내용 정리


## 자바스크립트 지식

### 중괄호의 역할 중 일부

- "자바스크립트 번역기": React에서 HTML코드를 쓰다가 자바스크립트 문법을 사용할 때 사용
- "구조 분해 할당": 자식이 받은 props를 쓰기 편하게 구조를 변경할 때 사용

### 객체 만드는 공식

- 기본 규칙: { 이름표1: 값1, 이름표2: 값2 } 처럼 콜론(:)으로 연결하고, 여러 개일 때는 쉼표(,)로 구분합니다.

```typescript
const userName = "철수";
const userAge = 20;

// ⭕ 올바른 기본 객체 생성 방식
const userData = {
  name: userName, // 'name'이라는 이름표에 "철수"를 넣는다.
  age: userAge    // 'age'이라는 이름표에 20을 넣는다.
};

console.log(userData); 
// 출력 결과: { name: "철수", age: 20 }
```

- 단축 속성명: 최신 자바스크립트에는 "이름표(key)로 쓸 단어와 변수(value)의 이름이 똑같다면 생략해도 된다"라는 엄청나게 편리한 규칙이 있습니다.
이를 단축 속성명(Shorthand property names)이라고 합니다.
실무 리액트 코드에서는 이 방식을 정말 지독하게 많이 씁니다.

```typescript
const name = "철수";
const age = 20;

// 💡 이름표로 쓸 단어와, 변수명이 'name', 'age'로 서로 똑같다면?
const userData = {
  name,  // name: name 코드와 완전히 똑같이 동작합니다!
  age    // age: age 코드와 완전히 똑같이 동작합니다!
};

console.log(userData); 
// 출력 결과: { name: "철수", age: 20 }
```


## 리엑트에서 부모 컴포넌트와 자식 컴포넌트가 소통하는 방법

### 기본 개념

- 데이터의 흐름은 부모 -> 자식(단방향)
- 전달되는 데이터는 props라는 상자를 통해 전달 됨

**코드:**

```typescript
// Parent.jsx (부모)
import React from 'react';
import Child from './Child'; // 자식 컴포넌트를 불러옵니다.

function Parent() {
  const userName = "철수"; // 자식에게 줄 데이터

  return (
    <div style={{ border: '2px solid blue', padding: '20px' }}>
      <h2>나는 부모 컴포넌트입니다.</h2>
      
      {/* 💡 자식 컴포넌트에게 name이라는 이름으로 userName을 전달합니다. */}
      <Child name={userName} />
    </div>
  );
}

export default Parent;

// Child.jsx (자식)
import React from 'react';

// 💡 매개변수 자리에 'props'를 받아옵니다.
function Child(props) {
  return (
    <div style={{ border: '2px solid green', padding: '15px', marginTop: '10px' }}>
      <h3>나는 자식 컴포넌트입니다.</h3>
      
      {/* 💡 props 상자 안에서 부모가 보낸 'name'을 꺼내서 씁니다. */}
      <p>부모가 알려준 이름: <b>{props.name}</b></p>
    </div>
  );
}

export default Child;
```

### 부모가 자식에게 선물을 전달 하는 법

- 리액트 태그 안에서는 아쉽게도 <Child {userName} /> 처럼 중괄호만 덜렁 적으면 컴퓨터가 문법 에러를 냅니다. 대신 이름표(Key)와 변수명(Value)을 똑같이 맞춰서 적어주어야 합니다.

```typescript
// 부모 컴포넌트에서 보낼 때
<Child userName={userName} />


// 리액트가 만든 props 상자의 모습
{
  userName: "철수"
}

// 기본 방식(1)
function Child(props) {
  // props 상자 안에 userName이라는 이름표로 "철수"가 들어있습니다.
  console.log(props.userName); // ⭕ 출력 결과: "철수"
  
  return <p>{props.userName}</p>;
}

// 구조 분해 할당 방식(2)
// 배달된 상자에서 userName이라는 알맹이만 바로 쏙 빼오기
function Child({ userName }) {
  return <p>{userName}</p>;  // ⭕ 화면에 "철수"가 아주 잘 나옵니다!
}
```

### 구조 분해 할당

- props.name 같은 형식 대신 name을 바로 사용할 수 있도록 하는 방식

```typescript
// 구조 분해 할당을 사용한 자식 컴포넌트
function Child({ name }) { // 💡 props 대신 { name } 바로 받기
  return (
    <div>
      <p>부모가 알려준 이름: <b>{name}</b></p>
    </div>
  );
}

// 컴퓨터는 내부적으로 아래 두 코드를 100% 완전히 똑같이 처리합니다.

// 1. 우리가 바이클랜 프로젝트에서 본 코드
function Providers({ children }) { ... }

// 2. 컴퓨터가 실제로 풀어서 실행하는 원리 코드
function Providers(props) {
  const { children } = props; // 자식 함수가 시작되자마자 스스로 상자를 뜯음!
  ...
}

// 또 다른 예시들:
// 1. 원본 객체 상자가 있습니다.
const ironMan = {
  name: "토니 스타크",
  age: 50,
  weapon: "수트"
};

// 2. [기존 방식] 일일이 점을 찍어 꺼내 변수에 담기
const name = ironMan.name;
const age = ironMan.age;

// 3. [구조 분해 할당] 상자에서 name과 age만 쏙 꺼내서 독립된 변수로 만들기!
const { name, age } = ironMan; 

console.log(name); // 출력: 토니 스타크
console.log(age);  // 출력: 50

```


## 전역 데이터 전달 방식

### AuthProvider: 와이파이 공유기 같은 데이터 공유 기능

```typescript
// src/context/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) { // { children: ReactNode } 정해진 템플릿 같은 타입 정의
  const auth = useAuth(); // 💡 내 로그인 정보, 프로필 등이 담긴 '객체'. useAuthRetun 설계도를 따른다.

  return (
    // 💡 value={auth} : 가문 전체에 auth라는 데이터를 주파수로 쏩니다!
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
```

### createContext(특수함수)를 통해 AuthContext에 데이터를 저장하기

```typescript
const AuthContext = createContext(null);

// createContext(null)의 실제 내부 결과물 예시
AuthContext = {
  Provider: (props) => { /* 📡 데이터를 하위로 쏘아주는 리액트의 진짜 컴포넌트 프로그램이 이미 장전되어 있음 */ },
  Consumer: (props) => { /* ... */ },
  _currentValue: null // 👈 와이파이가 안 켜졌을 때의 기본 대기값
}
```

### createContext의 타입

- < > 제네릭 타입

```typescript
// 전체 문장 구조
const AuthContext = createContext<UseAuthReturn | null>(null);

// 1. 소괄호만 쓰는 일반 함수 호출 (데이터만 배달)
// 컴퓨터는 이 상자 안에 어떤 규격의 데이터가 들어올지 미리 알지 못합니다.
createContext(null); 

// 2. 화살표 괄호를 함께 쓰는 호출 (타입도 함께 배달!)
createContext<UseAuthReturn | null>(null);

// 결과
// 💡 컴퓨터 메모리에 완성된 AuthContext 객체의 실제 구조
AuthContext = {
  // 1. 리액트가 고정해둔 시스템 뼈대 (절대 안 바뀜)
  Provider: ReactComponent, 
  Consumer: ReactComponent,

  // 2. 💡 value를 통해 주입되어 실시간으로 업데이트되는 데이터 보관함
  _currentValue: {
    // ── [A. 데이터 영역: 현재 유저 정보 및 상태] ──
    user: { id: "uuid-xxxx", email: "user@byclan.net", ... }, // Supabase 유저 정보
    profile: { user_id: "철수", role: "member", total_mmr: 1550, ... }, // DB 프로필 정보
    activeMatchId: "match-102", // 현재 진행 중인 게임(매치) ID
    needsSetup: false,           // 초기 설정 필요 여부
    needsByIdSetup: false,
    authLoading: false,          // 로그인/프로필 로딩 상태
    authError: null,             // 에러 메시지 (4초 뒤 자동으로 null 변환)

    // ── [B. 함수 영역: 상태를 변경하는 리모컨들] ──
    setProfile: Function,        // 프로필을 직접 수정하는 함수
    setUser: Function,           // 유저 정보를 직접 수정하는 함수
    setActiveMatchId: Function,  // 매치 ID를 직접 수정하는 함수
    setNeedsSetup: Function,
    setAuthError: Function,
    handleAuthSuccess: Function,
    handleSetupComplete: Function,
    reloadProfile: Function,     // 🔄 프로필을 DB에서 다시 긁어오는 비동기 함수

    // ── [C. 초능력 함수 영역: 실시간 권한 체크 자판기] ──
    getPermissions: () => {
      // 이 함수를 실행(호출)하면 실시간으로 아래와 같은 객체가 튀어 나옵니다!
      return {
        isDeveloper: false,
        isManagement: false,
        isSenior: false,
        isMember: true,
        level: 1,
        roleInfo: { ... },
        can: {
          manageUsers: false,
          manageClan: false,
          approveMembers: false,
          manageMatches: false,
          hostMatches: true,       // 클랜원은 매치 생성이 가능하군!
          postAnnouncements: false,
          accessDevTools: false,
          moderateLadder: false,
          playLadder: true         // 🎮 래더 게임 참여 가능하군!
        },
        canAccessMenu: Function,
        hasLevel: Function
      };
    }
  }
};
```

### useAuthContext는 현장에서 쓰이는 함수

```typescript
export function useAuthContext() {
  const ctx = useContext(AuthContext); 
  return ctx;
}
```

- 예시 1

```typescript
import { useAuthContext } from '@/context/AuthContext';

function LadderRoom() {
  // 📡 안테나를 켜서 1번 구조 도면에서 'profile'과 'getPermissions'만 쏙 꺼냅니다.
  const { profile, getPermissions } = useAuthContext();
  
  // 권한 자판기(getPermissions)를 작동시켜 내 권한 영수증을 뽑습니다.
  const perms = getPermissions(); 

  return (
    <div>
      <h2>{profile?.user_id}님의 래더 대기실</h2>
      
      {/* 권한 객체 안의 can.playLadder가 true일 때만 버튼을 보여줍니다! */}
      {perms.can.playLadder && <button>래더 매치 매칭 시작!</button>}
    </div>
  );
}
```

- 예시 2

```typescript
import { useAuthContext } from '@/context/AuthContext';

function AdminPanel() {
  // 📡 안테나를 켜서 'getPermissions'와 프로필을 다시 긁어오는 'reloadProfile' 리모컨을 가져옵니다.
  const { getPermissions, reloadProfile } = useAuthContext();
  const perms = getPermissions();

  if (!perms.can.manageClan) {
    return <p>경고: 관리자만 접근할 수 있는 메뉴입니다.</p>;
  }

  return (
    <div>
      <h1>바이클랜 홈페이지 관리자 전용 메뉴</h1>
      <button onClick={() => reloadProfile()}>최신 클랜원 데이터 새로고침</button>
    </div>
  );
};
```
