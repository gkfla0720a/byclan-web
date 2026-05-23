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
  | 'guest'
  | 'banned'
  | string;

export type RaceCode = 'Terran' | 'Zerg' | 'Protoss' | 'Random' | string;
export type ApplicationStatus = '대기중' | '합격' | '불합격' | string;
export type LadderMatchStatus = '모집중' | '제안중' | '진행중' | '완료' | '거절됨' | string;
export type MatchSetStatus = '엔트리제출중' | '진행중' | '완료' | string;
export type WinningSide = 'team_a' | 'team_b' | '무승부' | string;

export interface TestDataFlags {
  is_test_data?: boolean | null;
  is_test_data_active?: boolean | null;
}
