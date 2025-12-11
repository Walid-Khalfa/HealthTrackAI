
import { supabase } from './supabaseClient';
import { SecurityEventType, SecuritySeverity } from '../types';

/**
 * SECURITY LOGGER (OWASP A09)
 * Centralized logging for security-critical events.
 * This allows admins to detect active attacks (brute force, injections, etc.).
 */
class SecurityLogger {
  
  /**
   * Logs a security event to the remote database (and console in dev).
   */
  public async log(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    details: string,
    metadata: any = {}
  ) {
    try {
      // 1. Always log to console for immediate debugging (in non-prod, or if using a log collector)
      const logMsg = `[SECURITY][${severity}] ${eventType}: ${details}`;
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        console.error(logMsg, metadata);
      } else {
        console.warn(logMsg);
      }

      // 2. Get current user context if available (even if not passed explicitly)
      let userId = metadata.userId;
      let userEmail = metadata.email;

      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          userEmail = session.user.email;
        }
      }

      // 3. Persist to Supabase 'security_audit_logs' table
      // Note: This table must exist in your database schema.
      // Failing to write to logs should not crash the app, hence the silent catch.
      const { error } = await supabase
        .from('security_audit_logs')
        .insert([
          {
            event_type: eventType,
            severity: severity,
            user_id: userId,
            user_email: userEmail,
            details: {
              message: details,
              ...metadata,
              userAgent: navigator.userAgent, // Track source of attack
              timestamp: new Date().toISOString()
            }
          }
        ]);

      if (error) {
        // Fallback: If DB logging fails, at least we tried. 
        // In a real production app, we might send this to a secondary service like Sentry.
        console.warn("Failed to write to security audit log:", error.message);
      }

    } catch (e) {
      console.error("Critical Logger Failure:", e);
    }
  }
}

export const logger = new SecurityLogger();
