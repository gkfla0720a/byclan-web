export type UUID = string;
export type ISODateString = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type UserRole =
  | 'developer'
  | 'master'
  | 'admin'
  | 'elite'
  | 'member'
  | 'rookie'
  | 'applicant'
  | 'associate'
  | 'visitor'
  | 'guest'
  | 'expelled'
  | string;

export type RaceCode = 'Terran' | 'Zerg' | 'Protoss' | 'Random' | '미지정' | string;
export type ApplicationStatus = '대기중' | '합격' | '불합격' | string;
export type LadderMatchStatus = '모집중' | '제안중' | '진행중' | '완료' | '거절됨' | string;
export type MatchSetStatus = '엔트리제출중' | '진행중' | '완료' | string;
export type WinningSide = 'team_a' | 'team_b' | '무승부' | string;

export interface TestDataFlags {
  is_test_data?: boolean | null;
  is_test_data_active?: boolean | null;
}

// ── DB Row Types — 테이블별 ────────────────────────────────────────

/** profiles 테이블 — 핵심 신원 (8 컬럼) */
export interface ProfileRow {
  id: UUID;
  created_at: ISODateString;
  by_id: string | null;
  role: UserRole | null;
  clan_point: number | null;
  race: RaceCode | null;
  intro: string | null;
  rookie_since: ISODateString | null;
}

/** profile_oauth 테이블 — OAuth/소셜 인증 */
export interface ProfileOAuthRow {
  user_id: UUID;
  discord_id: string | null;
  google_sub: string | null;
  google_email: string | null;
  google_name: string | null;
  google_avatar_url: string | null;
  auth_provider: string | null;
}

/** ladder_rankings 테이블 — 래더 게임 통계 */
export interface LadderRankingsRow {
  user_id: UUID;
  by_id: string | null;
  ladder_mmr: number | null;
  team_mmr: number | null;
  total_mmr: number | null;
  wins: number | null;
  losses: number | null;
  win_rate: number | null;
  favorite_race: RaceCode | null;
  recent_total_delta: number | null;
  race_combo_stats: JsonValue | null;
  updated_at: ISODateString | null;
}

/** ladder_queue 테이블 — 대기열 상태 */
export interface LadderQueueRow {
  user_id: UUID;
  is_in_queue: boolean | null;
  vote_to_start: boolean | null;
  queue_joined_at: ISODateString | null;
}

/** profile_meta 테이블 — 활동/스트리머/테스트 플래그 */
export interface ProfileMetaRow {
  user_id: UUID;
  last_login_at: ISODateString | null;
  last_daily_bonus_at: string | null;
  last_discord_checkin_at: string | null;
  is_streamer: boolean | null;
  streamer_platform: string | null;
  streamer_url: string | null;
  is_test_account: boolean | null;
  is_test_account_active: boolean | null;
}

// ── 병합 타입 (v_profiles 뷰 대응) ────────────────────────────────

/** useAuth가 반환하는 in-memory 사용자 프로필 — 위성 테이블 필드 포함 */
export interface AuthProfile extends ProfileRow,
  Omit<ProfileOAuthRow, 'user_id'>,
  Partial<Omit<LadderRankingsRow, 'user_id' | 'by_id'>>,
  Partial<Omit<LadderQueueRow, 'user_id'>>,
  Partial<Omit<ProfileMetaRow, 'user_id'>> {
  [key: string]: unknown;
}

export interface ApplicationRow extends TestDataFlags {
  id: number;
  user_id: UUID | null;
  discord_name: string | null;
  btag: string | null;
  race: RaceCode | null;
  tier: string | null;
  intro: string | null;
  status: ApplicationStatus | null;
  created_at: ISODateString;
  phone: string | null;
  tester_id: UUID | null;
  test_result: string | null;
  is_streamer: boolean | null;
  streamer_platform: string | null;
  streamer_url: string | null;
}

export interface LadderRow extends TestDataFlags {
  id: number;
  rank: number | null;
  nickname: string | null;
  ladder_mmr: number | null;
  race: RaceCode | null;
  win: number | null;
  lose: number | null;
  win_rate: string | null;
  user_id: UUID | null;
}

export interface LadderMatchRow extends TestDataFlags {
  id: UUID;
  host_id: UUID | null;
  status: LadderMatchStatus | null;
  match_type: string | null;
  team_a_ids: UUID[] | null;
  team_b_ids: UUID[] | null;
  team_a_races: RaceCode[] | null;
  team_b_races: RaceCode[] | null;
  winning_team: WinningSide | null;
  map_name: string | null;
  created_at: ISODateString | null;
  score_a: number | null;
  score_b: number | null;
  betting_closed_at: ISODateString | null;
  current_race_picker: UUID | null;
}

export interface MatchBetRow {
  id: UUID;
  match_id: UUID | null;
  user_id: UUID | null;
  team_choice: WinningSide | null;
  bet_amount: number | null;
  odds: number | null;
  created_at: ISODateString | null;
}

export interface MatchSetEntry {
  playerId?: UUID | null;
  playerName?: string | null;
  race?: RaceCode | null;
  ready?: boolean | null;
  [key: string]: JsonValue | undefined;
}

export interface MatchSetRow {
  id: UUID;
  match_id: UUID | null;
  set_number: number | null;
  race_type: string | null;
  combo_code?: string | null;
  team_a_entry: MatchSetEntry | JsonValue | null;
  team_b_entry: MatchSetEntry | JsonValue | null;
  winner_team: WinningSide | null;
  status: MatchSetStatus | null;
  created_at: ISODateString | null;
  race_cards: string[] | null;
  team_a_ready: boolean | null;
  team_b_ready: boolean | null;
  team_a_rest_ids: UUID[] | null;
  team_b_rest_ids: UUID[] | null;
  team_a_withdraw_req: boolean | null;
  team_b_withdraw_req: boolean | null;
}

export interface PostRow extends TestDataFlags {
  id: number;
  user_id: UUID | null;
  author_name: string | null;
  category: string | null;
  title: string | null;
  content: string | null;
  views: number | null;
  created_at: ISODateString;
}

export interface NoticePostRow extends TestDataFlags {
  id: UUID;
  title: string;
  content: string;
  author_id: UUID | null;
  created_at: ISODateString | null;
}

export interface AdminPostRow extends TestDataFlags {
  id: UUID;
  title: string;
  content: string;
  author_id: UUID | null;
  created_at: ISODateString | null;
}

export interface NotificationRow extends TestDataFlags {
  id: UUID;
  user_id: UUID | null;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: ISODateString;
  link_to: string | null;
}

export interface PointLogRow {
  id: number;
  user_id: UUID | null;
  amount: number | null;
  reason: string | null;
  created_at: ISODateString;
}

export interface SystemSettingRow {
  key: string;
  value_bool: boolean | null;
  updated_at: ISODateString | null;
  description: string | null;
}

export interface ProfileSummary {
  id: UUID;
  by_id: string | null;
  role: UserRole | null;
  race?: RaceCode | null;
  ladder_mmr?: number | null;  // ladder_rankings 조인 시 포함
  clan_point?: number | null;
  is_streamer?: boolean | null; // profile_meta 조인 시 포함
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
