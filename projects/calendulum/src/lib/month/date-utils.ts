/**
 * Pure date helpers shared across calendulum components.
 *
 * All functions operate on local calendar dates (year/month/day) and are
 * DST-safe: they never do millisecond arithmetic, so a day boundary is
 * always 24:00 in the wall clock.
 */

/** A single cell in a month grid. */
export interface DayCell {
  /** The calendar date this cell represents. */
  readonly date: Date;
  /** Whether the date belongs to the displayed month. */
  readonly inMonth: boolean;
}

/** A weekday number: 0 = Sunday through 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Accepted `visibleDays` values: a preset literal or an explicit list of
 * weekday numbers (order-insensitive, deduped by the resolver).
 */
export type CalendulumVisibleDays =
  'all' | 'mondayToFriday' | 'mondayToSaturday' | readonly Weekday[];

/**
 * Normalizes a `visibleDays` value to a canonical sorted set of weekday
 * numbers (0 = Sunday … 6 = Saturday).
 *
 * - Presets expand to fixed sets, independent of any `firstDayOfWeek`.
 * - Arrays are deduped and sorted; out-of-range values are dropped.
 * - An empty resolved set or any unknown value falls back to `'all'`, so a
 *   grid can never project to zero columns.
 */
export function resolveVisibleWeekdays(visibleDays: CalendulumVisibleDays): Set<number> {
  if (visibleDays === 'mondayToFriday') {
    return new Set([1, 2, 3, 4, 5]);
  }
  if (visibleDays === 'mondayToSaturday') {
    return new Set([1, 2, 3, 4, 5, 6]);
  }
  if (Array.isArray(visibleDays)) {
    const resolved = new Set<number>(
      visibleDays
        .filter((day): day is Weekday => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b),
    );
    if (resolved.size > 0) {
      return resolved;
    }
  }
  return new Set([0, 1, 2, 3, 4, 5, 6]);
}

/** Returns a new Date at the first day of the month of `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns a new Date shifted by `amount` months (negative goes back). */
export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/** Returns a new Date at the given day of the month of `date`. */
export function dayOfMonth(date: Date, day: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), day);
}

/** Returns true when both dates represent the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns true when both dates fall in the same calendar month. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Formats `date` as a local `YYYY-MM-DD` key.
 *
 * Uses local calendar getters with zero-padded month/day — never
 * `toISOString()` or any UTC-based conversion, so the key always names
 * the day the user sees in their own timezone.
 */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Returns true when `date` is today in the local calendar. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Builds a stable 6-week (42 cells) month grid: enough to always render a
 * full month without the grid jumping rows between months.
 *
 * Whether leading/trailing cells (neighbor months) are visible is a rendering
 * decision of the component template.
 *
 * @param view      any date inside the month to display
 * @param firstDayOfWeek 0 = Sunday, 1 = Monday
 */
export function buildMonthGrid(view: Date, firstDayOfWeek: 0 | 1): DayCell[] {
  const monthStart = startOfMonth(view);
  const offset = (monthStart.getDay() - firstDayOfWeek + 7) % 7;

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - offset + i);
    cells.push({ date, inMonth: date.getMonth() === monthStart.getMonth() });
  }

  return cells;
}

/** Returns the 7 weekday labels for the locale, starting at firstDayOfWeek. */
export function weekdayLabels(
  locale: string,
  firstDayOfWeek: 0 | 1,
  format: Intl.DateTimeFormatOptions['weekday'] = 'short',
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  const anchor = new Date(2024, 0, 1); // Monday, Jan 1 2024
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth(), 1 + i);
    labels.push(formatter.format(date));
  }
  if (firstDayOfWeek === 1) {
    // labels are already Monday-first from the anchor
    return labels;
  }
  return [...labels.slice(6), ...labels.slice(0, 6)];
}

/** Human month title, e.g. "September 2026". */
export function monthTitle(locale: string, view: Date): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(view);
}

/**
 * Returns the ISO-8601 week number (1–53) for the given date.
 *
 * ISO week 1 is the week containing the first Thursday of the year.
 * Equivalently: the week containing Jan 4.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Get day of week: 0=Sun, 1=Mon, ..., 6=Sat. Convert to ISO: 1=Mon, ..., 7=Sun
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  // Set to the Thursday of this week
  d.setDate(d.getDate() + 4 - dayOfWeek);
  // Get the year of this Thursday (this is the ISO week year)
  const year = d.getFullYear();
  // Jan 4 is always in ISO week 1. Find the Thursday of the week containing Jan 4.
  const jan4 = new Date(year, 0, 4);
  const jan4DayOfWeek = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const week1Thursday = new Date(year, 0, 4 + 4 - jan4DayOfWeek);
  // Calculate week number
  const diff = d.getTime() - week1Thursday.getTime();
  const weekNo = Math.floor(diff / 604800000) + 1;
  return weekNo;
}

/**
 * Clamps `date` to the inclusive range [`min`, `max`].
 * If a bound is null, that side is unbounded.
 * Returns the input date if no clamping needed, otherwise a new Date instance.
 */
export function clampDate(date: Date, min: Date | null, max: Date | null): Date {
  if (min != null && date < min) {
    return new Date(min.getFullYear(), min.getMonth(), min.getDate());
  }
  if (max != null && date > max) {
    return new Date(max.getFullYear(), max.getMonth(), max.getDate());
  }
  return date;
}

/** The three selection modes for the calendar. */
export type CalendulumSelectionMode = 'single' | 'multiple' | 'range';

/** Discriminated union for the calendar value per selection mode. */
export type CalendulumValue = Date | null | Date[] | { start: Date | null; end: Date | null };

/**
 * Normalizes `value` to the canonical shape for the given `mode`.
 * - 'single': Date | null → Date | null
 * - 'multiple': Date | Date[] | null → Date[]
 * - 'range': Date | {start, end} | null → {start: Date | null, end: Date | null}
 */
export function normalizeValue(
  value: Date | null | Date[] | { start: Date | null; end: Date | null },
  mode: CalendulumSelectionMode,
): CalendulumValue {
  if (mode === 'single') {
    return value as Date | null;
  }

  if (mode === 'multiple') {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    if (value instanceof Date) return [value];
    // value is {start, end} - extract dates
    return [value.start, value.end].filter((d): d is Date => d != null);
  }

  // mode === 'range'
  if (value == null) return { start: null, end: null };
  if (Array.isArray(value)) return { start: value[0] ?? null, end: value[1] ?? null };
  if (value instanceof Date) return { start: value, end: null };
  // value is {start, end}
  const start = value.start;
  const end = value.end;
  if (start != null && end != null && start > end) {
    return { start: end, end: start }; // auto-reorder
  }
  return { start, end };
}

/**
 * Returns true if `date` falls within the inclusive range [`start`, `end`].
 * Null bounds mean unbounded on that side.
 * Returns false if both bounds are null (no range defined).
 */
export function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (start == null && end == null) return false;
  if (start != null && date < start) return false;
  if (end != null && date > end) return false;
  return true;
}
