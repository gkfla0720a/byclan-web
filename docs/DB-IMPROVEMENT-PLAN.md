# DB Improvement Plan (Linkage + Sparse Data)

라이브 DB 진단을 기반으로, "유저 기록/매치 연결 약함"과 "데이터 미충전" 문제를 완화하는 단계별 제안입니다.

## 0) 진단 요약 (2026-04-12)

- `ladders.user_id` 누락: 5 / 15
- `match_bets`: 0건
- `point_logs`: 0건
- `notice_posts`: 0건
- `ladder_matches.team_a_ids/team_b_ids`의 고아 참조: 0건
- `profiles -> auth.users` 불일치: 0건
- FK 존재 대비 FK 컬럼 인덱스가 부족

핵심 문제는 무결성 파손보다는 "연결 강도"와 "운영/조회에 필요한 보조 컬럼 부재"입니다.

## 1) 1차 적용 (비파괴, 즉시 권장)

목표: 연결 안정성과 조회 성능 확보

- FK 컬럼 인덱스 추가
  - `applications(user_id, tester_id)`
  - `ladders(user_id)`
  - `ladder_matches(host_id)`
  - `match_sets(match_id)`
  - `match_bets(match_id, user_id)`
  - `posts(user_id)`
  - `notice_posts(author_id)`
  - `admin_posts(author_id)`
  - `notifications(user_id, is_read, created_at)`
  - `point_logs(user_id, created_at)`

- `profiles.by_id` 유니크 인덱스 추가 (NULL 제외)
  - 사용자 식별 라우팅 안정화

- 역할/상태 값 체크 제약 추가
  - `profiles.role`
  - `applications.status`
  - `ladder_matches.status`

## 2) 2차 적용 (연결 강화 컬럼)

목표: 프론트/관리자 화면에서 이력 추적 가능하게 확장

- `applications`
  - `reviewed_at`, `reviewed_by`, `review_note_summary`
- `notifications`
  - `type`, `metadata`, `read_at`
- `point_logs`
  - `source_type`, `source_id`, `balance_after`
- `ladder_matches`
  - `finalized_at`

## 3) 데이터 미충전 대응

목표: 화면 empty-state를 운영 가능한 상태로 유지

- `system_settings`에 시드 키 추가
  - `feature_ladder_enabled`
  - `feature_betting_enabled`
  - `feature_applications_open`
  - `feature_notice_enabled`

- 점진적 백필 규칙
  - `ladders.user_id`는 가능하면 `profiles.by_id` 기반 매핑 백필
  - 매핑 불가 행은 별도 리포트로 남기고 수동 정리

## 4) 프론트/관리자 구현 규칙

- 목록 화면은 항상 nullable-safe
  - 미연결 유저는 `[연결 안됨]` 라벨로 표기
- 매치/세트 화면은 어댑터 계층에서 강제 정규화
  - 배열 + JSONB를 화면 모델로 변환 후 렌더링
- 운영 액션 후 즉시 재조회
  - optimistic 업데이트보다 정확성 우선

## 5) 적용 파일

- 실행용 제안 SQL: `DB-LINKAGE-HARDENING-PROPOSAL.sql`

이 스크립트는 가능한 `IF NOT EXISTS`/조건부 블록을 사용한 비파괴 제안입니다.
