// 파일명: src/utils/statusConstants.ts

import type { LadderMatchStatus, MatchSetStatus, ApplicationStatus } from '@/types';

// Record를 사용하여 키와 값을 타입스크립트가 강력하게 통제합니다.
export const MATCH_STATUS: Record<string, LadderMatchStatus> = {
  OPEN:        '모집중', // DB 스키마 기준 실제 들어가는 값으로 매칭하는 것을 권장
  PROPOSED:    '제안중',
  IN_PROGRESS: '진행중',
  COMPLETED:   '완료',
  REJECTED:    '거절됨',
};

// 만약 DB에는 영어(in_progress)로 들어가고 UI는 한글(진행중)이라면 
// 아래와 같이 매핑 딕셔너리로 사용하는 현재 방식이 아주 좋습니다.
export const MATCH_STATUS_LABEL: Record<string, string> = {
  open:        '모집중',
  proposed:    '제안중',
  in_progress: '진행중',
  completed:   '완료',
  rejected:    '거절됨',
};

export const SET_STATUS_LABEL: Record<string, string> = {
  entry_pending: '엔트리제출중',
  in_progress:   '진행중',
  completed:     '완료',
};

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  passed:  '합격',
  failed:  '불합격',
};
