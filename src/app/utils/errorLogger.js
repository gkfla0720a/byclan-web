/**
 * Unified error-logger with severity levels.
 *
 * When `NEXT_PUBLIC_SENTRY_DSN` is set, errors are automatically forwarded to
 * Sentry via `@sentry/browser`.  Otherwise only console output is produced.
 *
 * Severity levels: info | warning | error | critical
 */

export const Severity = /** @type {const} */ ({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
});

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
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

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
