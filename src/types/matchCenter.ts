import type { RaceCode, UserRole } from '@/types';

export type TeamLetter = 'A' | 'B';
export type PerspectiveTeam = TeamLetter | 'C' | 'D';

export interface TeamPlayerEntry {
  id: string;
  by_id: string;
  race: RaceCode | '';
}

export interface BetOdds {
  total_a: number;
  total_b: number;
  count_a: number;
  count_b: number;
  odds_a: number;
  odds_b: number;
}

export type ManagementRole = Extract<UserRole, 'admin' | 'master' | 'developer'>;
