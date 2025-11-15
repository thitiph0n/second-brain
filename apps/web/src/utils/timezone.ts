// Timezone utilities for consistent date handling across the application

/**
 * Get the user's IANA timezone name
 * @returns The user's timezone (e.g., "Asia/Bangkok", "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get local date string in YYYY-MM-DD format consistent with user's timezone
 * @param date - Date to convert (defaults to now)
 * @param timezone - Optional timezone (defaults to user's local timezone)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date(), timezone?: string): string {
  const targetTimezone = timezone || getUserTimezone();

  return date.toLocaleString('en-CA', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Check if a date is today in the user's timezone
 * @param date - Date to check
 * @param timezone - Optional timezone (defaults to user's local timezone)
 * @returns True if the date is today
 */
export function isToday(date: Date | string, timezone?: string): boolean {
  const targetTimezone = timezone || getUserTimezone();
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return getLocalDateString(checkDate, targetTimezone) === getLocalDateString(today, targetTimezone);
}

/**
 * Get the start of day in user's timezone as ISO string
 * @param date - Date (defaults to now)
 * @param timezone - Optional timezone (defaults to user's local timezone)
 * @returns ISO string representing start of day in user's timezone
 */
export function getStartOfDay(date: Date = new Date(), timezone?: string): string {
  const targetTimezone = timezone || getUserTimezone();

  return new Date(date.toLocaleString('en-US', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })).toISOString();
}

/**
 * Common timezone mappings for display
 */
export const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Bangkok': 'Bangkok (GMT+7)',
  'Asia/Singapore': 'Singapore (GMT+8)',
  'Asia/Hong_Kong': 'Hong Kong (GMT+8)',
  'Asia/Tokyo': 'Tokyo (GMT+9)',
  'America/New_York': 'New York (GMT-5/-4)',
  'America/Los_Angeles': 'Los Angeles (GMT-8/-7)',
  'America/Chicago': 'Chicago (GMT-6/-5)',
  'Europe/London': 'London (GMT+0/+1)',
  'Europe/Paris': 'Paris (GMT+1/+2)',
  'Australia/Sydney': 'Sydney (GMT+10/+11)',
};