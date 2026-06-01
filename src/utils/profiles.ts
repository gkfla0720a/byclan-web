// 파일명: src/utils/profiles.ts

// 프로필 관련 유틸리티 함수들을 모아둔 파일입니다.
// 래더 점수 계산, 티어 결정, 종족 아이콘 반환 등의 기능을 제공합니다.

export type Tier = 'Challenger' | 'Master' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
export type Race = 'Terran' | 'Protoss' | 'Zerg' | 'Random';
export type RaceIcon = '테' | '프' | '저' | '랜' | '?'; // Fallback 값 포함

export const TIER_COLORS: Record<Tier, string> = {
  Challenger: 'text-rose-400',
  Master: 'text-purple-400',
  Diamond: 'text-blue-400',
  Platinum: 'text-cyan-400',
  Gold: 'text-yellow-400',
  Silver: 'text-gray-400',
  Bronze: 'text-orange-700',
};

// 티어 계산 함수: 래더 점수에 따라 티어를 반환합니다.
export function getTier(pts: number): Tier {
  if (pts >= 2400) return 'Challenger';
  if (pts >= 2200) return 'Master';
  if (pts >= 1900) return 'Diamond';
  if (pts >= 1600) return 'Platinum';
  if (pts >= 1350) return 'Gold';
  if (pts >= 1100) return 'Silver';
  return 'Bronze'; // 모든 코드 경로가 값을 반환하도록 보장
}

// 종족 아이콘 반환 함수: 종족 이름을 받아서 해당하는 아이콘을 반환합니다.
export function getRaceIcon(race: Race): RaceIcon {
  const icons: Record<Race, RaceIcon> = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return icons[race] ?? '?'; // Nullish Coalescing Operator 사용 (undefined 또는 null인 경우에만 '?')
}

interface Player { // `total_mmr`은 rookie등급부터는 필수이며 number 타입입니다.
  total_mmr: number | null;
}

export function getPlayerMmr(player: Player): number | null {
  return player.total_mmr; // total_mmr이 필수로 존재하므로 직접 접근
}