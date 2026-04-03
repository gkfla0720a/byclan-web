'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false); // 로그인/회원가입 모드 전환
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); // By_ 뒤에 붙을 이름
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // --- [회원가입 로직] ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: nickname } }
      });

      if (error) alert("가입 실패: " + error.message);
      else {
        // 회원가입 성공 시 profiles 테이블에 정보 입력
        const { error: pError } = await supabase.from('profiles').insert({
          id: data.user.id,
          ByID: `By_${nickname}`,
          role: 'rookie', // 초기 등급
          points: 0
        });
        if (pError) console.error(pError);
        alert("회원가입 성공! 이메일 인증을 확인하거나 로그인을 진행하세요.");
      }
    } else {
      // --- [로그인 로직] ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("로그인 실패: " + error.message);
      else window.location.reload(); // 성공 시 페이지 갱신
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-black text-white mb-6 text-center">
        {isSignUp ? 'ByClan 합류하기' : 'ByClan 로그인'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Clan Nickname</label>
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl mt-1 overflow-hidden">
              <span className="px-3 text-yellow-500 font-bold">By_</span>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="w-full p-3 bg-transparent text-white focus:outline-none" placeholder="닉네임" />
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 mt-1 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-yellow-500 outline-none" placeholder="example@email.com" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 mt-1 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-yellow-500 outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black rounded-xl transition-all shadow-lg">
          {loading ? '처리 중...' : (isSignUp ? '가입 완료' : '접속하기')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        {isSignUp ? '이미 계정이 있으신가요?' : '아직 회원이 아니신가요?'}
        <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-yellow-500 font-bold underline">
          {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
        </button>
      </p>
    </div>
  );
}
