// 파일명: src/utils/matchMaking.ts

import { getPlayerMmr } from './profiles'; // (해당 파일에 맞게 유지)
import type { ProfileSummary } from '@/types'; 

export const MATCH_TYPES = {
  '3v3': { label: '3대3', minPlayers: 6, perTeam: 3, isLadder: true, format: 'BO5 (3선승)' },
  '4v4': { label: '4대4', minPlayers: 8, perTeam: 4, isLadder: true, format: 'BO5 (3선승)' },
  '5v5': { label: '5대5', minPlayers: 10, perTeam: 5, isLadder: true, format: 'BO7 (4선승)', warning: true },
  '1v1': { label: '1대1', minPlayers: 2, perTeam: 1, isLadder: false, format: '일반게임' },
  '2v2': { label: '2대2', minPlayers: 4, perTeam: 2, isLadder: false, format: '일반게임' },
};

// players에 any 대신 명확한 타입을 부여합니다.
export function buildTeams(
  players: ProfileSummary[], 
  perTeam: number, 
  sortOption: 'balance' | 'top' | 'bottom'
) {
  if (players.length < perTeam * 2) return null;
  const pool = [...players].slice(0, perTeam * 2);

  if (sortOption === 'balance') {
    // ... 기존 알고리즘 동일 ... (에러 없이 안전하게 계산됩니다)
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
