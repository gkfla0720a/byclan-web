/**
 * ProfileSidebar - 오른쪽 사이드바
 * - 래더 정보
 * - 클랜 포인트
 * - 로그아웃 버튼
 */

'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { LadderStats } from './LadderStats';

interface Profile {
  total_mmr?: number;
  wins?: number;
  losses?: number;
  clan_point?: number;
}

interface ProfileSidebarProps {
  profile: Profile;
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      localStorage.clear();
      router.push('/');
    }
  };

  return (
    <div className="space-y-6">
      {/* 래더 정보 카드 */}
      <LadderStats profile={profile} />

      {/* 포인트 카드 */}
      <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
        <h3 className="text-white font-black text-xs mb-4 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">
          Clan Assets
        </h3>
        <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">보유 클랜 포인트</p>
        <p className="text-2xl font-black text-emerald-400 flex items-center gap-2">
          💰 {(profile.clan_point ?? 0).toLocaleString()} <span className="text-xs text-gray-500 font-normal">CP</span>
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
  );
}
