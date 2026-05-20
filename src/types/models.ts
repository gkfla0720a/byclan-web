import type {
  AdminPostRow,
  ApplicationRow,
  LadderMatchRow,
  LadderRow,
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

export interface AuthProfile extends ProfileRow,
  Omit<ProfileOAuthRow, 'user_id'>,
  Partial<Omit<LadderRankingsRow, 'user_id' | 'by_id'>>,
  Partial<Omit<LadderQueueRow, 'user_id'>>,
  Partial<Omit<ProfileMetaRow, 'user_id'>> {
  [key: string]: unknown;
}

export interface ProfileSummary {
  id: UUID;
  by_id: string | null;
  role: UserRole | null;
  race?: RaceCode | null;
  ladder_mmr?: number | null;
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

export interface LadderBoardItem extends LadderRow {
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

// 실무에서 자주 쓰는 표준 응답 타입
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
