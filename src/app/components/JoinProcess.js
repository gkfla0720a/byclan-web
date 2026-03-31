'use client';

import React, { useState } from 'react';

export default function JoinProcess() {
  const [formData, setFormData] = useState({ btag: '', race: 'Terran', tier: '', intro: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('가입 신청이 완료되었습니다! (현재는 UI 테스트 모드입니다)');
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="text-center mb-8 border-b border-gray-700 pb-6">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">가입 신청</h2>
        <p className="text-gray-400">ByClan과 함께할 새로운 가족을 모집합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div>
          <label className="block text-gray-300 font-bold mb-2">배틀태그 (Battle Tag)</label>
          <input type="text" placeholder="예: Slayer#1234" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500" value={formData.btag} onChange={(e) => setFormData({...formData, btag: e.target.value})} />
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">주종족</label>
          <select className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500" value={formData.race} onChange={(e) => setFormData({...formData, race: e.target.value})}>
            <option value="Terran">테란 (Terran)</option>
            <option value="Protoss">프로토스 (Protoss)</option>
            <option value="Zerg">저그 (Zerg)</option>
            <option value="Random">랜덤 (Random)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">현재 티어 / 점수</label>
          <input type="text" placeholder="예: 래더 S / 2100점" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500" value={formData.tier} onChange={(e) => setFormData({...formData, tier: e.target.value})} />
        </div>

        <div>
          <label className="block text-gray-300 font-bold mb-2">간단한 자기소개 및 각오</label>
          <textarea placeholder="길드원들에게 인사말을 남겨주세요!" rows="4" required className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-yellow-500 resize-none" value={formData.intro} onChange={(e) => setFormData({...formData, intro: e.target.value})}></textarea>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold text-lg py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
          신청서 제출하기
        </button>
      </form>
    </div>
  );
}
