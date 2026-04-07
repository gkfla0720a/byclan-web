/**
 * @file MyProfile.js
 * @역할 로그인한 유저 자신의 프로필 설정 페이지 컴포넌트
 * @주요기능
 *   - 클랜 닉네임(By_ 접두사) 설정 및 중복 확인
 *   - 주종족 선택 (Protoss / Terran / Zerg / Random)
 *   - 한줄 자기소개 수정
 *   - 래더(경쟁전) 전적 데이터 표시 (포인트, 티어, 승/패)
 *   - 보유 클랜 포인트 표시
 *   - 로그아웃 기능
 *   - 개발자(developer) 등급에게만 보이는 개발자 콘솔 진입 버튼
 * @사용방법
 *   로그인된 유저만 접근 가능합니다. 프로필이 없으면 에러 메시지를 표시합니다.
 * @관련컴포넌트 DevConsole.js (개발자 콘솔), GuildManagement.js
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { isMarkedTestAccount } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

/**
 * MyProfile 컴포넌트
 * 현재 로그인한 유저가 자신의 클랜 프로필을 확인하고 수정할 수 있는 페이지입니다.
 */
export default function MyProfile() {
  /** 페이지 전환(탭 이동)을 위한 내비게이션 함수 */
  const navigateTo = useNavigate();
  /** Supabase profiles 테이블에서 불러온 전체 프로필 데이터 */
  const [profile, setProfile] = useState(null);
  /** 현재 유저의 이메일 주소 (Supabase Auth에서 가져옴) */
  const [email, setEmail] = useState('');
  /** 연결된 디스코드 닉네임 (표시 전용, 직접 수정 불가) */
  const [discordName, setDiscordName] = useState(''); 
  /** ladders 테이블에서 불러온 래더 전적 데이터 (포인트, 티어, 승/패) */
  const [ladderData, setLadderData] = useState(null);
  /** 프로필 데이터를 불러오는 중인지 여부 */
  const [loading, setLoading] = useState(true);
  /** 프로필 저장 요청이 진행 중인지 여부 (버튼 중복 클릭 방지) */
  const [isUpdating, setIsUpdating] = useState(false);

  // 수정용 입력 상태들
  /** By_ 접두사를 제외한 클랜 닉네임 입력값 (예: 'By_홍길동'에서 '홍길동') */
  const [clanNameInput, setClanNameInput] = useState(''); 
  /** 선택된 주종족 (Protoss / Terran / Zerg / Random / 미지정) */
  const [race, setRace] = useState('미지정');
  /** 한줄 자기소개 입력값 */
  const [intro, setIntro] = useState('');
  /** 닉네임 중복 확인 통과 여부. false이면 저장 버튼이 비활성화됩니다. */
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  /** 최초 로드 시 DB에 저장된 원본 ByID 값 (중복 확인 시 본인 닉네임 허용 판단에 사용) */
  const [originalByID, setOriginalByID] = useState('');

  /** 역할 코드를 한국어 표시 이름(+이모지)으로 변환하는 매핑 테이블 */
  const roleLabels = {
    developer: "👨‍💻 시스템 개발자",
    master: "👑 클랜 마스터",
    admin: "🛠️ 운영진",
    elite: "⚔️ 정예 클랜원",
    member: "🛡️ 일반 클랜원",
    rookie: "🌱 신입 클랜원",
    applicant: "📝 신규 가입자",
    guest: "👤 방문자"
  };

  /**
   * 컴포넌트가 처음 마운트될 때 프로필 데이터를 불러옵니다.
   * 빈 배열 []이므로 최초 1회만 실행됩니다.
   */
  useEffect(() => {
    fetchProfileData();
  }, []);

  /**
   * Supabase에서 현재 유저의 프로필 및 래더 데이터를 불러옵니다.
   * By_ 접두사가 있는 닉네임이 있으면 래더 데이터도 함께 조회합니다.
   * @async
   */
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

  /**
   * 닉네임 입력 필드 변경 핸들러입니다.
   * 공백을 자동으로 제거하고, 값이 바뀌면 중복 확인 상태를 리셋합니다.
   * (단, 입력값이 원래 본인 닉네임과 동일하면 바로 사용 가능 상태로 유지합니다.)
   * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 변경 이벤트
   */
  // 닉네임 입력 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // 공백 제거
    setClanNameInput(value);
    // 입력값이 바뀌면 다시 중복 확인을 하도록 설정 (단, 원래 자기 닉네임이면 허용)
    setIsNicknameAvailable(`By_${value}` === originalByID);
  };

  /**
   * 입력한 닉네임(By_ 포함)이 이미 다른 유저가 사용 중인지 확인합니다.
   * 본인의 현재 닉네임과 동일하면 중복으로 처리하지 않습니다.
   * @async
   */
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

  /**
   * 변경된 프로필 정보(닉네임, 종족, 자기소개)를 DB에 저장합니다.
   * 닉네임 중복 확인을 통과하지 않으면 저장이 차단됩니다.
   * 저장 성공 후 페이지를 새로고침하여 최신 데이터를 반영합니다.
   * @async
   */
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

  /**
   * 현재 유저를 Supabase에서 로그아웃하고 홈으로 이동합니다.
   * 로컬 스토리지를 초기화하여 캐시된 세션 정보를 제거합니다.
   * @async
   */
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
  /** 현재 유저가 개발자 등급인지 여부 (개발자 콘솔 버튼 표시 여부 결정) */
  const isDeveloper = currentRole === 'developer';
  /** 화면에 표시할 현재 역할의 한국어 라벨 */
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