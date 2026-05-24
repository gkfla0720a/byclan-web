// 파일명: src/types/json.ts

import type { JsonValue } from './primitives';

export interface ActivityLogMeta {
  source?: string;
  actorId?: string;
  targetId?: string;
  reason?: string;
  [key: string]: JsonValue | undefined;
}
