'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인용
  const [nickname, setNickname] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false); // 중복확인 완료 여부
  const [loading, setLoading] = useState(false);

  // ✨ [수정] 로그인 <-> 회원가입 모드 전환 시 모든 필드 초기화
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setIsNicknameChecked(false);
  };

  // 🔍 [추가] 닉네임 중복 확인 로직
  const checkNicknameDuplicate = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    const fullID = `By_${nickname.trim()}`;

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('ByID', fullID);

    if (error) {
      alert("오류가 발생했습니다: " + error.message);
    } else if (count > 0) {
      alert("이미 사용 중인 닉네임입니다.");
      setIsNicknameChecked(false);
    } else {
      alert("사용 가능한 닉네임입니다!");
      setIsNicknameChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      // 1. 닉네임 중복 확인 체크
      if (!isNicknameChecked) return alert("닉네임 중복 확인을 먼저 해주세요.");
      // 2. 비밀번호 일치 확인
      if (password !== confirmPassword) return alert("비밀번호가 서로 일치하지 않습니다.");
      
      setLoading(true);
      // 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: nickname } }
      });

      if (error) {
        alert("가입 실패: " + error.message);
      } else {
        // 프로필 테이블 생성
        await supabase.from('profiles').insert({
          id: data.user.id,
          ByID: `By_${nickname}`,
          role: 'rookie',
          points: 1000 // 가입 축하금
        });
        alert("가입 성공! 이메일 인증이 필요할 수 있습니다. 로그인을 진행하세요.");
        toggleMode(); // 성공 시 로그인 화면으로 전환
      }
    } else {
      // 로그인
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("로그인 실패: " + error.message);
      else window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-[2rem] border border-gray-700 shadow-2xl animate-fade-in">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tighter">
        {isSignUp ? 'JOIN BYCLAN' : 'SIGN IN'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Clan Nickname</label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-xl overflow-hidden focus-within:border-yellow-500 transition-colors">
                <span className="px-3 text-yellow-500 font-bold bg-gray-800/50 h-full flex items-center border-r border-gray-700">By_</span>
                <input 
                  type="text" value={nickname} 
                  onChange={(e) => { setNickname(e.target.value); setIsNicknameChecked(false); }} 
                  required className="w-full p-3 bg-transparent text-white focus:outline-none font-bold" 
                  placeholder="닉네임" 
                />
              </div>
              <button 
                type="button" onClick={checkNicknameDuplicate}
                className={`px-4 rounded-xl text-xs font-black transition-all ${isNicknameChecked ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {isNicknameChecked ? '확인됨' : '중복확인'}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
            required className="w-full p-3.5 mt-1 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-yellow-500 outline-none transition-all font-medium" 
            placeholder="example@clan.com" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
            required className="w-full p-3.5 mt-1 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-yellow-500 outline-none transition-all" 
            placeholder="••••••••" 
          />
        </div>

        {isSignUp && (
          <div className="animate-fade-in-down">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
            <input 
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
              required className={`w-full p-3.5 mt-1 bg-gray-900 border rounded-xl text-white outline-none transition-all ${password && confirmPassword ? (password === confirmPassword ? 'border-emerald-500' : 'border-red-500') : 'border-gray-700'}`} 
              placeholder="한 번 더 입력하세요" 
            />
            {password && confirmPassword && (
              <p className={`text-[9px] mt-1 font-bold ${password === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                {password === confirmPassword ? '✓ 비밀번호가 일치합니다.' : '⚠ 비밀번호가 일치하지 않습니다.'}
              </p>
            )}
          </div>
        )}

        <button 
          type="submit" disabled={loading} 
          className={`w-full py-4 mt-4 font-black rounded-xl transition-all shadow-xl active:scale-95
            ${loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
        >
          {loading ? 'PROCESSING...' : (isSignUp ? '가입 신청 완료' : '전투 참가')}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-gray-700 pt-6">
        <p className="text-sm text-gray-500 font-medium">
          {isSignUp ? '이미 바이클랜의 전우이신가요?' : '아직 계정이 없으신가요?'}
          <button onClick={toggleMode} className="ml-2 text-yellow-500 font-black hover:underline transition-all">
            {isSignUp ? '로그인으로 이동' : '신규 회원가입'}
          </button>
        </p>
      </div>
    </div>
  );
}
