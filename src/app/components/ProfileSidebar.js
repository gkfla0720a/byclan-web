'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestAccounts } from '@/app/utils/testData';

const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Bronze: 'text-orange-700',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
};

const RACE_LABELS = {
  Terran: '테란',
  Protoss: '프로토스',
  Zerg: '저그',
  Random: '랜덤',
};

function getTier(points) {
  if (points >= 2400) return 'Challenger';
  if (points >= 2200) return 'Master';
  if (points >= 1900) return 'Diamond';
  if (points >= 1600) return 'Platinum';
  if (points >= 1350) return 'Gold';
  if (points >= 1100) return 'Silver';
  return 'Bronze';
}

function getWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  if (total === 0) return '-';
  return `${Math.round(((wins || 0) / total) * 100)}%`;
}

// 홈 좌측 프로필 사이드바
export default function ProfileSidebar({ profile, user, navigateTo }) {
  const [spotlightProfile, setSpotlightProfile] = useState(null);

  useEffect(() => {
    const loadSpotlightProfile = async () => {
      if (!isSupabaseConfigured) {
        setSpotlightProfile(null);
        return;
      }

      try {
        const primaryResult = await filterVisibleTestAccounts(
          supabase
            .from('profiles')
            .select('id, ByID, discord_name, role, race, ladder_points, points, wins, losses')
            .in('role', ['associate', 'elite', 'admin', 'master', 'developer', 'rookie'])
            .order('ladder_points', { ascending: false })
            .limit(1)
        );

        if (primaryResult.error) {
          const message = `${primaryResult.error.message || ''} ${primaryResult.error.details || ''}`.toLowerCase();
          if (primaryResult.error.code === '42703' || message.includes('does not exist')) {
            const fallbackResult = await filterVisibleTestAccounts(
              supabase
                .from('profiles')
                .select('id, ByID, discord_name, role, race, ladder_points, points')
                .in('role', ['associate', 'elite', 'admin', 'master', 'developer', 'rookie'])
                .order('ladder_points', { ascending: false })
                .limit(1)
            );

            if (fallbackResult.error) throw fallbackResult.error;
            setSpotlightProfile(fallbackResult.data?.[0] || null);
            return;
          }

          throw primaryResult.error;
        }

        setSpotlightProfile(primaryResult.data?.[0] || null);
      } catch (error) {
        console.error('사이드바 대표 멤버 로딩 실패:', error);
        setSpotlightProfile(null);
      }
    };

    loadSpotlightProfile();
  }, []);

  const isActiveMember =
    profile && ['associate', 'elite', 'admin', 'master', 'developer', 'rookie'].includes(profile.role);

  if (!user || !profile || !isActiveMember) {
    const previewProfile = spotlightProfile
      ? {
          byId: spotlightProfile.ByID || spotlightProfile.discord_name || 'ByClan Member',
          points: spotlightProfile.ladder_points ?? 1000,
          tier: getTier(spotlightProfile.ladder_points || 1000),
          winRate: spotlightProfile.wins !== undefined || spotlightProfile.losses !== undefined
            ? getWinRate(spotlightProfile.wins, spotlightProfile.losses)
            : '집계 중',
          race: RACE_LABELS[spotlightProfile.race] || spotlightProfile.race || '미등록',
        }
      : null;

    // 방문자 / 비로그인 빈 패널
    return (
      <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-3">
        <div className="cyber-card rounded-xl p-4 flex flex-col gap-3 text-center">
          <div className="text-3xl mb-1">👤</div>
          <p className="text-xs font-bold text-gray-400 leading-relaxed">
            {previewProfile
              ? '현재 활동 중인 클랜원 예시를 보여드리고 있습니다. 로그인 후에는 내 프로필 카드가 이 자리에 표시됩니다.'
              : '아직 프로필 정보가 충분하지 않습니다. 로그인 또는 가입 후 활동이 시작되면 이 영역이 자동으로 채워집니다.'}
          </p>
          <div className="space-y-1.5 mt-1">
            {[
              { label: 'ByID', placeholder: previewProfile?.byId || '프로필 준비 중' },
              { label: 'MMR', placeholder: previewProfile ? `${previewProfile.points}점` : '데이터 연결 대기' },
              { label: '티어', placeholder: previewProfile?.tier || '미정' },
              { label: '승률', placeholder: previewProfile?.winRate || '집계 전' },
              { label: '주종', placeholder: previewProfile?.race || '미등록' },
            ].map(({ label, placeholder }) => (
              <div key={label} className="flex justify-between text-xs border-b border-gray-800 pb-1">
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-500">{placeholder}</span>
              </div>
            ))}
          </div>
          {previewProfile && (
            <div className="text-[10px] text-gray-600 border-t border-gray-800 pt-2">
              최근 MMR 상위 멤버 기준 미리보기
            </div>
          )}
          {!user ? (
            <button
              onClick={() => navigateTo('로그인')}
              className="mt-2 w-full py-2 rounded-lg text-xs font-bold btn-neon"
            >
              로그인
            </button>
          ) : (
            <button
              onClick={() => navigateTo('가입안내')}
              className="mt-2 w-full py-2 rounded-lg text-xs font-bold btn-neon"
            >
              가입 안내
            </button>
          )}
        </div>
      </aside>
    );
  }

  const tier = getTier(profile.ladder_points || 1000);
  const tierColor = TIER_COLORS[tier] || 'text-gray-400';
  const winRate = getWinRate(profile.wins, profile.losses);
  const race = RACE_LABELS[profile.race] || profile.race || '—';

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-3">
      <div
        className="cyber-card rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-cyan-500/30 transition-all"
        onClick={() => navigateTo('프로필')}
        title="프로필로 이동"
      >
        {/* 아바타 / 유저 */}
        <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-gray-800">
          <div className="w-12 h-12 rounded-full bg-cyan-900/30 border border-cyan-700/30 flex items-center justify-center text-xl"
          aria-label={`종족: ${profile.race || '알 수 없음'}`}
        >
            {profile.race === 'Terran' ? '🔧' : profile.race === 'Protoss' ? '✨' : profile.race === 'Zerg' ? '🦠' : '🎮'}
          </div>
          <span className="font-black text-sm text-cyan-400 truncate max-w-full" style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
            {profile.ByID || 'By_????'}
          </span>
        </div>

        {/* 스탯 */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">MMR</span>
            <span className="font-black text-yellow-400 text-sm" style={{ textShadow: '0 0 6px rgba(245,158,11,0.5)' }}>
              {profile.ladder_points ?? 1000}점
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">티어</span>
            <span className={`font-bold ${tierColor}`}>{tier}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">승률</span>
            <span className="font-semibold text-gray-300">{winRate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">주종</span>
            <span className="font-semibold text-gray-300">{race}</span>
          </div>
          {(profile.wins !== undefined || profile.losses !== undefined) && (
            <div className="flex justify-between items-center border-t border-gray-800 pt-2">
              <span className="text-gray-500">전적</span>
              <span className="text-gray-300">
                <span className="text-green-400">{profile.wins ?? 0}W</span>
                {' '}
                <span className="text-red-400">{profile.losses ?? 0}L</span>
              </span>
            </div>
          )}
        </div>

        <div className="pt-1 text-center text-[10px] text-gray-600">클릭하여 프로필 보기</div>
      </div>

      {/* 클랜 포인트 */}
      {profile.points !== undefined && (
        <div className="cyber-card rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-0.5">클랜 포인트 (CP)</div>
          <div className="font-black text-purple-400 text-lg" style={{ textShadow: '0 0 8px rgba(168,85,247,0.4)' }}>
            {(profile.points || 0).toLocaleString()} CP
          </div>
        </div>
      )}
    </aside>
  );
}
