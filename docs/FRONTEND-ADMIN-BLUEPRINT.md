# ByClan Frontend/Admin Blueprint

라이브 DB의 public 스키마를 기준으로, 프론트엔드 화면 구조와 관리자 IA를 바로 구현 가능한 수준으로 정리한 문서입니다.

## 1. Core Domain

- 인증 기준 사용자: `auth.users`
- 서비스 기준 사용자: `public.profiles`
- 가입 심사: `applications`
- 래더 보드: `ladders`
- 경기 본체: `ladder_matches`
- 세트 상세: `match_sets`
- 베팅: `match_bets`
- 일반 게시판: `posts`
- 공지/운영 게시판: `notice_posts`, `admin_posts`
- 유저 알림: `notifications`
- 포인트 이력: `point_logs`
- 운영 플래그: `developer_settings`

핵심 해석은 다음과 같습니다.

- 대부분의 화면은 `profiles`를 중심으로 풀어야 합니다.
- 가입 신청은 `profiles`가 아닌 `auth.users` 단계에서도 존재할 수 있으므로 예외 흐름입니다.
- 매치 도메인은 완전 정규화가 아니라 배열과 JSONB를 섞은 운영 친화형 구조입니다.
- 따라서 프론트엔드는 DB row를 그대로 UI에 뿌리기보다, 화면 전용 view model로 한 번 정리하는 계층이 필요합니다.

## 2. Recommended Information Architecture

### 사용자 화면

- 홈

- 목적: 현재 내 상태, 공지, 래더 진입점, 최근 경기, 알림 요약 제공
- 핵심 데이터: `profiles`, `notice_posts`, `notifications`, `ladders`, `ladder_matches`
- 핵심 액션: 프로필 이동, 래더 진입, 최근 공지 열람

- 가입 / 전환

- 목적: 신규 신청서 작성, 신청 상태 확인, 기존 계정 이관 처리
- 핵심 데이터: `applications`, `profiles`
- 핵심 액션: 신청서 작성, 심사 상태 추적, 보완 요청 확인

- 멤버 디렉터리

- 목적: 클랜원 목록, 역할, 종족, 스트리머 정보 탐색
- 핵심 데이터: `profiles`
- 핵심 액션: 멤버 검색, 역할별 필터, 프로필 열람

- 래더 보드

- 목적: 순위, MMR, 전적, 종족 분포 확인
- 핵심 데이터: `ladders`, `profiles`
- 핵심 액션: 정렬, 내 순위 강조, 특정 유저 프로필 이동

- 매치 센터

- 목적: 현재 모집중/진행중 경기, 팀 현황, 세트 현황, 베팅 상태 표시
- 핵심 데이터: `ladder_matches`, `match_sets`, `match_bets`, `profiles`
- 핵심 액션: 경기 참가, 경기 관전, 베팅, 세트 상태 확인

- 경기 기록

- 목적: 종료 경기 히스토리와 세트 결과 열람
- 핵심 데이터: `ladder_matches`, `match_sets`, `profiles`
- 핵심 액션: 경기 상세 열기, 세트별 엔트리 확인

- 커뮤니티

- 목적: 일반 게시글 열람/작성
- 핵심 데이터: `posts`, `profiles`
- 핵심 액션: 카테고리 필터, 글쓰기, 조회수 기반 정렬

- 공지

- 목적: 운영 공지 열람
- 핵심 데이터: `notice_posts`, `profiles`
- 핵심 액션: 최신 공지 열람, 중요 공지 상단 노출

- 알림 센터

- 목적: 개인 알림함 관리
- 핵심 데이터: `notifications`
- 핵심 액션: 읽음 처리, 링크 이동, 전체 읽음

- 내 프로필

- 목적: 자기소개, 종족, 스트리머 정보, 인증 연동 상태 관리
- 핵심 데이터: `profiles`
- 핵심 액션: 프로필 편집, 연동 상태 확인, 전적/포인트 확인

### 관리자 화면

- 관리자 홈

- 목적: 운영 대시보드와 우선 처리 항목 집계
- 위젯 제안:
  - 대기 중 가입 신청 수
  - 수습 기간 종료 대상 수
  - 읽지 않은 운영 알림 수
  - 현재 진행중 경기 수
  - 최근 관리자 게시글
- 핵심 데이터: `applications`, `profiles`, `notifications`, `ladder_matches`, `admin_posts`

- 가입 심사 관리

- 목적: 신청서 접수부터 합격/불합격까지 처리
- 하위 화면:
  - 대기 신청서 목록
  - 신청서 상세/심사 패널
  - 완료된 심사 기록
- 핵심 데이터: `applications`, `profiles`, `notifications`

- 멤버 관리

- 목적: 역할 조정, 수습 관리, 제명, 마스터 위임
- 하위 화면:
  - 멤버 목록
  - 멤버 상세 사이드패널
  - 역할 변경/수습 승급 모달
  - 마스터 위임 재인증 플로우
- 핵심 데이터: `profiles`, `notifications`, `point_logs`

- 래더/경기 운영

- 목적: 현재 경기 통제, 세트 이상 상황 확인, 베팅 상태 관리
- 하위 화면:
  - 경기 모니터링 보드
  - 경기 상세
  - 세트 상세
  - 베팅 현황
- 핵심 데이터: `ladder_matches`, `match_sets`, `match_bets`, `profiles`

- 콘텐츠 운영

- 목적: 공지, 운영 게시판, 커뮤니티 컨텐츠 관리
- 하위 화면:
  - 공지 관리
  - 운영 게시판
  - 일반 게시글 관리
- 핵심 데이터: `notice_posts`, `admin_posts`, `posts`, `profiles`

- 알림/포인트 운영

- 목적: 유저 알림과 포인트 변경 이력 관리
- 하위 화면:
  - 알림 발송 이력 및 수동 발송
  - 포인트 로그 조회
- 핵심 데이터: `notifications`, `point_logs`, `profiles`

- 시스템 설정

- 목적: 운영 플래그 제어
- 하위 화면:
  - 기능 토글 목록
  - 변경 이력 설명 영역
- 핵심 데이터: `developer_settings`

## 3. Suggested Route Map

현재 구조를 크게 깨지 않고 확장하려면 다음 라우팅이 자연스럽습니다.

### 사용자 라우트

- `/`
- `/join`
- `/profile`
- `/notifications`
- `/members`
- `/ranking`
- `/matches`
- `/community`
- `/notice`

### 관리자 라우트

- `/admin`
- `/admin/applications`
- `/admin/guild`
- `/admin/matches`
- `/admin/content`
- `/admin/notifications`
- `/admin/settings`

## 4. Screen Composition Strategy

### A. DB row 그대로 쓰지 말고 view model을 두는 이유

- `ladder_matches.team_a_ids`, `team_b_ids`는 배열이라 바로 렌더링하면 매번 profile lookup이 필요합니다.
- `match_sets.team_a_entry`, `team_b_entry`는 JSONB라 화면마다 shape 보정이 필요합니다.
- `applications`는 신청자 정보와 심사자 정보가 분리되어 있어 joined view가 필요합니다.
- `profiles`는 실제 row와 앱 사용 타입이 다릅니다. 예: `queue_joined_at` 같은 앱 파생 필드.

권장 패턴:

- raw row 타입: DB에 최대한 맞춤
- normalized type: 화면 공통 변환 결과
- screen view type: 특정 페이지에 필요한 필드만 정제

## 5. Structural Gaps And Recommended Fixes

현재 구조는 운영에는 충분하지만, 관리자 화면을 본격적으로 키우려면 아래 보완이 유효합니다.

### 우선순위 높음

1. `applications`에 `reviewed_at`, `reviewed_by`, `review_note_summary` 추가

- 지금은 `status`, `tester_id`, `test_result`만으로도 동작하지만, 운영 이력 추적이 약합니다.

1. `notifications`에 `type`, `metadata`, `read_at` 추가

- 현재는 자유 텍스트 기반이라 알림 종류별 UI 분기와 집계가 어렵습니다.

1. `point_logs`에 `source_type`, `source_id`, `balance_after` 추가

- 포인트 증감의 출처 추적과 관리자 감사 로그 성능이 좋아집니다.

1. `developer_settings`에 `value_text`, `value_number`, `value_json` 중 하나 추가

- 현재는 boolean 전용이라 운영 설정 확장성이 낮습니다.

### 우선순위 중간

1. `ladder_matches` 참여자 배열을 장기적으로 `match_players` 테이블로 정규화

- 현재 구조는 빠르지만, 팀별 상태 관리와 감사 로그가 어려워집니다.

1. `match_sets` 엔트리 JSONB를 명시적 타입으로 고정

- 프론트에서 race card, ready state, withdraw 상태를 안정적으로 렌더링할 수 있습니다.

1. 주요 운영 테이블에 `updated_at` 추가

- 관리자 화면에서 최근 수정 여부 표시가 쉬워집니다.

## 6. Implementation Order

실제 구현은 다음 순서가 안전합니다.

1. 공통 타입과 변환 함수 정리
2. 관리자 홈 대시보드
3. 가입 심사 화면 고도화
4. 멤버 관리 화면 정리
5. 래더/매치 운영 모니터링 구축
6. 콘텐츠 운영 화면 정리
7. 시스템 설정 확장

## 7. Frontend Build Rules

- 모든 목록 화면은 검색, 역할/상태 필터, 정렬, empty state를 기본 제공
- 모든 상세 화면은 action panel과 audit context를 분리
- 운영 액션은 optimistic update보다 완료 후 재조회 우선
- 테스트 데이터 필터는 view model 계층에서 일관되게 적용
- DB의 nullable 필드는 UI에서 항상 fallback 라벨을 가져야 함
