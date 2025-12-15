export type SecurityLogSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityLogPayload {
  userId?: string;
  [key: string]: unknown;
}

export const logger = {
  log: (
    eventType: string,
    severity: SecurityLogSeverity,
    details: string,
    payload?: SecurityLogPayload
  ) => {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        eventType,
        severity,
        details,
        payload,
      };

      if (severity === 'CRITICAL' || severity === 'HIGH') {
        console.error('[security]', entry);
      } else if (severity === 'MEDIUM') {
        console.warn('[security]', entry);
      } else {
        console.info('[security]', entry);
      }
    } catch {
      // Never allow logging failures to break the app
    }
  },
};
