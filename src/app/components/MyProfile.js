'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { isMarkedTestAccount } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

export default function MyProfile() {
  const navigateTo = useNavigate();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [discordName, setDiscordName] = useState(''); 
  const [ladderData, setLadderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 수정용 입력 상태들
  const [clanNameInput, setClanNameInput] = useState(''); 
  const [race, setRace] = useState('미지정');
  const [intro, setIntro] = useState('');
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [originalByID, setOriginalByID] = useState('');

  // 직급 라벨 정의
  const roleLabels = {
    developer: "👨‍💻 시스템 개발자",
    master: "👑 클랜 마스터",
    admin: "🛠️ 운영진",
    elite: "⚔️ 정예 클랜원",
    member: "🛡️ 일반 클랜원",
    rookie: "🌱 신입 클랜원",
    associate: "👀 테스트신청자",
    guest: "👤 방문자"
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (profileData) {
        setProfile(profileData);
        setRace(profileData.race || '미지정');
        setIntro(profileData.intro || '');
        setDiscordName(profileData.discord_name || user.user_metadata?.full_name || '알 수 없음');
        
        const currentByID = profileData.ByID || '';
        if (currentByID.startsWith('By_')) {
          setClanNameInput(currentByID.replace('By_', ''));
          setOriginalByID(currentByID);
          setIsNicknameAvailable(true); // 기존에 By_ 닉네임이 있으면 일단 활성화
        }

        // 래더 데이터 가져오기
        if (currentByID.startsWith('By_')) {
          const { data: ladder } = await supabase.from('ladders').select('*').eq('nickname', currentByID).maybeSingle();
          if (ladder) setLadderData(ladder);
        }
      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 입력 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // 공백 제거
    setClanNameInput(value);
    // 입력값이 바뀌면 다시 중복 확인을 하도록 설정 (단, 원래 자기 닉네임이면 허용)
    setIsNicknameAvailable(`By_${value}` === originalByID);
  };

  // 닉네임 중복 확인
  const checkDuplicate = async () => {
    if (!clanNameInput.trim()) return alert('닉네임을 입력해 주세요.');
    const fullNickname = `By_${clanNameInput}`;

    if (fullNickname === originalByID) {
      alert('현재 사용 중인 본인의 닉네임입니다.');
      setIsNicknameAvailable(true);
      return;
    }

    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('ByID', fullNickname);

      if (count > 0) {
        alert(`'${fullNickname}'은(는) 이미 다른 유저가 사용 중입니다.`);
        setIsNicknameAvailable(false);
      } else {
        alert(`'${fullNickname}'은(는) 사용 가능한 닉네임입니다!`);
        setIsNicknameAvailable(true);
      }
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 프로필 업데이트 저장
  const handleUpdate = async () => {
    if (!isNicknameAvailable) {
      alert('닉네임 중복 확인을 먼저 완료해 주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.from('profiles').update({ 
        ByID: `By_${clanNameInput}`,
        race: race,
        intro: intro,
        discord_name: discordName 
      }).eq('id', profile.id);

      if (error) throw error;
      alert('프로필이 성공적으로 업데이트되었습니다.');
      window.location.reload(); 
    } catch (error) {
      alert('업데이트 실패: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500 font-mono animate-pulse">LOADING...</div>;
  if (!profile) return <div className="text-center py-24 text-red-500">프로필 정보를 찾을 수 없습니다.</div>;

  // 권한 체크: 소문자로 변환하여 정확히 비교
  const currentRole = profile.role?.trim().toLowerCase();
  const isDeveloper = currentRole === 'developer';
  const userRoleLabel = roleLabels[currentRole] || `👤 방문자 (${currentRole})`;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in font-sans relative">
      
      {/* ⚙️ 비밀 톱니바퀴 (오직 'developer' 등급에게만 보임) */}
      {isDeveloper && (
        <button 
          onClick={() => navigateTo('개발자')}
          className="absolute top-8 right-4 text-yellow-600 hover:text-yellow-400 p-2 hover:rotate-90 transition-all duration-300"
          title="시스템 개발자 콘솔 진입"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-white">내 프로필 설정</h2>
        <p className="text-yellow-500 font-bold mt-1 tracking-tight">{userRoleLabel} 모드로 접속 중</p>
        {isMarkedTestAccount(profile) && <p className="text-xs text-amber-300 mt-2">TEST ACCOUNT: 개발자 콘솔에서 언제든지 on/off 할 수 있는 테스트 계정입니다.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 왼쪽 섹션: 회원 정보 수정 폼 */}
        <div className="lg:col-span-2 bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-6">
          
          {/* 1. 닉네임 설정 */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">1. 클랜 닉네임 (By_ ID)</label>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 rounded-xl overflow-hidden focus-within:border-yellow-500 transition-colors">
                <span className="px-4 bg-gray-800 text-yellow-500 font-black text-sm border-r border-gray-700">By_</span>
                <input 
                  type="text" 
                  value={clanNameInput}
                  onChange={handleInputChange}
                  placeholder="아이디"
                  className="w-full p-3.5 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
              <button 
                onClick={checkDuplicate}
                className="px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm transition-all border border-gray-600 shadow-lg"
              >
                중복 확인
              </button>
            </div>
            <p className={`text-[10px] mt-2 font-bold ${isNicknameAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
              {isNicknameAvailable ? '✓ 사용 가능한 닉네임입니다.' : '⚠ 변경 시 중복 확인이 반드시 필요합니다.'}
            </p>
          </div>

          {/* 2. 디스코드 & 종족 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">2. 연결된 디스코드</label>
              <input type="text" value={discordName} disabled className="w-full p-3.5 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-500 cursor-not-allowed text-sm font-medium" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">3. 주종족 선택</label>
              <select 
                value={race} 
                onChange={(e) => setRace(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white font-bold text-sm focus:border-yellow-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value="미지정">선택해 주세요</option>
                <option value="Protoss">프로토스 (Protoss)</option>
                <option value="Terran">테란 (Terran)</option>
                <option value="Zerg">저그 (Zerg)</option>
                <option value="Random">랜덤 (Random)</option>
              </select>
            </div>
          </div>

          {/* 3. 자기소개 */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">4. 한줄 자기소개</label>
            <textarea 
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="클랜원들에게 보여질 한마디를 입력하세요."
              rows="3"
              className="w-full p-4 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none resize-none transition-all"
            ></textarea>
          </div>

          {/* 저장 버튼 */}
          <button 
            onClick={handleUpdate}
            disabled={isUpdating || !isNicknameAvailable}
            className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95
              ${isNicknameAvailable && !isUpdating 
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 hover:brightness-110' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
          >
            {isUpdating ? '데이터 처리 중...' : '변경 사항 저장하기'}
          </button>
        </div>

        {/* 오른쪽 섹션: 전적 및 자산 정보 */}
        <div className="space-y-6">
          
          {/* 래더 정보 카드 */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform duration-500">🏆</div>
            <h3 className="text-white font-black text-xs mb-6 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">Ladder Status</h3>
            <div className="space-y-5">
              <div>
                <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Rating Points</p>
                <p className="text-4xl font-black text-cyan-400">{ladderData?.points || 0} <span className="text-xs text-gray-500 font-normal">PTS</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Tier</p>
                  <p className="text-white font-bold italic">{ladderData?.tier || 'Unranked'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">W / L</p>
                  <p className="text-white font-bold">{ladderData?.win || 0}승 {ladderData?.lose || 0}패</p>
                </div>
              </div>
            </div>
          </div>

          {/* 포인트 카드 */}
          <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
             <h3 className="text-white font-black text-xs mb-4 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">Clan Assets</h3>
             <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">보유 클랜 포인트</p>
             <p className="text-2xl font-black text-emerald-400 flex items-center gap-2">
               💰 {profile.points?.toLocaleString() || 0} <span className="text-xs text-gray-500 font-normal">CP</span>
             </p>
          </div>

          {/* 로그아웃 버튼 */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-gray-900 hover:bg-red-900/20 border border-gray-800 hover:border-red-500/50 text-gray-500 hover:text-red-500 text-xs font-black rounded-2xl transition-all shadow-md uppercase tracking-widest"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}