import type { TeamLetter } from '@/types/matchCenter';

export const BET_AMOUNTS = [500, 1000, 5000, 10000] as const;
export const BET_WINDOW_SECONDS = 300;

export const RACE_COMBOS = [
  { id: 'PPP', label: '프프프', races: ['Protoss', 'Protoss', 'Protoss'] },
  { id: 'PPT', label: '프프테', races: ['Protoss', 'Protoss', 'Terran'] },
  { id: 'PPZ', label: '프프저', races: ['Protoss', 'Protoss', 'Zerg'] },
  { id: 'PZT', label: '프저테', races: ['Protoss', 'Zerg', 'Terran'] },
  { id: 'RANDOM', label: '대포 (랜덤)', races: null },
] as const;

export const REQUIRED_RACE_COMBOS = ['PPP', 'PPT', 'PPZ', 'PZT', 'RANDOM'] as const;
export const RACE_ICONS = { Protoss: '프', Terran: '테', Zerg: '저' } as const;

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getComboIdFromRaceCards(cards: string[] | null | undefined): string | null {
  if (!Array.isArray(cards) || cards.length !== 3) return null;
  const map: Record<string, string> = { Protoss: 'P', Terran: 'T', Zerg: 'Z' };
  const code = cards.map((race) => map[race] || 'X').sort().join('');
  if (code === 'PTZ') return 'PZT';
  if ((REQUIRED_RACE_COMBOS as readonly string[]).includes(code)) return code;
  return null;
}

export function getRemainingRequiredCombos(matchSets: Array<{ combo_code?: string | null; race_cards?: string[] | null }> | null | undefined): string[] {
  const used = new Set<string>();
  (matchSets || []).forEach((setRow) => {
    const comboFromCode = typeof setRow?.combo_code === 'string' ? setRow.combo_code : null;
    const normalized = comboFromCode === 'PTZ' ? 'PZT' : comboFromCode;
    const combo = (REQUIRED_RACE_COMBOS as readonly string[]).includes(String(normalized))
      ? normalized
      : getComboIdFromRaceCards(setRow?.race_cards);
    if (combo) used.add(combo);
  });
  return REQUIRED_RACE_COMBOS.filter((combo) => !used.has(combo));
}

export function getRaceCards(comboId: string): string[] {
  const combo = RACE_COMBOS.find((c) => c.id === comboId);
  if (!combo || !combo.races) {
    const pool = ['Protoss', 'Terran', 'Zerg'];
    return [0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]);
  }
  return [...combo.races];
}

export function inferTeamLetter(userId: string, teamAIds: string[] = [], teamBIds: string[] = []): TeamLetter | null {
  if (teamAIds.includes(userId)) return 'A';
  if (teamBIds.includes(userId)) return 'B';
  return null;
}


export function isCompletedSetStatus(status: string | null | undefined): boolean {
  return status === 'completed' || status === '완료';
}

export function isActiveSetStatus(status: string | null | undefined): boolean {
  return !isCompletedSetStatus(status);
}

export function normalizeWinningTeam(value: string | null | undefined): TeamLetter | null {
  if (value === 'A' || value === 'team_a') return 'A';
  if (value === 'B' || value === 'team_b') return 'B';
  return null;
}


export function isPendingReviewSetStatus(status: string | null | undefined): boolean {
  return status === 'pending_review';
}

export function isCompletedMatchStatus(status: string | null | undefined): boolean {
  return status === 'completed' || status === '완료';
}

export function isInProgressMatchStatus(status: string | null | undefined): boolean {
  return status === 'in_progress' || status === '진행중';
}
