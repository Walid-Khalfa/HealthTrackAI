
import { logger } from '../services/logger';

/**
 * SECURITY UTILITIES
 * Centralized logic for preventing injections (Prompt, XSS, DoS, SSRF) and Design Flaws
 */

// --- CONSTANTS & CONSTRAINTS (Prevent Resource Exhaustion) ---
const MAX_TEXT_LENGTH = 5000; 
const MAX_TITLE_LENGTH = 100;

// NEW: File Constraints
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file limit
export const MAX_FILES_PER_REPORT = 5; // Max attachments per request

// NEW: Rate Limiting Config
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute per user

/**
 * 0. SSRF PROTECTION (URL STRIPPING)
 * Removes URLs from input to prevent the LLM from processing external links
 * or being tricked into accessing internal resources (Indirect SSRF).
 */
export const stripUrls = (text: string): string => {
  if (!text) return "";
  // Regex to identify http/https/ftp urls
  const urlRegex = /\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig;
  
  if (urlRegex.test(text)) {
    // Only log if it looks suspicious/internal, otherwise just strip silently
    if (text.includes('localhost') || text.includes('127.0.0.1') || text.includes('169.254')) {
       logger.log('INPUT_VALIDATION_FAILURE', 'MEDIUM', 'Suspicious URL detected and stripped', { textSnippet: text.substring(0, 50) });
    }
    return text.replace(urlRegex, "[URL_REMOVED]");
  }
  return text;
};

/**
 * 1. PROMPT INJECTION DEFENSE
 * Sanitizes user input specifically for GenAI XML fencing contexts.
 * NOW INCLUDES: URL Stripping for SSRF prevention.
 */
export const sanitizeForAI = (input: string): string => {
  if (!input) return "";
  
  // 1. Strip URLs first (SSRF Defense)
  let clean = stripUrls(input);
  
  // 2. Escape XML-like tags (Prompt Injection Defense)
  clean = clean
    .replace(/<system_context>/gi, "[system_context]")
    .replace(/<\/system_context>/gi, "[/system_context]")
    .replace(/<user_input>/gi, "[user_input]")
    .replace(/<\/user_input>/gi, "[/user_input]");

  // 3. Remove null bytes
  clean = clean.replace(/\0/g, "");
  
  return clean;
};

/**
 * 2. INPUT VALIDATION (DoS Prevention)
 */
export const validateInputLength = (text: string, type: 'text' | 'title' = 'text'): string => {
  const maxLength = type === 'title' ? MAX_TITLE_LENGTH : MAX_TEXT_LENGTH;
  
  if (!text) return "";
  
  if (text.length > maxLength) {
    console.warn(`Security Warning: Input exceeded ${maxLength} chars. Truncated.`);
    // Ideally log truncation events if they seem abusive, but for now we keep it simple
    return text.slice(0, maxLength);
  }
  
  return text;
};

/**
 * 3. BASIC XSS SANITIZATION
 */
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * 4. RATE LIMITING (Insecure Design Defense)
 * Prevents API spamming / Denial of Wallet.
 * Uses LocalStorage as a client-side throttle mechanism.
 * Note: In a full-stack app, this should also be enforced on the backend.
 */
export const checkRateLimit = (userId: string): boolean => {
  const key = `rate_limit_${userId}`;
  const now = Date.now();
  
  try {
    const record = localStorage.getItem(key);
    let data: { count: number, startTime: number } = record 
      ? JSON.parse(record) 
      : { count: 0, startTime: now };

    // Reset window if time passed
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      data = { count: 1, startTime: now };
    } else {
      // Increment
      data.count += 1;
    }

    localStorage.setItem(key, JSON.stringify(data));

    if (data.count > MAX_REQUESTS_PER_WINDOW) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      // AUDIT LOG: Record this abuse
      logger.log('RATE_LIMIT_EXCEEDED', 'LOW', `User exceeded ${MAX_REQUESTS_PER_WINDOW} requests/min`, { userId, count: data.count });
      return false;
    }
    
    return true;
  } catch (e) {
    // Fail safe: allow request if local storage fails, but log it
    console.error("Rate limiter error", e);
    return true;
  }
};

/**
 * 5. SECURE UUID GENERATION
 * Used for file names and IDs.
 */
export const getSecureUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 6. DATA INTEGRITY CHECKS (OWASP A08)
 * Ensures that data deserialized from untrusted sources (localStorage, AI, Network) matches expected structure.
 */

// Helper to strip Markdown code blocks from JSON strings (common in LLM outputs)
export const cleanJsonString = (str: string): string => {
  // Remove ```json and ``` wrapping
  let clean = str.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return clean.trim();
};

// Safe JSON Parse with integrity check wrapper
export const safeJsonParse = <T>(jsonString: string, validator: (obj: any) => boolean): T | null => {
  try {
    const cleaned = cleanJsonString(jsonString);
    const parsed = JSON.parse(cleaned);
    if (validator(parsed)) {
      return parsed as T;
    }
    console.warn("Integrity Check Failed: Data structure mismatch.");
    return null;
  } catch (e) {
    console.error("Integrity Check Failed: Invalid JSON syntax.", e);
    return null;
  }
};

// Simple schema validator for HealthReport list
export const validateHealthReportList = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  // Check if empty or if first item looks like a report
  if (data.length === 0) return true;
  const item = data[0];
  return (
    typeof item === 'object' && 
    item !== null &&
    'id' in item && 
    'created_at' in item
  );
};
