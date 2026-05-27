// 파일명: src/types/primitives.ts

export type UUID = string;
export type ISODateString = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const USER_ROLES = {
  BANNED: 'banned',
  GUEST: 'guest',
  APPLICANT: 'applicant',
  GHOST: 'ghost',
  ROOKIE: 'rookie',
  MEMBER: 'member',
  VETERAN: 'veteran',
  ADMIN: 'admin',
  MASTER: 'master',
  DEVELOPER: 'developer',
} as const;

export const USER_ROLE_LIST = Object.values(USER_ROLES);
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const RACE_CODES = ['Terran', 'Zerg', 'Protoss', 'Random'] as const;
export type RaceCode = (typeof RACE_CODES)[number];

export const APPLICATION_STATUSES = ['대기중', '합격', '불합격'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const LADDER_MATCH_STATUSES = ['모집중', '제안중', '진행중', '완료', '거절됨'] as const;
export type LadderMatchStatus = (typeof LADDER_MATCH_STATUSES)[number];

export const MATCH_SET_STATUSES = ['엔트리제출중', '진행중', '완료'] as const;
export type MatchSetStatus = (typeof MATCH_SET_STATUSES)[number];

export const WINNING_SIDES = ['team_a', 'team_b', '무승부'] as const;
export type WinningSide = (typeof WINNING_SIDES)[number];

export interface TestDataFlags {
  is_test_data?: boolean | null;
  is_test_data_active?: boolean | null;
}
