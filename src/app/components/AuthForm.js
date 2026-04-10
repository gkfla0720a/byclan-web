/**
 * 파일명: AuthForm.js
 *
 * 역할:
 *   ByClan 서비스의 로그인 및 회원가입 폼 컴포넌트입니다.
 *   하나의 컴포넌트에서 로그인/회원가입 모드를 전환하며 처리합니다.
 *
 * 주요 기능:
 *   - 이메일/비밀번호 로그인
 *   - 닉네임 입력 + 중복 확인 후 회원가입 (By_ 접두사 자동 부여)
 *   - 가입 시 이용약관 동의 필수 처리
 *   - 약관 상세 내용을 모달(팝업)로 표시
 *   - 가입 성공 시 profiles 테이블에 초기 프로필 데이터 자동 생성
 *
 * 사용 방법:
 *   <AuthForm />
 *   (별도의 props 없이 독립적으로 사용합니다.)
 */
'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';

/**
 * 로그인/회원가입 폼 컴포넌트
 * 버튼 클릭으로 로그인 모드 ↔ 회원가입 모드를 전환합니다.
 *
 * @returns {JSX.Element} 로그인 또는 회원가입 폼 UI
 */
export default function AuthForm() {
  /** 현재 모드: false = 로그인, true = 회원가입 */
  const [isSignUp, setIsSignUp] = useState(false);
  /** 이메일 입력값 */
  const [email, setEmail] = useState('');
  /** 비밀번호 입력값 */
  const [password, setPassword] = useState('');
  /** 비밀번호 확인 입력값 (회원가입 모드에서만 사용) */
  const [confirmPassword, setConfirmPassword] = useState('');
  /** 닉네임 입력값 (By_ 접두사 제외한 부분만 입력받음) */
  const [nickname, setNickname] = useState('');
  /** 닉네임 중복 확인 완료 여부. 중복 확인 전에는 가입 불가. */
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  /** 이용약관 동의 여부. true여야 가입 가능. */
  const [agreed, setAgreed] = useState(false); // ✨ 약관 동의 상태
  /** API 요청 처리 중 여부. true이면 버튼 비활성화 및 "PROCESSING..." 표시. */
  const [loading, setLoading] = useState(false);
  /** 약관 상세 모달 표시 여부 */
  const [showTerms, setShowTerms] = useState(false); // ✨ 약관 팝업 토글

  /**
   * 로그인/회원가입 모드를 전환하고 모든 입력값을 초기화합니다.
   * 모드 전환 시 이전에 입력한 내용이 남아있지 않도록 전체 리셋합니다.
   */
  // [수정] 모드 전환 시 모든 상태값 초기화
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setIsNicknameChecked(false);
    setAgreed(false);
  };

  /**
   * 닉네임 중복 여부를 Supabase에서 확인합니다.
   * - 입력값 앞에 'By_'를 붙여 ByID 컬럼과 비교합니다.
   * - 중복 없으면 isNicknameChecked를 true로 설정하여 가입을 허용합니다.
   * - 닉네임 변경 시 isNicknameChecked가 자동으로 false로 리셋됩니다.
   */
  // [추가] 닉네임 중복 확인
  const checkNicknameDuplicate = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    if (nickname.length < 2) return alert("닉네임은 최소 2글자 이상이어야 합니다.");
    
    const fullID = `By_${nickname.trim()}`;
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('ByID', fullID);

    if (error) {
      alert("오류 발생: " + error.message);
    } else if (count > 0) {
      alert("이미 전장에 참여 중인 닉네임입니다.");
      setIsNicknameChecked(false);
    } else {
      alert("사용 가능한 닉네임입니다!");
      setIsNicknameChecked(true);
    }
  };

  /**
   * 폼 제출 핸들러입니다. 로그인 또는 회원가입을 처리합니다.
   *
   * 회원가입 시 처리 순서:
   *   1. 닉네임 중복 확인 여부 검증
   *   2. 비밀번호 일치 검증
   *   3. 이용약관 동의 여부 검증
   *   4. Supabase auth.signUp() 호출
   *   5. 성공 시 profiles 테이블에 초기 데이터 삽입 (역할: rookie, 포인트: 1000)
   *
   * 로그인 시 처리 순서:
   *   1. Supabase auth.signInWithPassword() 호출
   *   2. 성공 시 페이지 새로고침으로 인증 상태 반영
   *
   * @param {React.FormEvent} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (!isNicknameChecked) return alert("닉네임 중복 확인을 먼저 해주세요.");
      if (password !== confirmPassword) return alert("비밀번호가 서로 일치하지 않습니다.");
      if (password.length < 8) return alert("비밀번호는 최소 8자 이상이어야 합니다.");
      if (!/[a-zA-Z]/.test(password)) return alert("비밀번호에 영문자가 포함되어야 합니다.");
      if (!/[0-9]/.test(password)) return alert("비밀번호에 숫자가 포함되어야 합니다.");
      if (!agreed) return alert("이용약관 및 개인정보 처리방침에 동의해주세요.");
      
      setLoading(true);
      // 1. 회원가입 (이메일 인증을 켰다면 가입 직후 로그인이 안 될 수 있음)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: nickname } }
      });

      if (error) {
        alert("가입 실패: " + error.message);
      } else if (data.user) {
        // 2. 가입 성공 시 프로필 데이터 생성
        const { error: pError } = await supabase.from('profiles').insert({
          id: data.user.id,
          ByID: `By_${nickname}`,
          role: 'rookie',
          Clan_Point: 1000
        });

        if (pError) console.error("프로필 생성 실패:", pError);
        alert("ByClan에 오신 것을 환영합니다! 로그인을 진행하세요.");
        toggleMode();
      }
    } else {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("로그인 정보가 정확하지 않습니다.");
      else window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-[2.5rem] border border-gray-700 shadow-2xl animate-fade-in relative overflow-hidden">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tighter">
        {isSignUp ? 'JOIN BYCLAN' : 'BATTLE-NET LOGIN'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Clan Nickname</label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-yellow-500 transition-all">
                <span className="px-4 text-yellow-500 font-black text-sm bg-gray-800/50 h-full flex items-center border-r border-gray-700">By_</span>
                <input 
                  type="text" value={nickname} 
                  onChange={(e) => { setNickname(e.target.value.replace(/\s/g, '')); setIsNicknameChecked(false); }} 
                  required className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold" 
                  placeholder="닉네임" 
                />
              </div>
              <button 
                type="button" onClick={checkNicknameDuplicate}
                className={`px-5 rounded-2xl text-[10px] font-black transition-all ${isNicknameChecked ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {isNicknameChecked ? 'OK' : '중복확인'}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
            required className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:border-yellow-500 outline-none transition-all font-medium" 
            placeholder="example@clan.com" 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
            required minLength={8}
            className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:border-yellow-500 outline-none transition-all" 
            placeholder="8자 이상, 영문+숫자" 
          />
          {isSignUp && password && (
            <div className="flex gap-3 mt-1.5 text-[10px] pl-1">
              <span className={password.length >= 8 ? 'text-green-400' : 'text-gray-600'}>✓ 8자 이상</span>
              <span className={/[a-zA-Z]/.test(password) ? 'text-green-400' : 'text-gray-600'}>✓ 영문 포함</span>
              <span className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-600'}>✓ 숫자 포함</span>
            </div>
          )}
        </div>

        {isSignUp && (
          <>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <input 
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                required className={`w-full p-4 mt-1 bg-gray-900 border rounded-2xl text-white outline-none transition-all ${password && confirmPassword ? (password === confirmPassword ? 'border-emerald-500' : 'border-red-500') : 'border-gray-700'}`} 
                placeholder="비밀번호 확인" 
              />
            </div>

            {/* ✨ 법적 동의 체크박스 */}
            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 space-y-3">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" id="agreed" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                />
                <label htmlFor="agreed" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer">
                  <span className="text-yellow-500 font-black">[필수]</span> 이용약관 및 개인정보 수집·이용에 동의하며, 클랜 내 매너 수칙을 준수할 것을 약속합니다.
                </label>
              </div>
              <button 
                type="button" onClick={() => setShowTerms(true)}
                className="text-[10px] text-gray-600 underline font-bold hover:text-gray-400 ml-7"
              >
                상세 약관 보기
              </button>
            </div>
          </>
        )}

        <button 
          type="submit" disabled={loading} 
          className={`w-full py-4 mt-4 font-black rounded-2xl transition-all shadow-xl active:scale-95 text-sm tracking-widest
            ${loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
        >
          {loading ? 'PROCESSING...' : (isSignUp ? 'REGISTER ACCOUNT' : 'LOGIN SYSTEM')}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-gray-700 pt-6">
        <button onClick={toggleMode} className="text-xs text-gray-500 font-bold hover:text-yellow-500 transition-all uppercase tracking-tighter">
          {isSignUp ? 'Already have an account? Sign In' : 'No account yet? Register Here'}
        </button>
      </div>

      {/* ✨ 약관 모달 (상세보기 클릭 시) */}
      {showTerms && (
        <div className="absolute inset-0 bg-gray-900 z-50 p-6 flex flex-col animate-fade-in-down">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-black text-sm">ByClan Terms & Privacy</h3>
            <button onClick={() => setShowTerms(false)} className="text-red-500 font-bold text-xs">닫기</button>
          </div>
          <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-800 overflow-y-auto text-[10px] text-gray-400 leading-relaxed space-y-4">
            <p className="text-yellow-500 font-bold">[개인정보 수집 및 이용 동의]</p>
            <p>1. 수집항목: 이메일, 비밀번호, 클랜 닉네임<br/>2. 수집목적: 회원식별 및 래더 시스템 운영<br/>3. 보유기간: 회원 탈퇴 시 즉시 파기</p>
            <p className="text-yellow-500 font-bold">[클랜 수칙]</p>
            <p>1. 타 유저에 대한 비방 및 욕설 금지<br/>2. 핵/불법 프로그램 사용 금지<br/>3. 운영진의 정당한 지시 이행</p>
          </div>
        </div>
      )}
    </div>
  );
}
