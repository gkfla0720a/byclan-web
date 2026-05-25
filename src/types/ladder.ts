export interface LadderQueuePreviewRow {
  user_id: string;
  is_in_queue: boolean;
  profiles: {
    by_id: string;
    race: string | null;
    clan_point: number | null;
  };
}

export interface LadderRankingPreviewRow {
  user_id: string | null;
  total_mmr: number | null;
  personal_mmr: number | null;
  team_mmr: number | null;
  profiles: {
    by_id: string;
    race: string | null;
  };
}

export interface RankingProfileMeta {
  is_test_account: boolean | null;
  is_test_account_active: boolean | null;
}

export interface RankingRow {
  user_id: string;
  personal_mmr: number | null;
  team_mmr: number | null;
  total_mmr: number | null;
  wins: number | null;
  losses: number | null;
  recent_total_delta: number | null;
  race_combo_stats: Record<string, { wins?: number; losses?: number }> | null;
  favorite_race: string | null;
  profiles: {
    by_id: string;
    role: string | null;
    is_active: boolean | null;
    profile_meta: RankingProfileMeta | RankingProfileMeta[] | null;
  };
}

export interface LadderPreviewPlayer {
  id: string;
  name: string;
  tier: string;
  pts: number;
  race: string;
  isInQueue: boolean;
}

export interface RankingBoardPlayer {
  id: string;
  by_id: string;
  race: string | null;
  personal_mmr: number | null;
  team_mmr: number | null;
  total_mmr: number | null;
  wins: number | null;
  losses: number | null;
  recent_total_delta: number | null;
  race_combo_stats: Record<string, { wins?: number; losses?: number }> | null;
  is_test_account: boolean;
}
