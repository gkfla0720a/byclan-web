// 파일명: src/types/rows.ts

import type { Database } from './supabase';

// Supabase의 Tables 경로를 짧게 줄여서 사용하기 위한 유틸리티 타입
type Tables = Database['public']['Tables'];

// 🚨 하드코딩 제거 및 중복 선언(CommentRow 등) 완벽 정리!
export type ProfilesRow = Tables['profiles']['Row'];
export type ProfileOAuthRow = Tables['profile_oauth']['Row'];
export type ProfileMetaRow = Tables['profile_meta']['Row'];
export type LadderRankingsRow = Tables['ladder_rankings']['Row'];
export type LadderQueueRow = Tables['ladder_queue']['Row'];
export type LadderRecordRow = Tables['ladder_record']['Row'];
export type LadderMatchSetRow = Tables['ladder_match_sets']['Row'];
export type LadderSettlementRow = Tables['ladder_settlement']['Row'];
export type ApplicationRow = Tables['applications']['Row'];
export type ClanPointLogRow = Tables['clanpoint_logs']['Row']; // PointLogRow 통합
export type MatchBetRow = Tables['match_bets']['Row'];
export type PostsRow = Tables['posts']['Row'];
export type PostVotesRow = Tables['post_votes']['Row'];
export type CommentsRow = Tables['comments']['Row']; // CommentRow 통합
export type NoticePostsRow = Tables['notice_posts']['Row'];
export type AdminPostsRow = Tables['admin_posts']['Row'];
export type NotificationsRow = Tables['notifications']['Row'];
export type DeveloperSettingsRow = Tables['developer_settings']['Row']; // DevSettingRow 통합
export type MmrLogRow = Tables['mmr_logs']['Row'];

// DB 뷰(View) 타입도 깔끔하게 매핑해 줍니다.
export type VProfilesRow = Database['public']['Views']['v_profiles']['Row'];
export type VManualActivityReviewRow = Database['public']['Views']['v_manual_activity_review']['Row'];
