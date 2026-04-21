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

export interface ProfileRow extends TestDataFlags {
  // ── 필수 필드 (DB NOT NULL) ────────────────────────────
  id: UUID;                          // Supabase Auth UUID (PK)
  created_at: ISODateString;

  // ── 클랜 정보 ──────────────────────────────────────────
  by_id: string | null;              // 클랜 닉네임 (예: 'By_홍길동')
  role: UserRole | null;             // 클랜 역할
  clan_point: number | null;         // 클랜 포인트 (기본값 0)
  race: RaceCode | null;             // 주종족
  intro: string | null;              // 자기소개

  // ── 래더 ───────────────────────────────────────────────
  ladder_mmr: number | null;         // 래더 MMR (기본값 1000) — 단일 출처
  wins: number | null;               // 래더 누적 승리
  losses: number | null;             // 래더 누적 패배
  is_in_queue: boolean | null;       // 래더 대기열 상태
  vote_to_start: boolean | null;     // 래더 시작 투표
  queue_joined_at?: ISODateString | null; // 대기열 합류 시각

  // ── Discord 연동 ───────────────────────────────────────
  discord_id: string | null;         // Discord 고유 ID

  // ── 소셜 계정 연동 (마이그레이션으로 추가된 컬럼) ─────
  google_sub: string | null;
  google_email: string | null;
  google_name: string | null;
  google_avatar_url: string | null;
  auth_provider: string | null;

  // ── 스트리머 정보 ──────────────────────────────────────
  is_streamer: boolean | null;
  streamer_platform: string | null;
  streamer_url: string | null;

  // ── 시스템/운영 ────────────────────────────────────────
  last_login_at: ISODateString | null;
  last_daily_bonus_at: string | null;  // YYYY-MM-DD 형식
  last_discord_checkin_at: string | null; // YYYY-MM-DD 형식 (Discord 출첵 보상용)
  rookie_since: ISODateString | null;  // 신입 클랜원 등록일

  // ── 테스트 계정 플래그 ─────────────────────────────────
  is_test_account: boolean | null;
  is_test_account_active: boolean | null;
}

export interface AuthProfile extends ProfileRow {
  queue_joined_at?: ISODateString | null;
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
