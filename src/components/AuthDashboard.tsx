// 파일명: src/components/AuthDashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { extractAccountIdFromAuthUser } from '@/utils/accountId';
import type { User } from '@supabase/supabase-js';

// 🚨 타입 정의 (any 완벽 퇴출)
interface AuthDashboardProps {
  user: User;
  onSetupComplete: () => void;
}

interface StepProps {
  user: User;
  onComplete?: () => void;
  onLinked?: (linked: boolean) => void;
}

// ─── 1단계: 프로필 설정 컴포넌트 ───
function ProfileSetup({ user, onComplete }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ by_id: '', race: 'Terran', intro: '' });

  useEffect(() => {
    queueMicrotask(() => {
      // email 타입 불일치를 해결하기 위한 안전한 매핑
      const safeAuthUser = { ...user, email: user.email ?? null } as unknown as User;
      const accountId = extractAccountIdFromAuthUser(safeAuthUser, null);
      setFormData(prev => ({
        ...prev,
        by_id: `By_${accountId || user.email?.split('@')[0] || 'User'}`
      }));
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          by_id: formData.by_id,
          race: formData.race,
          intro: formData.intro
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      if (onComplete) onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">⚙️ 프로필 설정</h3>
      {error && <div className="text-red-400 text-sm mb-4 bg-red-900/30 p-3 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">클랜 ID</label>
          <input
            type="text" value={formData.by_id}
            onChange={(e) => setFormData(prev => ({ ...prev, by_id: e.target.value }))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" required
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">주력 종족</label>
          <select
            value={formData.race}
            onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="Terran">테란</option>
            <option value="Protoss">프로토스</option>
            <option value="Zerg">저그</option>
            <option value="Random">랜덤</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">자기소개</label>
          <textarea
            value={formData.intro}
            onChange={(e) => setFormData(prev => ({ ...prev, intro: e.target.value }))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white resize-none" rows={3}
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-400 disabled:opacity-50">
          {loading ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
    </div>
  );
}

// ─── 2단계: Discord 연동 컴포넌트 ───
function DiscordLinkPanel({ user, onLinked }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);

  const checkDiscordLink = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profile_oauth')
        .select('discord_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setIsLinked(!!data?.discord_id);
    } catch (err) {
      console.error('Discord 연동 확인 실패:', err);
    }
  }, [user]);

  useEffect(() => { queueMicrotask(() => { checkDiscordLink(); }); }, [checkDiscordLink]);

  const handleDiscordLink = async () => {
    setLoading(true); setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'identify guilds' }
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '연동 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    setLoading(true); setError(null);
    try {
      const { error: updateError } = await supabase.from('profile_oauth').update({ discord_id: null }).eq('user_id', user.id);
      if (updateError) throw updateError;
      setIsLinked(false);
      if (onLinked) onLinked(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '해제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center"><span className="mr-2">🎮</span> Discord 연동</h3>
      {error && <div className="text-red-400 text-sm mb-4 bg-red-900/30 p-3 rounded">{error}</div>}
      
      <div className="space-y-4">
        {isLinked ? (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 flex justify-between">
            <div className="text-green-400 font-medium">✅ Discord 연동됨</div>
            <button onClick={handleUnlinkDiscord} disabled={loading} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 disabled:opacity-50">
              {loading ? '처리 중...' : '연동 해제'}
            </button>
          </div>
        ) : (
          <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4 flex justify-between">
            <div className="text-gray-300 font-medium">🔗 Discord 미연동</div>
            <button onClick={handleDiscordLink} disabled={loading} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 disabled:opacity-50">
              {loading ? '연동 중...' : '연동하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 통합 대시보드 ───
export default function AuthDashboard({ user, onSetupComplete }: AuthDashboardProps) {
  const [currentStep, setCurrentStep] = useState<'profile' | 'discord'>('profile');

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white italic tracking-tighter">BYCLAN <span className="text-yellow-500">NET</span></h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">환영합니다! 설정을 완료해주세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {currentStep === 'profile' && <ProfileSetup user={user} onComplete={() => setCurrentStep('discord')} />}
        {currentStep === 'discord' && <DiscordLinkPanel user={user} onLinked={(linked) => { if (linked) onSetupComplete(); }} />}
      </div>
    </div>
  );
}