/**
 * @file statusConstants.js
 * @역할 ByClan 도메인 상태값 영문 상수 정의
 *
 * DB의 status 컬럼 값은 모두 영문으로 통일합니다.
 * UI 표시용 한글 레이블은 이 파일의 *_LABEL 객체를 사용하세요.
 *
 * 사용 예:
 *   import { MATCH_STATUS, MATCH_STATUS_LABEL } from '@/app/utils/statusConstants';
 *   .eq('status', MATCH_STATUS.IN_PROGRESS)
 *   label = MATCH_STATUS_LABEL[match.status] ?? match.status
 */

// ── 매치 상태 ──────────────────────────────────────────────
export const MATCH_STATUS = {
  OPEN:        'open',
  PROPOSED:    'proposed',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  REJECTED:    'rejected',
};

export const MATCH_STATUS_LABEL = {
  open:        '모집중',
  proposed:    '제안중',
  in_progress: '진행중',
  completed:   '완료',
  rejected:    '거절됨',
};

// ── 세트 상태 ──────────────────────────────────────────────
export const SET_STATUS = {
  ENTRY_PENDING: 'entry_pending',
  IN_PROGRESS:   'in_progress',
  COMPLETED:     'completed',
};

export const SET_STATUS_LABEL = {
  entry_pending: '엔트리제출중',
  in_progress:   '진행중',
  completed:     '완료',
};

// ── 가입 신청 상태 ─────────────────────────────────────────
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  PASSED:  'passed',
  FAILED:  'failed',
};

export const APPLICATION_STATUS_LABEL = {
  pending: '대기중',
  passed:  '합격',
  failed:  '불합격',
};
