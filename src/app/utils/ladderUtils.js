// 파일명: src/utils/ladderUtils.js

export const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Master: 'text-purple-400', 
  Diamond: 'text-blue-400', 
  Platinum: 'text-cyan-400',
  Gold: 'text-yellow-400', 
  Silver: 'text-gray-400', 
  Bronze: 'text-orange-700',
};

export function getTier(pts) {
  if (pts >= 2400) return 'Challenger';
  if (pts >= 2200) return 'Master';
  if (pts >= 1900) return 'Diamond';
  if (pts >= 1600) return 'Platinum';
  if (pts >= 1350) return 'Gold';
  if (pts >= 1100) return 'Silver';
  return 'Bronze';
}

export function getRaceIcon(race) {
  const icons = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return icons[race] || '?';
}

export function getPlayerMmr(player) {
  return player.total_mmr; 
}

// 팀 빌딩 함수: 플레이어 목록, 팀당 인원 수, 정렬 옵션을 받아서 팀을 구성하는 함수
function buildTeams(players, perTeam, sortOption) {
  if (players.length < perTeam * 2) return null;
  const pool = [...players].slice(0, perTeam * 2);

  if (sortOption === 'balance') {
    let bestDiff = Infinity;
    let bestTeamA = [];
    let bestTeamB = [];

    // 조합 구하기 재귀 함수
    function getCombinations(arr, selectNumber) {
      const results = [];
      if (selectNumber === 1) return arr.map((value) => [value]);
      arr.forEach((fixed, index, origin) => {
        const rest = origin.slice(index + 1);
        const combinations = getCombinations(rest, selectNumber - 1);
        const attached = combinations.map((combination) => [fixed, ...combination]);
        results.push(...attached);
      });
      return results;
    }

    const allCombinations = getCombinations(pool, perTeam);

    for (const teamA of allCombinations) {
      const teamB = pool.filter(p => !teamA.some(a => a.id === p.id));
      const avgA = teamA.reduce((s, p) => s + getPlayerMmr(p), 0) / perTeam;
      const avgB = teamB.reduce((s, p) => s + getPlayerMmr(p), 0) / perTeam;
      const diff = Math.abs(avgA - avgB);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestTeamA = teamA;
        bestTeamB = teamB;
      }
    }
    return { teamA: bestTeamA, teamB: bestTeamB };
  }

  if (sortOption === 'top') {
    const sorted = [...pool].sort((a, b) => getPlayerMmr(b) - getPlayerMmr(a));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
  if (sortOption === 'bottom') {
    const sorted = [...pool].sort((a, b) => getPlayerMmr(a) - getPlayerMmr(b));
    return { teamA: sorted.slice(0, perTeam), teamB: sorted.slice(perTeam) };
  }
}
