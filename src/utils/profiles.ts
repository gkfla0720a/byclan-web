// 파일명: src/utils/profiles.ts

// 프로필 관련 유틸리티 함수들을 모아둔 파일입니다.
// 래더 점수 계산, 티어 결정, 종족 아이콘 반환 등의 기능을 제공합니다.
export const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Master: 'text-purple-400', 
  Diamond: 'text-blue-400', 
  Platinum: 'text-cyan-400',
  Gold: 'text-yellow-400', 
  Silver: 'text-gray-400', 
  Bronze: 'text-orange-700',
};

// 티어 계산 함수: 래더 점수에 따라 티어를 반환합니다.
export function getTier(pts) {
  if (pts >= 2400) return 'Challenger';
  if (pts >= 2200) return 'Master';
  if (pts >= 1900) return 'Diamond';
  if (pts >= 1600) return 'Platinum';
  if (pts >= 1350) return 'Gold';
  if (pts >= 1100) return 'Silver';
  return 'Bronze';
}

// 종족 아이콘 반환 함수: 종족 이름을 받아서 해당하는 아이콘을 반환합니다.
export function getRaceIcon(race) {
  const icons = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return icons[race] || '?';
}

export function getPlayerMmr(player) {
  return player?.total_mmr || 1000; 
}