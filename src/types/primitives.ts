// 파일명: src/types/primitives.ts

// UUID는 일반적으로 문자열로 표현됩니다. 필요에 따라 더 구체적인 형식 검증을 추가할 수 있습니다.
export type UUID = string;

// ISO 8601 형식의 날짜 문자열 (예: "2024-06-01T12:00:00Z").
export type ISODateString = string;

// JSON에서 허용되는 원시 타입들
export type JsonPrimitive = string | number | boolean | null;

// JsonValue는 JSON에서 허용되는 모든 값의 타입을 나타냅니다. 원시값, 배열, 객체를 모두 포함합니다.
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// 사용자 역할 정의
export const USER_ROLES = {
  BANNED: 'banned',
  GUEST: 'guest',
  GHOST: 'ghost',
  APPLICANT: 'applicant',
  ROOKIE: 'rookie',
  MEMBER: 'member',
  VETERAN: 'veteran',
  ADMIN: 'admin',
  MASTER: 'master',
  DEVELOPER: 'developer',
} as const;

export const USER_ROLE_LIST = Object.values(USER_ROLES);
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// 종족 코드 정의
export const RACE_CODES = ['Terran', 'Zerg', 'Protoss', 'Random'] as const;
export type RaceCode = (typeof RACE_CODES)[number];

// 지원 상태 정의
export const APPLICATION_STATUSES = ['대기중', '합격', '불합격'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// 래더 매치 상태 정의
export const LADDER_MATCH_STATUSES = ['모집중', '제안중', '진행중', '완료', '거절됨'] as const;
export type LadderMatchStatus = (typeof LADDER_MATCH_STATUSES)[number];

// 매치 세트 상태 정의
export const MATCH_SET_STATUSES = ['엔트리제출중', '진행중', '완료'] as const;
export type MatchSetStatus = (typeof MATCH_SET_STATUSES)[number];

export const WINNING_SIDES = ['team_a', 'team_b', '무승부'] as const;
export type WinningSide = (typeof WINNING_SIDES)[number];

export interface TestDataFlags {
  is_test_data?: boolean | null;
  is_test_data_active?: boolean | null;
}
