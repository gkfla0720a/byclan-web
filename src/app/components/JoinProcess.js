'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function JoinProcess({ view }) {
  // 폼 상태 관리
  const [formData, setFormData] = useState({ 
    btag: '', 
    race: 'Protoss', 
    tier: '', 
    intro: '', 
    phone: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // 현재 로그인한 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('가입 신청을 하려면 로그인이 필요합니다. 우측 상단의 Discord 로그인 버튼을 클릭해주세요.');
      return;
    }

    if (formData.phone.length < 10) {
      alert('정확한 연락처(전화번호)를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id, 
          btag: formData.btag,
          race: formData.race,
          tier: formData.tier,
          intro: formData.intro,
          phone: formData.phone
        }]);

      if (error) throw error;

      alert('가입 신청이 성공적으로 접수되었습니다!\n정예 클랜원이 확인 후 입력하신 연락처로 연락드릴 예정입니다.');
      setFormData({ btag: '', race: 'Protoss', tier: '', intro: '', phone: '' });

    } catch (error) {
      console.error('신청서 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // === 1. [가입 안내] 화면 ===
  if (view === '가입안내') {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in-down">
        <div className="text-center mb-10 border-b border-gray-700 pb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">가입 안내</h2>
          <p className="text-gray-400">최강의 빠른무한 클랜, ByClan에 오신 것을 환영합니다.</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-yellow-500 border-b border-gray-700 pb-2">⚔️ 가입 절차</h3>
          <ol className="list-decimal list-inside text-gray-300 space-y-3 pl-2">
            <li>상단 메뉴에서 <strong>[가입신청]</strong>을 클릭하여 신청서를 작성합니다.</li>
            <li>제출된 신청서를 운영진 및 정예 클랜원이 확인합니다.</li>
            <li>기재하신 연락처로 연락을 드려 <strong>가입 테스트(게임 진행) 일정</strong>을 조율합니다.</li>
            <li>테스트 후 운영진 승인을 거쳐 <strong>신입 클랜원(Rookie)</strong>으로 임명됩니다.</li>
          </ol>
        </div>
      </div>
    );
  }

  // === 2. [정회원 전환신청] 화면 ===
  if (view === '정회원 전환신청') {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 px-4 animate-fade-in-down text-center">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-6">정회원 전환 신청</h2>
        <div className="bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-xl">
          <p className="text-gray-300 mb-4">신입 클랜원에서 정회원(Member)으로 승급하기 위한 공간입니다.</p>
          <p className="text-sky-400 font-bold mb-6">전환 조건: 래더 최소 10경기 참여 및 디스코드 활동</p>
          <button className="px-8 py-3 bg-gray-600 text-gray-400 font-bold rounded-lg cursor-not-allowed">
            (현재 준비 중인 기능입니다)
          </button>
        </div>
      </div>
    );
  }

  // === 3. 기본 화면: [가입 신청] 폼 ===
  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="text-center mb-8 border-b border-gray-700 pb-6">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">가입 신청</h2>
        <p className="text-gray-400">ByClan과 함께할 새로운 가족을 모집합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 sm:p-8 shadow-xl flex flex-col gap-6 font-sans">
        
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
          disabled={isSubmitting} 
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 mt-2"
        >
          {isSubmitting ? '신청서 전송 중...' : '신청서 제출하기'}
        </button>
      </form>
    </div>
  );
}
