// 간단한 메모리 기반 캐시 구현입니다. TTL(Time To Live)을 설정하여
// 일정 시간(30초)이 지난 캐시 항목은 자동으로 무효화됩니다.
const CACHE_TTL_MS = 30_000;
// Map을 사용하여 캐시 데이터를 저장합니다. 키는 문자열, 값은 { data, fetchedAt } 객체입니다.
const _store = new Map();
// 캐시에서 데이터를 가져오는 함수입니다. 키를 입력받아 해당 키에 대한 캐시 항목을 반환합니다.
export function getCached(key) {
  const entry = _store.get(key);
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    _store.delete(key);
    return null;
  }
  return entry.data;
}
// 캐시에 데이터를 저장하는 함수입니다. 키와 데이터를 입력받아 캐시에 저장합니다.
// 저장 시 현재 시간을 함께 기록하여 TTL을 관리합니다.
export function setCached(key, data) {
  _store.set(key, { data, fetchedAt: Date.now() });
}
// 캐시 항목을 수동으로 무효화하는 함수입니다. 키를 입력받아 해당 키에 대한 캐시 항목을 삭제합니다.
export function invalidateCache(key) {
  _store.delete(key);
}
