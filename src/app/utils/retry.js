/**
 * =====================================================================
 * 파일명: src/app/utils/retry.js
 * 역할  : 네트워크 오류나 서버 일시적 오류 발생 시 자동으로 요청을 재시도하는
 *         유틸리티 함수들을 제공합니다.
 *
 * ■ 주요 함수
 *   - isRetryableError(error) : 재시도 가능한 오류인지 판별
 *   - isRelationshipError(error): DB 관계(JOIN) 오류인지 판별
 *   - withRetry(fn, options)   : 함수를 최대 N번 재시도하는 래퍼
 *
 * ■ 사용 방법 (다른 파일에서 import)
 *   import { withRetry, isRetryableError } from '@/app/utils/retry';
 *
 *   // 예: Supabase 쿼리를 최대 3번 재시도
 *   const result = await withRetry(() =>
 *     supabase.from('profiles').select('*')
 *   );
 *
 * ■ 재시도 지연 시간 (지수 백오프 방식)
 *   1차 실패 → 1초 대기 → 2차 시도
 *   2차 실패 → 2초 대기 → 3차 시도
 *   3차 실패 → 오류 던지기(throw)
 * =====================================================================
 */

/**
 * isRetryableError(error)
 * - 주어진 오류가 "재시도할 가치가 있는 오류"인지 판별합니다.
 *
 * 재시도 가능한 경우 (true 반환):
 *   - HTTP 5xx 서버 오류 (일시적인 서버 문제)
 *   - 네트워크 연결 실패 ('failed to fetch', 'timeout' 등)
 *
 * 재시도 불가한 경우 (false 반환):
 *   - 401 Unauthorized (인증 오류 - 재시도해도 의미 없음)
 *   - 403 Forbidden (권한 오류 - 재시도해도 의미 없음)
 *   - PGRST301 (JWT 만료 - 토큰 갱신이 필요함)
 *
 * 매개변수:
 *   error: 발생한 오류 객체 (status, code, message 등을 포함)
 *
 * 반환값: 재시도 가능하면 true, 아니면 false
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (!error) return false;

  // 401 Unauthorized, 403 Forbidden – do not retry (auth/permission issues)
  const status = error?.status ?? error?.statusCode;
  if (status === 401 || status === 403) return false;

  // Supabase JWT-expired code – client must refresh token, not retry
  if (error?.code === 'PGRST301') return false;

  // 5xx server-side errors are transient – retry
  if (typeof status === 'number' && status >= 500) return true;

  // Network / fetch failures
  const msg = (error?.message ?? '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused')
  ) {
    return true;
  }

  return false;
}

/**
 * isRelationshipError(error)
 * - DB 테이블 간 관계(JOIN) 오류인지, 또는 존재하지 않는 컬럼 오류인지 판별합니다.
 * - 이 오류가 감지되면 문제가 되는 JOIN 없이 쿼리를 재시도하는 용도로 사용합니다.
 *
 * 감지하는 오류 코드:
 *   - PGRST200: PostgREST 관계 오류 (테이블 간 외래키 관계 없음)
 *   - 42703:    PostgreSQL 컬럼 없음 오류
 *
 * 매개변수:
 *   error: 발생한 오류 객체
 *
 * 반환값: 관계/컬럼 오류이면 true, 아니면 false
 *
 * Returns true when a PostgREST error is caused by a missing or undefined
 * foreign-key relationship (PGRST200) or a missing column (42703).
 * Use this to decide whether to retry a query without the problematic JOIN.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRelationshipError(error) {
  if (!error) return false;
  if (error?.code === 'PGRST200' || error?.code === '42703') return true;
  const msg = ((error?.message ?? '') + ' ' + (error?.details ?? '')).toLowerCase();
  return msg.includes('relationship') || msg.includes('does not exist');
}

/**
 * withRetry(fn, options)
 * - 비동기 함수 fn을 최대 maxAttempts번 재시도합니다.
 * - 실패 간격은 지수 백오프(exponential back-off)로 자동 증가합니다.
 *   예) baseDelay=1000ms: 1초 → 2초 → 4초 순서로 대기
 * - 재시도 불가능한 오류(401, 403 등)는 즉시 throw합니다.
 *
 * 매개변수:
 *   fn: 실행할 비동기 함수 (예: () => supabase.from('table').select('*'))
 *   options.maxAttempts: 최대 시도 횟수 (기본값: 3)
 *   options.baseDelay:   첫 번째 재시도 전 대기 시간(ms) (기본값: 1000)
 *   options.onRetry:     재시도 시 호출되는 콜백 함수(attempt, delay, error)
 *
 * 반환값: fn이 성공하면 결과값, 모두 실패하면 마지막 오류를 throw
 *
 * 사용 예시:
 *   const data = await withRetry(
 *     () => supabase.from('profiles').select('*'),
 *     {
 *       maxAttempts: 3,
 *       onRetry: (attempt, delay) => console.log(`재시도 ${attempt}회 (${delay}ms 후)`)
 *     }
 *   );
 *
 * Runs `fn` up to `maxAttempts` times with exponential back-off.
 * Non-retryable errors (401, 403, …) are thrown immediately.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ maxAttempts?: number; baseDelay?: number; onRetry?: (attempt: number, delay: number, error: unknown) => void }} [options]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, baseDelay = 1000, onRetry } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (typeof onRetry === 'function') {
        onRetry(attempt, delay, error);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
