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
  const [nickname, setNickname] = useState('');
  const [race, setRace] = useState('미지정');
  const [intro, setIntro] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // 1. 유저 인증 정보 가져오기 (이메일 획득용)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email);

      // 2. 프로필 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setNickname(profileData.nickname || '');
        setRace(profileData.race || '미지정');
        setIntro(profileData.intro || '');

        // 3. 래더 정보 가져오기 (닉네임 기반으로 조회)
        if (profileData.nickname) {
          const { data: ladder } = await supabase
            .from('ladders')
            .select('*')
            .eq('nickname', profileData.nickname)
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

  const handleUpdate = async () => {
    // 🚨 By_ 닉네임 검증 로직
    if (nickname.trim() !== '' && !nickname.startsWith('By_')) {
      alert('클랜 닉네임은 반드시 "By_" 형식으로 시작해야 합니다. (예: By_Slayer)');
      return;
    }

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nickname: nickname.trim(),
          race: race,
          intro: intro
        })
        .eq('id', profile.id);

      if (error) throw error;
      alert('프로필이 성공적으로 업데이트되었습니다.');
      window.location.reload(); // 헤더 닉네임 등 동기화를 위해 새로고침
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
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: By_Slayer (미입력 시 보류)"
              className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white font-bold focus:border-yellow-500 focus:outline-none transition-colors"
            />
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
            disabled={isUpdating}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-black text-lg rounded-xl shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isUpdating ? '저장 중...' : '프로필 저장하기'}
          </button>
        </div>

        {/* 🔵 오른쪽 영역: 시스템 연동 읽기 전용 정보 */}
        <div className="space-y-6">
          
          {/* 래더 시스템 정보 카드 */}
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

          {/* 계정 보안 및 기타 정보 카드 */}
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
