/**
 * @file ProfileSidebar.js
 *
 * @역할
 *   홈 화면 왼쪽에 표시되는 프로필 사이드바 컴포넌트입니다.
 *   로그인한 활성 클랜원이면 본인 프로필 카드를, 비로그인·비회원이면
 *   로그인/가입 안내 카드를 보여줍니다.
 *
 * @주요기능
 *   - 로그인 + 활성 클랜원: 본인의 MMR, 티어, 승률, 주종, 클랜 포인트 표시
 *   - 비로그인 / 비활성 회원: 로그인 또는 가입 안내 표시
 *   - 티어 색상(TIER_COLORS), 종족 한국어 레이블(RACE_LABELS) 매핑 제공
 *   - 프로필 카드 클릭 시 프로필 페이지로 이동
 *
 * @관련컴포넌트
 *   - useNavigate (../hooks/useNavigate): 페이지 이동 훅
 *
 * @사용방법
 *   <ProfileSidebar profile={profile} user={user} />
 *   - profile: 현재 로그인 유저의 프로필 객체 (없으면 null)
 *   - user: Supabase auth 유저 객체 (없으면 null)
 */
'use client';

import React from 'react';
import { useNavigate } from '../hooks/useNavigate';

/** 티어별 텍스트 색상 클래스 매핑 (Tailwind CSS 클래스 사용) */
const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Bronze: 'text-orange-700',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
};

/** 종족 영문 키를 한국어 레이블로 변환하는 매핑 객체 */
const RACE_LABELS = {
  Terran: '테란',
  Protoss: '프로토스',
  Zerg: '저그',
  Random: '랜덤',
};

/**
 * MMR(래더 포인트) 수치를 받아 해당 티어 이름을 반환합니다.
 * @param {number} mmr - 래더 MMR 포인트
 * @returns {string} 티어 이름 (예: 'Gold', 'Platinum' 등)
 */
function getTier(mmr) {
  if (mmr >= 2400) return 'Challenger';
  if (mmr >= 2200) return 'Master';
  if (mmr >= 1900) return 'Diamond';
  if (mmr >= 1600) return 'Platinum';
  if (mmr >= 1350) return 'Gold';
  if (mmr >= 1100) return 'Silver';
  return 'Bronze';
}

/**
 * 승수와 패수를 받아 승률 문자열을 반환합니다.
 * 전적이 없으면 '-'를 반환합니다.
 * @param {number|undefined} wins - 승리 횟수
 * @param {number|undefined} losses - 패배 횟수
 * @returns {string} 승률 문자열 (예: '67%') 또는 '-'
 */
function getWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  if (total === 0) return '-';
  return `${Math.round(((wins || 0) / total) * 100)}%`;
}

/**
 * 홈 좌측 프로필 사이드바 컴포넌트
 *
 * 로그인한 활성 클랜원이면 본인 카드를, 그렇지 않으면 로그인/가입 안내를 표시합니다.
 *
 * @param {{ profile: object|null, user: object|null }} props
 * @param {object|null} props.profile - 현재 로그인 유저의 프로필 (없으면 null)
 * @param {object|null} props.user - Supabase auth 유저 객체 (없으면 null)
 * @returns {JSX.Element} 프로필 사이드바 UI
 */
export default function ProfileSidebar({ profile, user }) {
  /** 페이지 이동 함수 (훅에서 가져온 navigate 함수) */
  const navigateTo = useNavigate();

  /**
   * 현재 프로필이 활성 클랜원인지 여부.
   * 활성 역할 목록에 포함된 경우에만 true가 됩니다.
   * (applicant·guest 등 비활성 역할이면 false)
   */
  const isActiveMember =
    profile && ['member', 'elite', 'admin', 'master', 'developer', 'rookie'].includes(profile.role);

  // 로그인은 되었지만 by_id/전적/주종/포인트가 비어 있는 경우도 빈 프로필 카드로 취급합니다.
  const hasProfileData = Boolean(
    profile?.by_id ||
    profile?.race ||
    profile?.clan_point !== undefined ||
    profile?.wins !== undefined ||
    profile?.losses !== undefined ||
    profile?.clan_point !== undefined
  );

  if (!user || !profile || !isActiveMember || !hasProfileData) {
    // 방문자 / 비로그인 / 프로필 미완성 상태 공통 플레이스홀더
    return (
      <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-3">
        <div className="cyber-card rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-gray-800">
            <div className="w-12 h-12 rounded-full bg-gray-900/70 border border-gray-700 flex items-center justify-center text-xl">👤</div>
            <span className="font-black text-sm text-gray-400 truncate max-w-full">기록 없음</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">MMR</span>
              <span className="font-black text-gray-500 text-sm">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">티어</span>
              <span className="font-semibold text-gray-500">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">승률</span>
              <span className="font-semibold text-gray-500">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">주종</span>
              <span className="font-semibold text-gray-500">-</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-800 pt-2">
              <span className="text-gray-500">전적</span>
              <span className="text-gray-500">-</span>
            </div>
          </div>

          {!user ? (
            <button
              onClick={() => navigateTo('로그인')}
              className="mt-1 w-full py-2 rounded-lg text-xs font-bold btn-neon"
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

          <p className="pt-1 text-center text-[10px] text-gray-600">로그인 후 프로필 정보가 표시됩니다</p>
        </div>
      </aside>
    );
  }

  const tier = getTier(profile.clan_point || 1000);
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
            {profile.by_id || 'By_????'}
          </span>
        </div>

        {/* 스탯 */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">MMR</span>
            <span className="font-black text-yellow-400 text-sm" style={{ textShadow: '0 0 6px rgba(245,158,11,0.5)' }}>
              {profile.clan_point ?? 1000}점
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
      {profile.clan_point !== undefined && (
        <div className="cyber-card rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-0.5">클랜 포인트 (CP)</div>
          <div className="font-black text-purple-400 text-lg" style={{ textShadow: '0 0 8px rgba(168,85,247,0.4)' }}>
            {(profile.clan_point || 0).toLocaleString()} CP
          </div>
        </div>
      )}
    </aside>
  );
}
