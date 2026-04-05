/**
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
