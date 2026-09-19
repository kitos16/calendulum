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