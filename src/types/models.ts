// 파일명: src/types/models.ts

import type {
  AdminPostRow,
  ApplicationRow,
  LadderMatchRow,
  MatchBetRow,
  MatchSetRow,
  NoticePostRow,
  NotificationRow,
  PointLogRow,
  ProfileMetaRow,
  ProfileOAuthRow,
  ProfileRow,
  LadderQueueRow,
  LadderRankingsRow,
  PostRow,
} from './rows';
import type { RaceCode, UserRole, UUID } from './primitives';

// Omit을 활용하여 중복되는 user_id를 제거하고 깔끔하게 병합
export interface AuthProfile extends ProfileRow,
  Omit<ProfileOAuthRow, 'user_id'>,
  Partial<Omit<LadderRankingsRow, 'user_id' | 'by_id' | 'id'>>,
  Partial<Omit<LadderQueueRow, 'user_id' | 'id'>>,
  Partial<Omit<ProfileMetaRow, 'user_id' | 'id'>> {
  [key: string]: unknown;
}

// Supabase는 문자열을 기본적으로 string | null로 추론하므로, 
// UI에서 쓸 때는 우리가 만든 리터럴 타입(UserRole, RaceCode)으로 강제 변환/보장하기 위한 요약 모델
export interface ProfileSummary {
  id: UUID;
  by_id: string;
  role: UserRole | string | null;
  race?: RaceCode | string | null;
  total_mmr?: number | null;
  personal_mmr?: number | null;
  team_mmr?: number | null;
  clan_point?: number | null;
  is_streamer?: boolean | null;
}

export interface ApplicationListItem extends ApplicationRow {
  applicant?: ProfileSummary | null;
  tester?: ProfileSummary | null;
}

export interface MemberListItem extends ProfileRow {
  pending_notifications?: number;
  active_match_id?: UUID | null;
}

// 래더 랭킹 UI에 그릴 데이터 모델 (기존 LadderRow 역할 대체)
export interface LadderBoardItem {
  id: string; // 랭킹 row id
  user_id: UUID;
  rank: number | null;
  personal_mmr: number | null;
  wins: number | null;
  losses: number | null;
  win_rate: number | null;
  profile?: ProfileSummary | null;
}

export interface LadderMatchCard extends LadderMatchRow {
  host?: ProfileSummary | null;
  team_a_profiles?: ProfileSummary[];
  team_b_profiles?: ProfileSummary[];
  set_count?: number;
  bet_count?: number;
}

export interface LadderMatchDetail extends LadderMatchCard {
  sets: MatchSetRow[];
  bets: MatchBetRow[];
}

export interface CommunityPostListItem extends PostRow {
  author?: ProfileSummary | null;
}

export interface NoticeListItem extends NoticePostRow {
  author?: ProfileSummary | null;
}

export interface AdminPostListItem extends AdminPostRow {
  author?: ProfileSummary | null;
}

export interface NotificationListItem extends NotificationRow {
  user?: ProfileSummary | null;
}

export interface PointLogListItem extends PointLogRow {
  user?: ProfileSummary | null;
}

export interface AdminDashboardSnapshot {
  pendingApplicationCount: number;
  unreadNotificationCount: number;
  activeMatchCount: number;
  rookieReviewDueCount: number;
  latestAdminPosts: AdminPostListItem[];
}

export type AdminSectionKey =
  | 'dashboard'
  | 'applications'
  | 'members'
  | 'matches'
  | 'content'
  | 'notifications'
  | 'settings';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
