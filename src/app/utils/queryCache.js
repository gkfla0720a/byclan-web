const CACHE_TTL_MS = 30_000;

const _store = new Map();

export function getCached(key) {
  const entry = _store.get(key);
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    _store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data) {
  _store.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateCache(key) {
  _store.delete(key);
}
