/**
 * LadderStats - 래더 전적 표시
 * - MMR 점수
 * - 티어
 * - 승/패 기록
 */

'use client';

interface Profile {
  total_mmr?: number;
  wins?: number;
  losses?: number;
}

interface LadderStatsProps {
  profile: Profile;
}

export function getTier(mmr?: number): string {
  if (!mmr) return 'Unranked';
  if (mmr >= 2400) return 'Challenger';
  if (mmr >= 2200) return 'Master';
  if (mmr >= 1900) return 'Diamond';
  if (mmr >= 1600) return 'Platinum';
  if (mmr >= 1350) return 'Gold';
  if (mmr >= 1100) return 'Silver';
  return 'Bronze';
}

export function LadderStats({ profile }: LadderStatsProps) {
  const totalMmr = profile.total_mmr;
  const ladderTier = getTier(totalMmr);
  const ladderWins = profile.wins ?? 0;
  const ladderLosses = profile.losses ?? 0;

  return (
    <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform duration-500">
        🏆
      </div>
      <h3 className="text-white font-black text-xs mb-6 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">
        Ladder Status
      </h3>

      {totalMmr === undefined || totalMmr === null ? (
        <div className="text-center py-8">
          <p className="text-gray-400 font-bold text-lg mb-2">Unranked</p>
          <p className="text-gray-500 text-sm">아직 래더 게임 기록이 없습니다.</p>
          <p className="text-gray-500 text-sm">첫 배치고사를 완료하고 점수를 획득해 보세요!</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Rating Points</p>
            <p className="text-4xl font-black text-cyan-400">
              {totalMmr} <span className="text-xs text-gray-500 font-normal">PTS</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Tier</p>
              <p className="text-white font-bold italic">{ladderTier}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">W / L</p>
              <p className="text-white font-bold">
                {ladderWins}승 {ladderLosses}패
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
