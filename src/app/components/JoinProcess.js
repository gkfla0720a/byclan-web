'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; // Supabase 클라이언트 연결 (경로는 프로젝트에 맞게 확인)

export default function JoinProcess() {
  const [formData, setFormData] = useState({ 
    btag: '', 
    race: 'Terran', 
    tier: '', 
    intro: '', 
    phone: '' // ✅ 전화번호 상태 추가
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // 컴포넌트가 렌더링될 때 현재 로그인한 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 로그인 여부 확인 (비로그인 제출 방지)
    if (!user) {
      alert('가입 신청을 하려면 로그인이 필요합니다. 우측 상단의 Discord 로그인 버튼을 클릭해주세요.');
      return;
    }

    // 2. 전화번호 형식 간단 검증 (선택사항)
    if (formData.phone.length < 10) {
      alert('정확한 연락처(전화번호)를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 3. Supabase 'applications' 테이블에 데이터 전송
      // 사진에 있던 컬럼명(user_id, discord_n(있다면), btag 등)에 맞춰 작성합니다.
      const { error } = await supabase
        .from('applications')
        .insert([
          {
            user_id: user.id, // 사진에서 확인된 외래키 컬럼
            btag: formData.btag,
            race: formData.race,
            tier: formData.tier,
            intro: formData.intro,
            phone: formData.phone // 방금 추가한 전화번호 컬럼
            // status, created_at 등은 DB의 기본값으로 자동 처리됩니다!
          }
        ]);

      if (error) throw error;

      alert('가입 신청이 성공적으로 접수되었습니다!\n정예 클랜원이 확인 후 입력하신 연락처로 연락드릴 예정입니다.');
      
      // 제출 후 폼 초기화
      setFormData({ btag: '', race: 'Terran', tier: '', intro: '', phone: '' });

    } catch (error) {
      console.error('신청서 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="text-center mb-8 border-b border-gray-700 pb-6">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">가입 신청</h2>
        <p className="text-gray-400">ByClan과 함께할 새로운 가족을 모집합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 sm:p-8 shadow-xl flex flex-col gap-6 font-sans">
        
        {/* 안내 메시지 추가 */}
        <div className="bg-sky-900/30 border border-sky-700 p-4 rounded-lg text-sm text-sky-200 mb-2">
          <p className="font-bold mb-1">📢 가입 테스트 안내</p>
          <p>신청서를 제출하시면 정예 클랜원이 확인 후 기재하신 연락처로 가입 테스트(게임 진행) 일정을 조율하기 위해 연락을 드립니다.</p>
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">배틀태그 (Battle Tag)</label>
          <input type="text" name="btag" placeholder="예: Slayer#1234" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 transition-colors" value={formData.btag} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">주종족</label>
          <select name="race" className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 transition-colors" value={formData.race} onChange={handleChange}>
            <option value="Terran">테란 (Terran)</option>
            <option value="Protoss">프로토스 (Protoss)</option>
            <option value="Zerg">저그 (Zerg)</option>
            <option value="Random">랜덤 (Random)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">현재 티어 / 래더 점수</label>
          <input type="text" name="tier" placeholder="예: 래더 S / 2100점" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 transition-colors" value={formData.tier} onChange={handleChange} />
        </div>

        {/* ✅ 전화번호 입력 필드 추가 */}
        <div>
          <label className="block text-gray-300 font-bold mb-2">연락처 (전화번호)</label>
          <input type="text" name="phone" placeholder="예: 010-1234-5678 (하이픈 포함)" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 transition-colors" value={formData.phone} onChange={handleChange} />
          <p className="text-xs text-gray-500 mt-2">※ 가입 테스트 일정 조율을 위해 정확히 입력해 주세요. 운영진 외에는 공개되지 않습니다.</p>
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">간단한 자기소개 및 각오</label>
          <textarea name="intro" placeholder="길드원들에게 인사말을 남겨주세요!" rows="4" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 resize-none transition-colors" value={formData.intro} onChange={handleChange}></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} // 제출 중일 때 버튼 비활성화 (중복 제출 방지)
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 mt-2"
        >
          {isSubmitting ? '신청서 전송 중...' : '신청서 제출하기'}
        </button>
      </form>
    </div>
  );
}
