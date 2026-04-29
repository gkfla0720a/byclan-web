/**
 * 파일명: RankingBoard.js
 *
 * 역할:
 *   ByClan 래더 랭킹을 확장 보드 형태로 보여주는 컴포넌트입니다.
 *   profiles 테이블에서 점수/전적/조합 통계를 읽고,
 *   아직 실제 데이터가 없는 항목은 임시 샘플 값으로 보완해 표시합니다.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { isMarkedTestData } from '@/app/utils/testData';
import { getCached, setCached } from '@/app/utils/queryCache';

const CACHE_KEY = 'ranking_board_v2';

// 랭킹 보드에서 사용되는 티어 메타 정보입니다.
// 각 티어는 점수 범위, 레이블, 배지 문자, 색상 톤, 링 스타일을 정의합니다.
const TIER_META = [
  { key: 'challenger', label: '챌린저', min: 2400, badge: 'C', tone: 'from-amber-200 via-yellow-400 to-amber-600', ring: 'ring-amber-300/70' },
  { key: 'master', label: '마스터', min: 2200, badge: 'M', tone: 'from-rose-300 via-pink-500 to-rose-700', ring: 'ring-rose-400/60' },
  { key: 'diamond', label: '다이아', min: 1900, badge: 'D', tone: 'from-sky-200 via-cyan-400 to-sky-700', ring: 'ring-cyan-400/60' },
  { key: 'platinum', label: '플래티넘', min: 1600, badge: 'P', tone: 'from-emerald-200 via-teal-400 to-emerald-700', ring: 'ring-emerald-400/60' },
  { key: 'gold', label: '골드', min: 1350, badge: 'G', tone: 'from-yellow-200 via-yellow-400 to-orange-500', ring: 'ring-yellow-300/60' },
  { key: 'silver', label: '실버', min: 1100, badge: 'S', tone: 'from-slate-100 via-slate-300 to-slate-500', ring: 'ring-slate-300/60' },
  { key: 'bronze', label: '브론즈', min: -Infinity, badge: 'B', tone: 'from-orange-200 via-orange-500 to-amber-700', ring: 'ring-orange-400/60' },
];

// 조합 통계에서 사용할 키와 레이블 매핑입니다.
// COMBO_KEYS는 데이터에서 사용되는 키 목록이고
// COMBO_LABELS는 UI에 표시할 레이블 매핑입니다.
const COMBO_KEYS = ['PPP', 'PPT', 'PPZ', 'PZT', 'OTHER'];
const COMBO_LABELS = {
  PPP: 'PPP',
  PPT: 'PPT',
  PPZ: 'PPZ',
  PZT: 'PZT',
  OTHER: '기타종족',
};
// 플레이어의 주 종족을 레이블로 변환하기 위한 매핑입니다.
const MAIN_RACE_LABELS = {
  Protoss: '프로토스',
  Terran: '테란',
  Zerg: '저그',
  Random: '랜덤',
  미지정: '미지정',
};

// 점수에 해당하는 티어 메타 정보를 반환하는 함수입니다.
function getTierMeta(score) {
  return TIER_META.find((tier) => score >= tier.min) || TIER_META[TIER_META.length - 1];
}

// 플레이어의 주 종족을 레이블로 변환하는 함수입니다.
function getMainRaceLabel(race) {
  return MAIN_RACE_LABELS[race] || race || '미지정';
}

// 승률을 계산하여 포맷팅하는 함수입니다. 승수와 패수를 입력받아 승률을 백분율 문자열로 반환합니다.
function formatPercent(wins, losses) {
  const total = wins + losses;
  if (total <= 0) return '0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

// 조합 통계 데이터를 강제로 변환하는 함수입니다.
// 원본 데이터가 예상되는 구조가 아닐 경우 null을 반환합니다.
function coerceComboStats(rawStats) {
  if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) {
    return null;
  }

  const normalized = {};
  let foundValue = false;

  COMBO_KEYS.forEach((key) => {
    const value = rawStats[key];
    const wins = Number(value?.wins ?? 0);
    const losses = Number(value?.losses ?? 0);
    normalized[key] = { wins, losses };
    if (wins > 0 || losses > 0) {
      foundValue = true;
    }
  });

  return foundValue ? normalized : null;
}

// 플레이어 객체에서 조합 통계 데이터를 가져오는 함수입니다.
function getComboStats(player) {
  const stats = coerceComboStats(player.race_combo_stats);
  if (stats) return stats;
  return Object.fromEntries(COMBO_KEYS.map((key) => [key, { wins: 0, losses: 0 }]));
}

// 플레이어 객체에서 최근 점수 변동 데이터를 가져오는 함수입니다.
function getRecentDelta(player) {
  if (player.recent_total_delta !== null && player.recent_total_delta !== undefined) {
    return Number(player.recent_total_delta);
  }
  return 0;
}

// 최근 점수 변동 데이터를 포맷팅하는 함수입니다.
// 양수는 상승, 음수는 하락으로 표시하며, 변동이 없는 경우 '-'로 표시합니다.
function formatRecentDelta(delta) {
  if (!delta) {
    return { text: '-', tone: 'text-slate-500', arrow: '' };
  }
  if (delta > 0) {
    return { text: `+${delta}`, tone: 'text-emerald-400', arrow: '↑' };
  }
  return { text: `${delta}`, tone: 'text-rose-400', arrow: '↓' };
}

// 조합 통계 셀을 렌더링하는 컴포넌트입니다. stat 객체를 입력받아 승률과 전적을 표시합니다.
function ComboRateCell({ stat }) {
  return (
    <td className="px-3 py-4 text-center align-middle">
      <div className="text-sm font-semibold text-cyan-100">{formatPercent(stat.wins, stat.losses)}</div>
      <div className="mt-1 text-[11px] text-slate-500">{stat.wins}승 {stat.losses}패</div>
    </td>
  );
}

// 티어 뱃지를 렌더링하는 컴포넌트입니다.
function TierBadge({ score }) {
  const tier = getTierMeta(score);
  return (
    <div className={`relative h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${tier.tone} p-[1px] shadow-[0_0_20px_rgba(34,211,238,0.18)]`}>
      <div className={`flex h-full w-full items-center justify-center rounded-2xl bg-slate-950/90 text-sm font-black text-white ring-1 ${tier.ring}`}>
        {tier.badge}
      </div>
    </div>
  );
}

// 랭킹 보드 컴포넌트입니다. 랭킹 데이터를 불러와서 테이블 형태로 표시합니다. 검색 기능도 포함되어 있습니다.
export default function RankingBoard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      const cached = getCached(CACHE_KEY);
      if (cached) {
        setRankings(cached);
        setLoading(false);
        return;
      }

      try {
        const isTestViewer = typeof window !== 'undefined' &&
          window.localStorage.getItem('byclan_current_is_test_account') === 'true';

        let query = supabase
          .from('ladder_rankings')
          .select(`
            user_id, by_id, ladder_mmr, team_mmr, total_mmr,
            wins, losses, recent_total_delta, race_combo_stats, favorite_race,
            profiles!inner(role, is_test_account, is_test_account_active)
          `)
          .neq('profiles.role', 'visitor')
          .neq('profiles.role', 'applicant')
          .neq('profiles.role', 'expelled')
          .order('total_mmr', { ascending: false });

        if (isTestViewer) {
          query = query.eq('profiles.is_test_account', true).eq('profiles.is_test_account_active', true);
        } else {
          query = query.or('is_test_account.is.null,is_test_account.eq.false', { referencedTable: 'profiles' });
        }

        const { data: rawData, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        const data = (rawData || []).map(r => ({
          id: r.user_id,
          by_id: r.by_id,
          race: r.favorite_race,
          ladder_mmr: r.ladder_mmr,
          team_mmr: r.team_mmr,
          total_mmr: r.total_mmr,
          wins: r.wins,
          losses: r.losses,
          recent_total_delta: r.recent_total_delta,
          race_combo_stats: r.race_combo_stats,
          is_test_account: r.profiles?.is_test_account,
        }));
        if (data) setCached(CACHE_KEY, data);
        setRankings(data || []);
      } catch (err) {
        console.error('랭킹 로드 실패:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const filteredRankings = rankings.filter((player) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (player.by_id || '').toLowerCase().includes(query);
  });

  return (
    <div className="w-full mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-cyan-500/20 bg-slate-950/70 px-5 py-4 shadow-[0_0_30px_rgba(8,145,178,0.12)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[0.2em] text-cyan-300">RANKING</h2>
          <p className="mt-2 text-sm text-cyan-100/80">전체 랭킹 ({filteredRankings.length}명)</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="닉네임 검색"
          className="h-11 w-full rounded-xl border border-cyan-500/20 bg-slate-900/90 px-4 text-sm text-cyan-100 outline-none transition focus:border-cyan-400 sm:max-w-xs"
        />
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 shadow-[0_0_24px_rgba(6,182,212,0.12)]">
        <table className="w-full table-fixed text-left">
          <thead className="bg-cyan-950/30 text-[11px] uppercase tracking-[0.18em] text-cyan-300">
            <tr className="border-b border-cyan-500/20">
              <th className="px-2 py-4 text-center w-[6%]">순위</th>
              <th className="px-2 py-4 w-[20%]">플레이어</th>
              <th className="px-2 py-4 text-center w-[9%]">레더점수</th>
              <th className="px-2 py-4 text-center w-[8%]">최근 변동</th>
              <th className="px-2 py-4 text-center w-[7%]">승률</th>
              <th className="px-2 py-4 text-center w-[7%]">팀점수</th>
              <th className="px-2 py-4 text-center w-[8%]">총점수</th>
              <th className="px-2 py-4 text-center w-[6%]">PPP</th>
              <th className="px-2 py-4 text-center w-[6%]">PPT</th>
              <th className="px-2 py-4 text-center w-[6%]">PPZ</th>
              <th className="px-2 py-4 text-center w-[6%]">PZT</th>
              <th className="px-2 py-4 text-center w-[6%]">기타종족</th>
              <th className="px-2 py-4 text-center w-[6%]">주 종족</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" className="px-4 py-12 text-center text-cyan-500">랭킹 데이터를 불러오는 중입니다...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="13" className="px-4 py-12 text-center text-rose-400">랭킹 데이터를 불러오지 못했습니다.</td>
              </tr>
            ) : filteredRankings.length === 0 ? (
              <tr>
                <td colSpan="13" className="px-4 py-12 text-center text-slate-500">표시할 랭킹 데이터가 없습니다.</td>
              </tr>
            ) : (
              filteredRankings.map((player, index) => {
                const ladderScore = Number(player.ladder_mmr ?? 1500);
                const teamScore = Number(player.team_mmr ?? 0);
                const totalScore = Number(player.total_mmr ?? (ladderScore + teamScore));
                const wins = Number(player.wins ?? 0);
                const losses = Number(player.losses ?? 0);
                const totalGames = wins + losses;
                const winRate = totalGames > 0 ? `${((wins / totalGames) * 100).toFixed(1)}%` : '0.0%';
                const comboStats = getComboStats(player);
                const recent = formatRecentDelta(getRecentDelta(player));
                const tier = getTierMeta(totalScore);

                return (
                  <tr key={player.id} className="border-b border-cyan-900/30 text-sm text-slate-200 transition hover:bg-cyan-900/10">
                    <td className="px-3 py-4 text-center text-lg font-black text-slate-100">{index + 1}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <TierBadge score={totalScore} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-base font-bold text-white">{player.by_id || '[by_id 없음]'}</span>
                            {isMarkedTestData(player) && <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] text-amber-300">TEST</span>}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">{tier.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-lg font-black text-cyan-300">{ladderScore}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{totalGames}전 {wins}승 {losses}패</div>
                    </td>
                    <td className={`px-3 py-4 text-center text-base font-bold ${recent.tone}`}>
                      <div>{recent.arrow ? `${recent.arrow} ${recent.text}` : recent.text}</div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm font-semibold text-emerald-300">{winRate}</div>
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-semibold text-cyan-200">{teamScore}</td>
                    <td className="px-3 py-4 text-center text-base font-black text-cyan-100">{totalScore}</td>
                    {COMBO_KEYS.map((key) => (
                      <ComboRateCell key={key} stat={comboStats[key]} label={COMBO_LABELS[key]} />
                    ))}
                    <td className="px-3 py-4 text-center text-sm font-semibold text-amber-200">{getMainRaceLabel(player.race)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
