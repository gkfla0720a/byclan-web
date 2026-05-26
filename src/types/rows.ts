// 파일명: src/types/rows.ts

import type { Database } from './supabase';

// Supabase의 Tables 경로를 짧게 줄여서 사용하기 위한 유틸리티 타입
type Tables = Database['public']['Tables'];

// 🚨 하드코딩 제거! DB 스키마와 1:1로 완벽하게 연결됩니다.
export type ProfilesRow = Tables['profiles']['Row'];
export type ProfileOAuthRow = Tables['profile_oauth']['Row'];
export type ProfileMetaRow = Tables['profile_meta']['Row'];

export type LadderRankingsRow = Tables['ladder_rankings']['Row'];
export type LadderQueueRow = Tables['ladder_queue']['Row'];
export type LadderRecordRow = Tables['ladder_record']['Row']; // 매치 기록
export type LadderMatchSetRow = Tables['ladder_match_sets']['Row']; // 세부 세트
export type LadderSettlementRow = Tables['ladder_settlement']['Row']; // 결과 정산

export type ApplicationRow = Tables['applications']['Row'];
export type PointLogRow = Tables['clanpoint_logs']['Row'];
export type MatchBetRow = Tables['match_bets']['Row'];

export type PostsRow = Tables['posts']['Row'];
export type PostVotesRow = Tables['post_votes']['Row'];
export type CommentsRow = Tables['comments']['Row'];
export type NoticePostsRow = Tables['notice_posts']['Row'];
export type AdminPostsRow = Tables['admin_posts']['Row'];
export type NotificationsRow = Tables['notifications']['Row'];

export type DeveloperSettingsRow = Tables['developer_settings']['Row'];

// DB 뷰(View) 타입도 깔끔하게 매핑해 줍니다.
export type VProfilesRow = Database['public']['Views']['v_profiles']['Row'];
export type VManualActivityReviewRow = Database['public']['Views']['v_manual_activity_review']['Row'];

// ※ Note: 기존의 LadderRow(rank, win, lose 합쳐진 형태)는
// 실제 테이블이 아니라 UI 조합형이므로 models.ts로 이동하는 것이 맞습니다.
