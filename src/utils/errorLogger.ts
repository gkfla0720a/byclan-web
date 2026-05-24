// 파일명: @/utils/errorLogger.ts

/**
 * =====================================================================
 * 파일명: src/utils/errorLogger.ts
 * 역할  : 앱 전체에서 사용하는 통합 에러 로거(기록기)입니다.
 * 콘솔 출력과 Sentry(외부 에러 모니터링 서비스) 연동을 지원합니다.
 *
 * ■ 심각도(Severity) 수준
 * INFO     - 일반 정보 메시지 (개발 환경에서만 출력)
 * WARNING  - 주의가 필요한 상황 (콘솔 + Sentry)
 * ERROR    - 오류 발생 (콘솔 + Sentry)
 * CRITICAL - 심각한 오류 (콘솔 + Sentry, 즉시 대응 필요)
 *
 * ■ Sentry 연동
 * .env.local에 NEXT_PUBLIC_SENTRY_DSN 값이 있으면 자동으로 Sentry에 오류를 전송합니다.
 * 없으면 콘솔 출력만 합니다.
 * =====================================================================
 */

// 1. JSDoc 대신 TypeScript의 'as const'를 사용하여 안전한 상수로 만듭니다.
export const Severity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

// Severity의 값('info' | 'warning' | 'error' | 'critical')만 뽑아서 타입으로 만듭니다.
export type SeverityLevel = typeof Severity[keyof typeof Severity];

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

function prefix(level: string, message: string): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
}

async function reportToSentry(
  error: unknown,
  level: SeverityLevel | string,
  context: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!SENTRY_DSN) return;

  try {
    const Sentry = await import('@sentry/browser');
    if (Sentry.captureException) {
      Sentry.withScope((scope) => {
        // Sentry 내부 타입에 맞추기 위해 as any 처리 (안전함)
        scope.setLevel(level as any); 
        if (Object.keys(context).length) scope.setExtras(context);
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
      });
    }
  } catch {
    // 로거 자체에서 발생한 에러는 앱을 뻗게 만들지 않도록 무시합니다.
  }
}

// 2. 아까 에러가 났던 원인을 해결하기 위해, context의 설계도(인터페이스)를 만듭니다.
export interface CaptureContext extends Record<string, unknown> {
  severity?: SeverityLevel | string;
}

const logger = {
  info(message: string, context: Record<string, unknown> = {}): void {
    if (process.env.NODE_ENV !== 'production') {
      console.info(prefix(Severity.INFO, message), Object.keys(context).length ? context : '');
    }
  },

  warning(message: string, context: Record<string, unknown> = {}): void {
    console.warn(prefix(Severity.WARNING, message), Object.keys(context).length ? context : '');
    reportToSentry(new Error(message), Severity.WARNING, context);
  },

  error(message: string, error: unknown = null, context: Record<string, unknown> = {}): void {
    console.error(prefix(Severity.ERROR, message), error ?? '', Object.keys(context).length ? context : '');
    reportToSentry(error ?? new Error(message), Severity.ERROR, context);
  },

  critical(message: string, error: unknown = null, context: Record<string, unknown> = {}): void {
    console.error(prefix(Severity.CRITICAL, message), error ?? '', Object.keys(context).length ? context : '');
    reportToSentry(error ?? new Error(message), Severity.CRITICAL, context);
  },

  // 3. 설계도(CaptureContext)를 적용하여 에러 무시 주석(@ts-expect-error)을 걷어냈습니다!
  captureException(error: unknown, context: CaptureContext = {}): void {
    const severity = context.severity ?? Severity.ERROR;
    const { severity: _ignoredSeverity, ...extra } = context;
    
    const msg = error instanceof Error ? error.message : String(error);
    console.error(prefix(severity, msg), error, Object.keys(extra).length ? extra : '');
    reportToSentry(error, severity, extra);
  },
};

export default logger;
