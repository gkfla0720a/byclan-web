'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [newNickname, setNewNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setNewNickname(data.nickname || '');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!newNickname.startsWith('By_')) {
      alert('닉네임은 반드시 By_ 형식으로 시작해야 합니다. (예: By_Slayer)');
      return;
    }

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: newNickname })
        .eq('id', profile.id);

      if (error) throw error;
      alert('프로필이 성공적으로 수정되었습니다.');
      window.location.reload(); // 헤더 등의 닉네임 갱신을 위해 새로고침
    } catch (error) {
      alert('수정 실패: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-mono">LOADING PROFILE...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-fade-in-down">
      <h2 className="text-3xl font-black text-white mb-8 border-b border-gray-700 pb-4">내 프로필 설정</h2>
      
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl space-y-8">
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-3">내 직급</label>
          <span className="px-4 py-2 bg-gray-900 border border-yellow-700/50 text-yellow-500 rounded-lg font-black uppercase tracking-widest text-sm">
            {profile.role || 'GUEST'}
          </span>
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-bold mb-3">클랜 닉네임 설정</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="By_닉네임"
              className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-700 focus:border-yellow-500 focus:outline-none text-white font-bold"
            />
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-6 py-4 bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-black rounded-xl transition-all hover:scale-105 disabled:opacity-50"
            >
              저장
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">※ ByClan 정식 활동을 위해 닉네임을 By_ 형식으로 변경해 주세요.</p>
        </div>
      </div>
    </div>
  );
}
