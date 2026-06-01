// 파일명: src/components/AuthForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/supabase';
import { buildInternalAuthEmail, getLoginEmailFromInput } from '@/utils/accountId';

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const isNicknameValid = /^[a-zA-Z0-9]{2,20}$/.test(nickname);
  const [accountId, setAccountId] = useState('');
  const [isAccountIdChecked, setIsAccountIdChecked] = useState(false);
  const isAccountIdValid = /^[^0-9]/.test(accountId) && /^[a-zA-Z0-9]{2,20}$/.test(accountId);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);



  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAccountId(''); setIsAccountIdChecked(false);
    setNickname(''); setIsNicknameChecked(false);
    setPassword(''); setConfirmPassword('');
    setAgreed(false);
  };

  const checkAccountDupl = async () => {
    if (!accountId) return alert("계정ID를 입력해 주세요.");
    if (!isAccountIdValid) return alert("형식에 맞지 않는 계정ID입니다. 영문으로 시작하고 영문과 숫자만 사용하여 2~20자로 작성해 주세요.");

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (error) {
      alert("오류 발생: " + error.message);
    } else if (count && count > 0) {
      alert("이미 존재하는 계정ID입니다.");
      setIsAccountIdChecked(false);
    } else {
      alert("사용 가능한 계정ID입니다!");
      setIsAccountIdChecked(true);
    }
  };

  const checkNickDupl = async () => {
    if (!nickname) return alert("닉네임을 입력해 주세요.");
    if (!isNicknameValid) return alert("형식에 맞지 않는 By_닉네임입니다. 영문과 숫자만 사용하여 2~20자로 작성해 주세요.");

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
      // 1. 회원가입 가드 조항들
      if (!isAccountIdChecked) return alert("계정ID 중복 확인을 먼저 해 주세요.");
      if (!isNicknameChecked) return alert("By_닉네임 중복 확인을 먼저 해 주세요.");
      if (password !== confirmPassword) return alert("비밀번호가 서로 일치하지 않습니다.");
      if (password.length < 8) return alert("비밀번호는 최소 8자 이상이어야 합니다.");
      if (!/[a-zA-Z]/.test(password)) return alert("비밀번호에 영문자가 포함되어야 합니다.");
      if (!/[0-9]/.test(password)) return alert("비밀번호에 숫자가 포함되어야 합니다.");
      if (!agreed) return alert("이용약관 및 개인정보처리 방침에 동의해 주세요.");

      setLoading(true);

      // 💡 유틸 함수를 사용해 Supabase가 통과시켜줄 가짜 시스템 이메일을 임시로 만듭니다.
      const systemEmail = buildInternalAuthEmail(accountId);

      const { data, error } = await supabase.auth.signUp({
        email: systemEmail, // 👈 생성된 가짜 이메일을 서버에 전달합니다.
        password,
        options: {
          data: {
            login_id: accountId,
            By_Nickname: nickname
          }
        }
      });

      if (error) {
        alert("가입 실패: " + error.message);
      } else if (data.user) {
        // 💡 프로필 DB에는 유저가 입력한 순수한 일반 아이디(accountId)를 저장합니다!
        const { error: pError } = await supabase.from('profiles').insert({
          id: data.user.id,
          account_id: accountId,
          by_id: `By_${nickname}`,
          role: 'applicant',
          clan_point: 0
        });

        if (pError) console.error("프로필 생성 실패:", pError);
        alert("ByClan에 오신 것을 환영합니다! 로그인을 진행하세요.");
        toggleMode();
      }
    } else {
      // 2. 로그인 로직 구역
      setLoading(true);

      // 💡 로그인창에 입력한 일반 아이디 뒤에 자동으로 시스템 도메인을 붙여서 로그인 요청을 보냅니다.
      const systemLoginEmail = getLoginEmailFromInput(accountId);

      const { error } = await supabase.auth.signInWithPassword({
        email: systemLoginEmail, // 👈 가공된 이메일로 Supabase 문을 두드립니다.
        password
      });

      if (error) {
        alert("로그인 정보가 정확하지 않습니다.");
      } else {
        alert("전장에 접속했습니다!");
        // 여기에 메인 페이지나 대시보드로 이동하는 코드를 추후 작성하시면 됩니다.
      }
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
            {/* 계정ID */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Login ID</label>
              <div className="flex gap-2 mt-1">
                {/* 계정 아이디가 '비어있지 않은데' 규칙에 '어긋나면(flat !)' 테두리를 빨갛게 만듭니다. */}
                <div className={`flex-1 flex items-center bg-gray-900 border rounded-2xl overflow-hidden transition-all 
                  ${accountId && !isAccountIdValid
                    ? 'border-red-500 focus-within:border-red-500'
                    : 'border-gray-700 focus-within:border-yellow-500'
                  }`}>
                  <span className="px-4 text-yellow-500 font-black text-sm bg-gray-800/50 h-full flex items-center border-r border-gray-700">계정 ID:</span>
                  <input
                    type="text"
                    value={accountId}
                    minLength={2}
                    maxLength={20}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setAccountId(e.target.value);
                      setIsAccountIdChecked(false);
                    }}
                    required
                    className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold"
                    placeholder="계정ID (영문 시작, 영문+숫자, 2~20자)"
                  />
                </div>
                {/* 계정ID 양식에 맞지 않으면 중복확인 버튼을 잠가버려서 유저가 규칙을 인지하게 만듭니다. */}
                <button
                  type="button"
                  onClick={checkAccountDupl}
                  disabled={!isAccountIdValid}
                  className={`px-5 rounded-2xl text-[10px] font-black transition-all ${!isAccountIdValid
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : isAccountIdChecked ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  {isAccountIdChecked ? 'OK' : '중복확인'}
                </button>
              </div>
              {accountId && !isAccountIdValid && (
                <p className="text-[11px] text-red-400 mt-2 ml-1 font-bold animate-pulse">
                  형식에 맞지 않는 계정ID입니다. 첫 글자는 영문만, 영문과 숫자만 사용하여 2~20자 만 허용됩니다.
                </p>
              )}
            </div>

            {/* By_닉네임 */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">By_ Nickname</label>
              <div className="flex gap-2 mt-1">
                {/* By_닉네임이 '비어있지 않은데' 규칙에 '어긋나면(flat !)' 테두리를 빨갛게 만듭니다. */}
                <div className={`flex-1 flex items-center bg-gray-900 border rounded-2xl overflow-hidden transition-all 
                  ${nickname && !isNicknameValid
                    ? 'border-red-500 focus-within:border-red-500'
                    : 'border-gray-700 focus-within:border-yellow-500'
                  }`}>
                  <span className="px-4 text-yellow-500 font-black text-sm bg-gray-800/50 h-full flex items-center border-r border-gray-700">By_</span>
                  <input
                    type="text"
                    value={nickname}
                    minLength={2}
                    maxLength={20}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNickname(e.target.value);
                      setIsNicknameChecked(false);
                    }}
                    required
                    className="w-full p-3.5 bg-transparent text-white focus:outline-none font-bold"
                    placeholder="By_닉네임 (영문+숫자, 2~20자)"
                  />
                </div>
                {/* By_닉네임 양식에 맞지 않으면 중복확인 버튼을 잠가버려서 유저가 규칙을 인지하게 만듭니다. */}
                <button
                  type="button"
                  onClick={checkNickDupl}
                  disabled={!isNicknameValid}
                  className={`px-5 rounded-2xl text-[10px] font-black transition-all ${!isNicknameValid
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : isNicknameChecked ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  {isNicknameChecked ? 'OK' : '중복확인'}
                </button>
              </div>
              {nickname && !isNicknameValid && (
                <p className="text-[11px] text-red-400 mt-2 ml-1 font-bold animate-pulse">
                  형식에 맞지 않는 By_닉네임입니다. 영문과 숫자만 사용하여 2~20자 만 허용됩니다.
                </p>
              )}
            </div>
          </div>
        )}

        {!isSignUp && (
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Login ID</label>
            <input
              type="text" value={accountId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountId(e.target.value)}
              required
              minLength={2}
              maxLength={20}
              className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500" placeholder="계정ID (영문 시작, 영문+숫자, 2~20자)"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Password</label>
          <input
            type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required minLength={8} maxLength={30} className="w-full p-4 mt-1 bg-gray-900 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-yellow-500" placeholder="8자 이상, 영문+숫자"
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
