// 파일명: src/app/utils/matchmaking.js
import { getPlayerMmr } from './profiles';

// 매치 유형 정의: 각 유형별 최소 인원, 팀당 인원, 래더 여부, 경기 형식 등을 명확히 정의합니다.
export const MATCH_TYPES = {
  '3v3': { label: '3대3', minPlayers: 6, perTeam: 3, isLadder: true, format: 'BO5 (3선승)' },
  '4v4': { label: '4대4', minPlayers: 8, perTeam: 4, isLadder: true, format: 'BO5 (3선승)' },
  '5v5': { label: '5대5', minPlayers: 10, perTeam: 5, isLadder: true, format: 'BO7 (4선승)', warning: true },
  '1v1': { label: '1대1', minPlayers: 2, perTeam: 1, isLadder: false, format: '일반게임' },
  '2v2': { label: '2대2', minPlayers: 4, perTeam: 2, isLadder: false, format: '일반게임' },
};

// 팀 빌딩 함수: 플레이어 목록, 팀당 인원 수, 정렬 옵션을 받아서 팀을 구성하는 함수
export function buildTeams(players, perTeam, sortOption) {
  if (players.length < perTeam * 2) return null;
  const pool = [...players].slice(0, perTeam * 2);

  if (sortOption === 'balance') {
    let bestDiff = Infinity;
    let bestTeamA = [];
    let bestTeamB = [];

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