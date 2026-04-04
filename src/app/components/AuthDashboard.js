'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { ErrorMessage, SkeletonLoader } from './UIStates';

// Discord 연동 컴포넌트
function DiscordLinkPanel({ user, onLinked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    checkDiscordLink();
  }, [user]);

  const checkDiscordLink = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('discord_name, discord_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsLinked(!!data.discord_id);
    } catch (error) {
      console.error('Discord 연동 확인 실패:', error);
    }
  };

  const handleDiscordLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/discord-link`,
          scopes: 'identify guilds'
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          discord_name: null,
          discord_id: null
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsLinked(false);
      onLinked(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="text-2xl mr-2">🎮</span>
        Discord 연동
      </h3>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-4">
        {isLinked ? (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <div>
                  <div className="text-green-400 font-medium">Discord 연동됨</div>
                  <div className="text-gray-400 text-sm">클랜 채널 접근 가능</div>
                </div>
              </div>
              <button
                onClick={handleUnlinkDiscord}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? '처리 중...' : '연동 해제'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-xl">🔗</span>
                <div>
                  <div className="text-gray-300 font-medium">Discord 미연동</div>
                  <div className="text-gray-500 text-sm">연동 시 특별 혜택 제공</div>
                </div>
              </div>
              <button
                onClick={handleDiscordLink}
                disabled={loading}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? '연동 중...' : '연동하기'}
              </button>
            </div>
          </div>
        )}

        {/* Discord 연동 혜택 */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-yellow-500 font-medium mb-2">🎁 Discord 연동 혜택</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 클랜 Discord 채널 접근 권한</li>
            <li>• 역할 자동 동기화</li>
            <li>• 추가 포인트 500P 보너스</li>
            <li>• 특별 이모티콘 사용 권한</li>
            <li>• 긴급 공지 빠른 수신</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 프로필 설정 컴포넌트
function ProfileSetup({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    by_id: '',
    race: 'Terran',
    intro: ''
  });

  useEffect(() => {
    // 기본값 설정
    setFormData(prev => ({
      ...prev,
      by_id: `By_${user.email?.split('@')[0] || 'User'}`
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ByID: formData.by_id,
          race: formData.race,
          intro: formData.intro
        })
        .eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">⚙️ 프로필 설정</h3>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            클랜 ID
          </label>
          <input
            type="text"
            value={formData.by_id}
            onChange={(e) => setFormData(prev => ({ ...prev, by_id: e.target.value }))}
            placeholder="By_YourName"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            주력 종족
          </label>
          <select
            value={formData.race}
            onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="Terran">테란</option>
            <option value="Protoss">프로토스</option>
            <option value="Zerg">저그</option>
            <option value="Random">랜덤</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            자기소개
          </label>
          <textarea
            value={formData.intro}
            onChange={(e) => setFormData(prev => ({ ...prev, intro: e.target.value }))}
            placeholder="안녕하세요! 같이 즐겁게 게임해요!"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 resize-none"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
    </div>
  );
}

// 통합 대시보드 컴포넌트
export default function AuthDashboard({ user, onSetupComplete }) {
  const [currentStep, setCurrentStep] = useState('profile'); // 'profile' or 'discord'

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white italic tracking-tighter">
          BYCLAN <span className="text-yellow-500">NET</span>
        </h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">
          환영합니다! 설정을 완료해주세요
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {currentStep === 'profile' && (
          <ProfileSetup 
            user={user} 
            onComplete={() => setCurrentStep('discord')}
          />
        )}
        
        {currentStep === 'discord' && (
          <DiscordLinkPanel 
            user={user} 
            onLinked={(linked) => {
              if (linked) {
                onSetupComplete();
              }
            }}
          />
        )}

        {/* 진행 상태 표시 */}
        <div className="flex justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${currentStep === 'profile' ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'discord' ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
        </div>
      </div>
    </div>
  );
}
