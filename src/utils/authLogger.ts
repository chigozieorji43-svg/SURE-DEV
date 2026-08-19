/**
 * Standardized Authentication & Authorization Logger for SureDev Abia
 */

export const authLogger = {
  info: (event: string, details?: any) => {
    console.log(`[AUTH SYSTEM INFO] ${event}`, details ? details : '');
  },
  warn: (event: string, details?: any) => {
    console.warn(`[AUTH SYSTEM WARN] ${event}`, details ? details : '');
  },
  error: (event: string, details?: any) => {
    console.error(`[AUTH SYSTEM ERROR] ${event}`, details ? details : '');
  },
  success: (event: string, details?: any) => {
    console.log(`%c[AUTH SYSTEM SUCCESS] ${event}`, 'color: #047857; font-weight: bold;', details ? details : '');
  }
};
