// 파일명: src/components/AuthForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput, normalizeAccountId } from '@/utils/accountId';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const isInvalid = /^[0-9]/.test(nickname) || /[^a-zA-Z0-9]/.test(nickname);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAccountId(''); setPassword(''); setConfirmPassword('');
    setNickname(''); setIsNicknameChecked(false); setAgreed(false);
  };

  const checkNicknameDuplicate = async () => {
    if (!nickname) return alert("닉네임을 입력해주세요.");
    if (nickname.length < 2) return alert("닉네임은 최소 2글자 이상이어야 합니다.");
    if (isInvalid) return alert("형식에 맞지 않는 닉네임입니다. 첫 글자 숫자 및 특수문자를 제거해 주세요.");

    const fullID = `By_${nickname}`;
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('by_id', fullID);

    if (error) {
      alert("오류 발생: " + error.message);
    } else if (count && count > 0) {
      alert("이미 전장에 참여 중인 닉네임입니다.");
      setIsNicknameChecked(false);
    } else {
      alert("사용 가능한 닉네임입니다!");
      setIsNicknameChecked(true);
    }
  };

  // 타입스크립트 HTML 폼 이벤트 타입 지정
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSignUp) {
      if (!isNicknameChecked) return alert("닉네임 중복 확인을 먼저 해주세요.");
      if (password !== confirmPassword) return alert("비밀번호가 서로 일치하지 않습니다.");
      if (password.length < 8) return alert("비밀번호는 최소 8자 이상이어야 합니다.");
      if (!/[a-zA-Z]/.test(password)) return alert("비밀번호에 영문자가 포함되어야 합니다.");
      if (!/[0-9]/.test(password)) return alert("비밀번호에 숫자가 포함되어야 합니다.");
      if (!agreed) return alert("이용약관 및 개인정보 처리방침에 동의해주세요.");

      setLoading(true);
      const normalizedNickname = normalizeAccountId(nickname);
      const { data, error } = await supabase.auth.signUp({
        email: buildInternalAuthEmail(normalizedNickname),
        password,
        options: { data: { display_name: nickname, login_id: normalizedNickname } }
      });

      if (error) {
        alert("가입 실패: " + error.message);
      } else if (data.user) {
        const { error: pError } = await supabase.from('profiles').insert({
          id: data.user.id,
          by_id: `By_${nickname}`,
          role: 'rookie',
          clan_point: 1000
        });

        if (pError) console.error("프로필 생성 실패:", pError);
        alert("ByClan에 오신 것을 환영합니다! 로그인을 진행하세요.");
        toggleMode();
      }
    } else {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: getLoginEmailFromInput(accountId),
        password
      });
      if (error) alert("로그인 정보가 정확하지 않습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-[2.5rem] border border-gray-700 shadow-2xl relative overflow-hidden">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tighter">
        {isSignUp ? 'JOIN BYCLAN' : 'BATTLE-NET LOGIN'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Clan Nickname</label>

            <div className="flex gap-2 mt-1">
              {/* 아이디 양식에 맞지 않으면 부모 상자의 테두리 색상을 변동시켜 시각적 경고를 줍니다! */}
              <div className={`flex-1 flex items-center bg-gray-900 border rounded-2xl overflow-hidden transition-all ${isInvalid
                ? 'border-red-500 focus-within:border-red-500'
                : 'border-gray-700 focus-within:border-yellow-500'
                }`}>
                <span className="px-4 text-yellow-500 font-black text-sm bg-gray-800/50 h-full flex items-center border-r border-gray-700">By_</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setNickname(e.target.value);
                    setIsNicknameChecked(false);
                  }}
                  required
                  className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold"
                  placeholder="닉네임"
                />
              </div>
              {/* 아이디 양식에 맞지 않으면 중복확인 버튼을 잠가버려서 유저가 규칙을 인지하게 만듭니다. */}
              <button
                type="button"
                onClick={checkNicknameDuplicate}
                disabled={isInvalid}
                className={`px-5 rounded-2xl text-[10px] font-black transition-all ${isInvalid
                   ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                   : isNicknameChecked ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
              {isNicknameChecked ? 'OK' : '중복확인'}
              </button>
            </div>
            {isInvalid && (
              <p className="text-[11px] text-red-400 mt-2 ml-1 font-bold animate-pulse">
                형식에 맞지 않는 닉네임입니다. 첫 글자 숫자 및 특수문자를 제거해 주세요.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Login ID</label>
          <input
            type="text" value={accountId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountId(isSignUp ? normalizeAccountId(e.target.value) : e.target.value)}
            required className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500"
            placeholder={isSignUp ? 'yourid' : '아이디 또는 기존 이메일'}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Password</label>
          <input
            type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required minLength={8} className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500" placeholder="8자 이상, 영문+숫자"
          />
        </div>

        {isSignUp && (
          <>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Confirm Password</label>
              <input
                type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500" placeholder="비밀번호 확인"
              />
            </div>
            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox" id="agreed" checked={agreed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                />
                <label htmlFor="agreed" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer">
                  <span className="text-yellow-500 font-black">[필수]</span> 이용약관 및 개인정보 수집·이용에 동의합니다.
                </label>
              </div>
            </div>
          </>
        )}

        <button
          type="submit" disabled={loading}
          className={`w-full py-4 mt-4 font-black rounded-2xl transition-all shadow-xl text-sm tracking-widest ${loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
        >
          {loading ? 'PROCESSING...' : (isSignUp ? 'REGISTER ACCOUNT' : 'LOGIN SYSTEM')}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-gray-700 pt-6">
        <button onClick={toggleMode} className="text-xs text-gray-500 font-bold hover:text-yellow-500 uppercase tracking-tighter">
          {isSignUp ? 'Already have an account? Sign In' : 'No account yet? Register Here'}
        </button>
      </div>
    </div>
  );
}
