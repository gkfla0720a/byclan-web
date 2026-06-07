// 파일명: src/types/models.ts

import type {
  ProfilesRow,
  ProfileOAuthRow,
  ProfileMetaRow,
  LadderRankingsRow,
  LadderQueueRow,
  LadderRecordRow,
  LadderMatchSetRow,
  ApplicationRow,
  ClanPointLogRow,
  MatchBetRow,
  PostsRow,
  CommentsRow,
  NoticePostsRow,
  AdminPostsRow,
  NotificationsRow,
} from './rows';
import type { RaceCode, UserRole, UUID } from './primitives';

// Omit을 활용하여 중복되는 user_id를 제거하고 깔끔하게 병합
export interface AuthProfile extends ProfilesRow,
  Omit<ProfileOAuthRow, 'user_id'>,
  Partial<Omit<LadderRankingsRow, 'user_id' | 'by_id' | 'id'>>,
  Partial<Omit<LadderQueueRow, 'user_id' | 'id'>>,
  Partial<Omit<ProfileMetaRow, 'user_id' | 'id'>> {
  [key: string]: unknown;
}

export interface MetaData {
  user_id: string;
  by_id: string | null;
  account_id: string | null;
  clan_point: number | null;
  created_at: string;
  intro: string | null;
  is_active: boolean | null;
  race: string | null;
  role: string | null;
  rookie_since: string | null;
  personal_mmr: number | null;
  total_mmr: number | null;
  is_streamer: string | null;
  streamer_platform: string | null;
  streamer_url: string | null;
  is_test_account: boolean;
  is_test_account_active: boolean;
  ladder_rankings: string | null;
  profile_meta: string | null;
}


// 🚨 ProfileSummary: 런타임 계산의 안전성을 위한 핵심 모델
export interface ProfileSummary {
  user_id: string;
  by_id: string | null;
  role: UserRole | string | null;
  race?: RaceCode | string | null;

  // 🚨 합의안 반영: total_mmr은 무조건 존재해야 하는 number 타입! (옵셔널 ? 및 null 제거)
  total_mmr: number | null;
  personal_mmr?: number | null;
  team_mmr?: number | null;

  clan_point?: number | null;
  is_streamer?: boolean | null;
}

export interface ApplicationListItem extends ApplicationRow {
  applicant?: ProfileSummary | null;
  tester?: ProfileSummary | null;
}

export interface MemberListItem extends ProfilesRow {
  pending_notifications?: number | null;
  active_match_id?: string | null;
}

export interface LadderBoardItem {
  id: string; // 랭킹 row id
  user_id: string;
  rank: number | null;
  personal_mmr: number | null;
  wins: number | null;
  losses: number | null;
  win_rate: number | null;
  profile?: ProfileSummary | null;
}

export interface LadderMatchCard extends LadderMatchSetRow {
  host?: ProfileSummary | null;
  team_a_profiles?: ProfileSummary[];
  team_b_profiles?: ProfileSummary[];
  set_count?: number | null;
  bet_count?: number | null;
}

export interface LadderMatchDetail extends LadderMatchCard {
  sets: LadderRecordRow[];
  bets: MatchBetRow[];
}

export interface CommunityPostListItem extends PostsRow {
  author?: ProfileSummary | null;
}

export interface NoticeListItem extends NoticePostsRow {
  author?: ProfileSummary | null;
}

export interface AdminPostListItem extends AdminPostsRow {
  author?: ProfileSummary | null;
}

export interface NotificationListItem extends NotificationsRow {
  user?: ProfileSummary | null;
}

// 중복되던 PointLogListItem을 통합
export interface PointLogListItem extends ClanPointLogRow {
  user?: ProfileSummary | null;
}

export interface AdminDashboardSnapshot {
  pendingApplicationCount: number | null;
  unreadNotificationCount: number | null;
  activeMatchCount: number | null;
  rookieReviewDueCount: number | null;
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

// 🚨 중복된 CommentRow 대신 CommentsRow 사용
export interface JoinedComment extends CommentsRow {
  profiles: { by_id: string | null; role: string | null } | null;
}

// 🚨 중복된 PointLogRow 대신 ClanPointLogRow 사용
export interface JoinedPointLog extends ClanPointLogRow {
  profiles: { by_id: string | null; role: string | null } | null;
}
