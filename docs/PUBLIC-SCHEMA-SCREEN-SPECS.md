# Public Schema Screen Specs

public 스키마 테이블별로 목록 화면, 상세 화면, 편집 화면에서 어떤 필드를 우선 사용해야 하는지 정리한 문서입니다.

## profiles

- 용도: 서비스 사용자 기준 엔티티
- 주요 관계: 대부분의 public 테이블이 참조
- 목록 화면 핵심 컬럼:
  - `by_id`
  - `role`
  - `race`
  - `clan_point`
  - `ladder_mmr`
  - `wins`, `losses`
  - `is_streamer`
  - `rookie_since`
  - `created_at`
- 상세 화면 섹션:
  - 기본 정보: `by_id`, `discord_id`, `google_email`, `google_name`
  - 게임 정보: `race`, `ladder_mmr`, `wins`, `losses`, `is_in_queue`, `vote_to_start`
  - 운영 정보: `role`, `clan_point`, `rookie_since`, `is_test_account`, `is_test_account_active`
  - 스트리머 정보: `is_streamer`, `streamer_platform`, `streamer_url`
  - 인증 정보: `auth_provider`, `google_sub`
- 편집 액션:
  - 역할 변경
  - 포인트 조정
  - 스트리머 설정
  - 수습 시작/종료
- 파생 표시값:
  - 승률 = `wins / (wins + losses)`
  - 래더 티어 = `ladder_mmr` 기준 계산

## applications

- 용도: 가입 신청 및 심사
- 주요 관계:
  - `user_id -> auth.users.id`
  - `tester_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `discord_name`
  - `btag`
  - `race`
  - `tier`
  - `status`
  - `tester_id`
  - `is_streamer`
  - `created_at`
- 상세 화면 섹션:
  - 신청자 정보: `discord_name`, `btag`, `phone`, `race`, `tier`
  - 자기소개: `intro`
  - 심사 상태: `status`, `tester_id`, `test_result`
  - 스트리머 여부: `is_streamer`, `streamer_platform`, `streamer_url`
- 편집 액션:
  - 담당자 지정
  - 합격 처리
  - 불합격 처리
  - 피드백 기록
- 프론트 보완 필요:
  - `reviewed_at`, `reviewed_by`가 없어 처리 이력 표현이 약함

## ladders

- 용도: 래더 보드용 스냅샷
- 주요 관계: `user_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `rank`
  - `nickname`
  - `race`
  - `ladder_mmr`
  - `win`
  - `lose`
  - `win_rate`
- 상세 화면:
  - 현재 구조상 단독 상세 화면보다 프로필 요약 카드로 병합하는 편이 적절
- 편집 액션:
  - 직접 수정 최소화
  - 운영자 보정 필요 시 별도 액션 패널에서만 허용

## ladder_matches

- 용도: 경기 본체
- 주요 관계:
  - `host_id -> profiles.id`
  - `match_sets.match_id <- ladder_matches.id`
  - `match_bets.match_id <- ladder_matches.id`
- 목록 화면 핵심 컬럼:
  - `status`
  - `match_type`
  - `host_id`
  - `team_a_ids`, `team_b_ids`
  - `score_a`, `score_b`
  - `winning_team`
  - `betting_closed_at`
  - `created_at`
- 상세 화면 섹션:
  - 경기 헤더: 상태, 타입, 맵, 생성자, 생성 시각
  - 팀 정보: `team_a_ids`, `team_b_ids`, `team_a_races`, `team_b_races`
  - 점수 정보: `score_a`, `score_b`, `winning_team`
  - 운영 정보: `current_race_picker`, `betting_closed_at`
  - 세트 타임라인: `match_sets`
  - 베팅 현황: `match_bets`
- 편집 액션:
  - 경기 상태 변경
  - 팀 보정
  - 점수 수정
  - 베팅 마감 처리
- 프론트 보완 필요:
  - 참여자 배열을 profile summary로 변환하는 adapter 필수

## match_sets

- 용도: 경기 세트 단위 상세 기록
- 주요 관계: `match_id -> ladder_matches.id`
- 목록 화면 핵심 컬럼:
  - `set_number`
  - `race_type`
  - `status`
  - `winner_team`
  - `team_a_ready`, `team_b_ready`
  - `team_a_withdraw_req`, `team_b_withdraw_req`
- 상세 화면 섹션:
  - 세트 메타: 번호, 종족 규칙, 상태
  - 엔트리: `team_a_entry`, `team_b_entry`
  - 카드/휴식: `race_cards`, `team_a_rest_ids`, `team_b_rest_ids`
  - 준비/기권 상태: ready, withdraw
- 편집 액션:
  - 세트 상태 변경
  - 엔트리 수정
  - 승자 결정
- 프론트 보완 필요:
  - JSONB shape를 통일한 normalizer 필요

## match_bets

- 용도: 경기 베팅 레코드
- 주요 관계:
  - `match_id -> ladder_matches.id`
  - `user_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `user_id`
  - `team_choice`
  - `bet_amount`
  - `odds`
  - `created_at`
- 상세 화면 섹션:
  - 베팅자 정보
  - 선택 팀과 배당
  - 지급 예상값
- 편집 액션:
  - 일반적으로 읽기 전용
  - 관리자용 취소/무효 처리 여지 고려

## posts

- 용도: 일반 커뮤니티 게시글
- 주요 관계: `user_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `category`
  - `title`
  - `author_name`
  - `views`
  - `created_at`
- 상세 화면 섹션:
  - 제목/본문
  - 작성자 정보
  - 카테고리
  - 조회수
- 편집 액션:
  - 글 작성
  - 글 수정
  - 글 삭제
- 프론트 보완 필요:
  - 댓글 테이블이 없으므로 글 상세는 단순 읽기 중심

## notice_posts

- 용도: 공지사항
- 주요 관계: `author_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `title`
  - `author_id`
  - `created_at`
- 상세 화면 섹션:
  - 제목
  - 본문
  - 작성자
  - 작성일
- 편집 액션:
  - 공지 등록
  - 공지 수정
  - 공지 삭제

## admin_posts

- 용도: 운영진 전용 게시판
- 주요 관계: `author_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `title`
  - `author_id`
  - `created_at`
- 상세 화면 섹션:
  - 제목
  - 본문
  - 작성자 역할
  - 작성일
- 편집 액션:
  - 운영 메모 작성
  - 내부 기록 열람

## notifications

- 용도: 사용자 알림함
- 주요 관계: `user_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `title`
  - `message`
  - `is_read`
  - `link_to`
  - `created_at`
- 상세 화면 섹션:
  - 제목/내용
  - 이동 링크
  - 읽음 상태
  - 발송 시각
- 편집 액션:
  - 읽음 처리
  - 링크 이동
  - 관리자 수동 발송
- 프론트 보완 필요:
  - `type`, `metadata`가 없어서 카드 타입 분기가 어려움

## point_logs

- 용도: 포인트 증감 이력
- 주요 관계: `user_id -> profiles.id`
- 목록 화면 핵심 컬럼:
  - `user_id`
  - `amount`
  - `reason`
  - `created_at`
- 상세 화면 섹션:
  - 대상 유저
  - 증감 값
  - 사유
  - 시각
- 편집 액션:
  - 신규 포인트 조정 레코드 생성
- 프론트 보완 필요:
  - 잔액이나 출처를 알 수 있는 컬럼이 없어 관리자 감사 화면이 약함

## system_settings

- 용도: 운영 플래그 저장
- 주요 관계: 없음
- 목록 화면 핵심 컬럼:
  - `key`
  - `value_bool`
  - `description`
  - `updated_at`
- 상세 화면 섹션:
  - 키
  - 현재 값
  - 설명
  - 최근 변경 시각
- 편집 액션:
  - 불리언 토글 변경
- 프론트 보완 필요:
  - 현재는 boolean 전용이라 숫자/문자열/JSON 설정을 담기 어렵습니다.

## 공통 UI 규칙

- `is_test_data`, `is_test_data_active`는 운영자 화면에서만 표시하고 일반 화면에서는 숨김
- nullable FK는 항상 `[미지정]` 또는 `[삭제된 사용자]` 같은 fallback label 준비
- `profiles` 조인은 목록 화면에서 `id`, `by_id`, `role`, `race` 정도로 최소화
- 모든 관리자 목록은 상태 필터, 역할 필터, 날짜 정렬을 기본 탑재
