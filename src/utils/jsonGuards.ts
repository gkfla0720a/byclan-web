import type { JsonValue, MatchSetEntry } from '@/types';

export function isObjectJson(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isMatchSetEntry(value: JsonValue | null | undefined): value is MatchSetEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return 'playerId' in value || 'playerName' in value || 'race' in value || 'ready' in value;
}
