/**
 * Is an event still to come, or already held?
 *
 * The family can override the date: `held_state` is 'held' (mark it done), 'upcoming'
 * (keep it listed as upcoming even though the date has passed, e.g. it was postponed)
 * or 'auto' (decide from the date). An event with no date is treated as upcoming
 * under 'auto', because "date to be confirmed" is not "already happened".
 *
 * "Today" is taken in the memorial's own time zone (Lagos, UTC+1), not UTC, so an event
 * does not flip to "held" an hour early or late around midnight.
 * Pure functions, unit-tested.
 */
export const MEMORIAL_TIME_ZONE = 'Africa/Lagos';

export type HeldState = 'auto' | 'held' | 'upcoming';

/** 'YYYY-MM-DD' for the given moment, in the memorial's time zone. */
export function todayKey(now: Date = new Date(), timeZone = MEMORIAL_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Normalises a Postgres date (Date object) or string to 'YYYY-MM-DD'. */
export function toDateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // pg returns DATE columns as local-midnight Dates; read the local parts so no day is lost to UTC conversion.
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export function isHeld(
  event: { event_date: string | Date | null; held_state?: string | null },
  now: Date = new Date()
): boolean {
  if (event.held_state === 'held') return true;
  if (event.held_state === 'upcoming') return false;
  const d = toDateKey(event.event_date);
  return d !== null && d < todayKey(now);
}
