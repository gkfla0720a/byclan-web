'use client'; // 이 코드는 브라우저에서 실행된다는 선언입니다.

import React, { useState } from 'react';

export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 여기서 원하는 비밀번호를 설정하세요! (예: byclan77)
  const CORRECT_PASSWORD = "1990"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  // 1. 비밀번호를 맞추기 전 보여줄 화면
  if (!isAuthorized) {
    return (
      <div style={{
        backgroundColor: '#0f172a',
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>ByClan 개발 서버</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: 'white'
            }}
          />
          <button type="submit" style={{
            padding: '10px 20px',
            borderRadius: '5px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}>입장</button>
        </form>
        <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>
          관리자 전용 테스트 페이지입니다.
        </p>
      </div>
    );
  }

  // 2. 비밀번호를 맞췄을 때 보여줄 진짜 화면 (어제 만든 코드)
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* ... 어제 넣었던 나머지 코드들을 여기에 그대로 두시면 됩니다 ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 어제 복사했던 <header>부터 </table>까지의 내용을 여기에 넣으세요 */}
          <h1 className="text-4xl font-black text-center mb-12">BYCLAN LADDER SYSTEM</h1>
          {/* (생략) ... */}
      </div>
    </main>
  );
}
