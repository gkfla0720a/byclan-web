'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [ladderData, setLadderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 📝 수정 가능한 폼 상태
  const [clanNameInput, setClanNameInput] = useState(''); // 'By_'를 제외한 순수 입력값
  const [race, setRace] = useState('미지정');
  const [intro, setIntro] = useState('');

  // ✅ 중복 확인 상태
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [originalNickname, setOriginalNickname] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setRace(profileData.race || '미지정');
        setIntro(profileData.intro || '');
        
        // 초기 닉네임 세팅 로직: 'By_'로 시작하는 정식 닉네임일 때만 칸을 채움
        const currentNick = profileData.nickname || '';
        if (currentNick.startsWith('By_')) {
          const pureName = currentNick.replace('By_', '');
          setClanNameInput(pureName);
          setOriginalNickname(currentNick);
          setIsNicknameAvailable(true); // 본인 닉네임이므로 изначально 사용 가능 상태
        } else {
          // 디스코드 이름이 들어있거나, 아예 없으면 빈칸으로 둠
          setClanNameInput('');
          setOriginalNickname('');
          setIsNicknameAvailable(false);
        }

        if (currentNick.startsWith('By_')) {
          const { data: ladder } = await supabase
            .from('ladders')
            .select('*')
            .eq('nickname', currentNick)
            .single();
          if (ladder) setLadderData(ladder);
        }
      }
    } catch (error) {
      console.error("프로필 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 입력 시 중복 확인 상태 초기화
  const handleInputChange = (e) => {
    // 띄어쓰기 입력 방지
    const value = e.target.value.replace(/\s/g, '');
    setClanNameInput(value);
    
    const fullNickname = `By_${value}`;
    if (fullNickname === originalNickname) {
      setIsNicknameAvailable(true); // 내 원래 닉네임으로 되돌리면 합격
    } else {
      setIsNicknameAvailable(false); // 글자가 바뀌면 다시 중복확인 필요
    }
  };

  // ✅ 닉네임 중복 확인 로직
  const checkDuplicate = async () => {
    if (!clanNameInput.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    const fullNickname = `By_${clanNameInput}`;

    if (fullNickname === originalNickname) {
      alert('현재 사용 중인 본인의 닉네임입니다.');
      setIsNicknameAvailable(true);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('nickname', fullNickname);

      if (error) throw error;

      if (count > 0) {
        alert(`'${fullNickname}' 은(는) 이미 다른 클랜원이 사용 중입니다.\n다른 닉네임을 입력해 주세요.`);
        setIsNicknameAvailable(false);
      } else {
        alert(`'${fullNickname}' 은(는) 사용 가능한 멋진 닉네임입니다!`);
        setIsNicknameAvailable(true);
      }
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!clanNameInput.trim()) {
      alert('클랜 닉네임을 입력해 주세요.');
      return;
    }
    
    if (!isNicknameAvailable) {
      alert('닉네임 중복 확인을 먼저 완료해 주세요.');
      return;
    }

    const finalNickname = `By_${clanNameInput}`;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nickname: finalNickname,
          race: race,
          intro: intro
        })
        .eq('id', profile.id);

      if (error) throw error;
      alert('프로필이 성공적으로 업데이트되었습니다.');
      window.location.reload(); 
    } catch (error) {
      alert('프로필 업데이트 실패: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500 font-mono animate-pulse">LOADING PROFILE...</div>;
  if (!profile) return <div className="text-center py-24 text-red-400 font-bold">프로필을 불러올 수 없습니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in-down font-sans">
      
      <div className="flex justify-between items-end mb-8 border-b border-gray-700 pb-4">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
            내 프로필 설정
          </h2>
          <p className="text-gray-400 mt-1">내 정보를 관리하고 클랜 활동을 준비하세요.</p>
        </div>
        <span className="px-4 py-1.5 bg-gray-800 border border-yellow-700/50 text-yellow-500 rounded-lg font-black uppercase tracking-widest text-sm shadow-lg">
          등급: {profile.role || 'GUEST'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 🟡 왼쪽 영역: 수정 가능한 기본 정보 */}
        <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-6">
          
          <div className="bg-sky-900/20 border border-sky-800 p-4 rounded-xl">
            <h3 className="text-sky-400 font-bold mb-1 flex items-center gap-2"><span>📢</span> 클랜 닉네임 설정 안내</h3>
            <p className="text-sky-200/80 text-sm leading-relaxed">
              신입 클랜원에서 정회원으로 승급하거나 래더 시스템을 이용하려면 반드시 <strong className="text-yellow-400">By_</strong> 로 시작하는 닉네임을 설정해야 합니다. (미설정 시 랭킹보드 노출 불가)
            </p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">1. By_ 클랜 닉네임</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 relative rounded-xl bg-gray-900 border border-gray-600 overflow-hidden focus-within:border-yellow-500 transition-colors">
                <span className="flex items-center px-4 bg-gray-800 border-r border-gray-600 text-yellow-500 font-black">
                  By_
                </span>
                <input 
                  type="text" 
                  value={clanNameInput}
                  onChange={handleInputChange}
                  placeholder="아이디 (띄어쓰기 불가)"
                  className="w-full p-3.5 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
              <button 
                onClick={checkDuplicate}
                className="whitespace-nowrap px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors border border-gray-600"
              >
                중복 확인
              </button>
            </div>
            {/* 상태 메시지 */}
            <p className={`text-xs mt-2 font-bold ${clanNameInput.length === 0 ? 'text-gray-500' : isNicknameAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
              {clanNameInput.length === 0 ? '※ 사용할 닉네임을 입력 후 중복 확인을 눌러주세요.' : 
               isNicknameAvailable ? '✓ 사용 가능한 닉네임입니다.' : 
               '⚠ 중복 확인이 필요합니다.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">2. 디스코드 닉네임 (고정)</label>
              <input 
                type="text" 
                value={profile.discord_name || '알 수 없음'} 
                disabled 
                className="w-full p-3.5 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-500 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">3. 주종족 설정</label>
              <select 
                value={race} 
                onChange={(e) => setRace(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white font-bold focus:border-yellow-500 focus:outline-none transition-colors"
              >
                <option value="미지정">선택해 주세요</option>
                <option value="Terran">테란 (Terran)</option>
                <option value="Protoss">프로토스 (Protoss)</option>
                <option value="Zerg">저그 (Zerg)</option>
                <option value="Random">랜덤 (Random)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">9. 한줄 자기소개</label>
            <textarea 
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="클랜원들에게 자신을 소개해 주세요!"
              rows="3"
              className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white focus:border-yellow-500 focus:outline-none transition-colors resize-none"
            ></textarea>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={isUpdating || !isNicknameAvailable}
            className={`w-full py-4 font-black text-lg rounded-xl shadow-lg transition-transform 
              ${isNicknameAvailable && !isUpdating 
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 hover:scale-[1.02]' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
          >
            {isUpdating ? '저장 중...' : '프로필 저장하기'}
          </button>
        </div>

        {/* 🔵 오른쪽 영역: 시스템 연동 읽기 전용 정보 */}
        <div className="space-y-6">
          
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🏆</div>
            <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-3 mb-4">래더 실적 요약</h3>
            
            {ladderData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1">4. 현재 티어 및 점수</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-cyan-400">{ladderData.tier || 'Unranked'}</span>
                    <span className="text-gray-300 font-mono mb-1">({ladderData.points} P)</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1">5. 레더 승률 (전적)</p>
                  <p className="text-lg font-bold text-white">
                    {ladderData.win_rate || '0%'} 
                    <span className="text-sm font-normal text-gray-400 ml-2">({ladderData.win}승 {ladderData.lose}패)</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-600">
                <p className="text-gray-400 text-sm">래더 기록이 없습니다.</p>
                <p className="text-xs text-gray-500 mt-1">By_ 닉네임 설정 후 게임을 진행하세요.</p>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-3 mb-4">계정 기본 정보</h3>
            
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">6. 연결된 이메일</p>
              <p className="text-sm text-gray-300 font-mono">{email || '알 수 없음'}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">7. 보유 클랜 포인트</p>
              <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <span>💰</span> {profile.points?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">CP</span>
              </p>
            </div>
            
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">8. 클랜 최초 가입일자</p>
              <p className="text-sm text-gray-300 font-mono">
                {new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
