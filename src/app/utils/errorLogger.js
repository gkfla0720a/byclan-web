/**
 * =====================================================================
 * 파일명: src/app/utils/errorLogger.js
 * 역할  : 앱 전체에서 사용하는 통합 에러 로거(기록기)입니다.
 *         콘솔 출력과 Sentry(외부 에러 모니터링 서비스) 연동을 지원합니다.
 *
 * ■ 심각도(Severity) 수준
 *   INFO     - 일반 정보 메시지 (개발 환경에서만 출력)
 *   WARNING  - 주의가 필요한 상황 (콘솔 + Sentry)
 *   ERROR    - 오류 발생 (콘솔 + Sentry)
 *   CRITICAL - 심각한 오류 (콘솔 + Sentry, 즉시 대응 필요)
 *
 * ■ Sentry 연동
 *   .env.local에 NEXT_PUBLIC_SENTRY_DSN 값이 있으면 자동으로 Sentry에 오류를 전송합니다.
 *   없으면 콘솔 출력만 합니다.
 *
 * ■ 사용 방법 (다른 파일에서 import)
 *   import logger from '@/app/utils/errorLogger';
 *
 *   logger.info('사용자 로그인 성공');
 *   logger.warning('설정 파일을 찾을 수 없음', { file: 'config.json' });
 *   logger.error('DB 조회 실패', error, { query: 'SELECT *' });
 *   logger.critical('결제 처리 오류', error);
 * =====================================================================
 */

/**
 * Unified error-logger with severity levels.
 *
 * When `NEXT_PUBLIC_SENTRY_DSN` is set at build time, errors are automatically
 * forwarded to Sentry via `@sentry/browser`.  Otherwise only console output is
 * produced.
 *
 * Severity levels: info | warning | error | critical
 */

/**
 * Severity
 * - 로그 심각도 상수 모음입니다.
 * - logger.info(), logger.warning() 등의 내부에서 사용됩니다.
 * - 외부에서 심각도를 직접 지정할 때도 사용할 수 있습니다.
 *
 * 사용 예시:
 *   import { Severity } from '@/app/utils/errorLogger';
 *   logger.captureException(err, { severity: Severity.CRITICAL });
 */

export const Severity = /** @type {const} */ ({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
});

// Evaluated once at module load (Next.js inlines NEXT_PUBLIC_* at build time).
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** @param {string} level @param {string} message @returns {string} */
function prefix(level, message) {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Try to forward error to Sentry (browser-side only).
 * @param {unknown} error
 * @param {string} level
 * @param {Record<string, unknown>} context
 */
async function reportToSentry(error, level, context) {
  if (typeof window === 'undefined') return;
  if (!SENTRY_DSN) return;

  try {
    const Sentry = await import('@sentry/browser');
    if (Sentry.captureException) {
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        if (Object.keys(context).length) scope.setExtras(context);
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
      });
    }
  } catch {
    // Never let the logger itself throw
  }
}

const logger = {
  /**
   * @param {string} message
   * @param {Record<string, unknown>} [context]
   */
  info(message, context = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(prefix(Severity.INFO, message), Object.keys(context).length ? context : '');
    }
  },

  /**
   * @param {string} message
   * @param {Record<string, unknown>} [context]
   */
  warning(message, context = {}) {
    console.warn(prefix(Severity.WARNING, message), Object.keys(context).length ? context : '');
    reportToSentry(new Error(message), Severity.WARNING, context);
  },

  /**
   * @param {string} message
   * @param {unknown} [error]
   * @param {Record<string, unknown>} [context]
   */
  error(message, error = null, context = {}) {
    console.error(prefix(Severity.ERROR, message), error ?? '', Object.keys(context).length ? context : '');
    reportToSentry(error ?? new Error(message), Severity.ERROR, context);
  },

  /**
   * @param {string} message
   * @param {unknown} [error]
   * @param {Record<string, unknown>} [context]
   */
  critical(message, error = null, context = {}) {
    console.error(prefix(Severity.CRITICAL, message), error ?? '', Object.keys(context).length ? context : '');
    reportToSentry(error ?? new Error(message), Severity.CRITICAL, context);
  },

  /**
   * Capture an exception with optional severity override.
   * @param {unknown} error
   * @param {{ severity?: string; [key: string]: unknown }} [context]
   */
  captureException(error, context = {}) {
    const { severity = Severity.ERROR, ...extra } = context;
    const msg = error instanceof Error ? error.message : String(error);
    console.error(prefix(severity, msg), error, Object.keys(extra).length ? extra : '');
    reportToSentry(error, severity, extra);
  },
};

export default logger;
