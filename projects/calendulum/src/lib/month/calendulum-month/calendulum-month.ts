import {
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import {
  CalendulumVisibleDays,
  DayCell,
  addMonths,
  buildMonthGrid,
  dateKey,
  isSameDay,
  isToday,
  monthTitle,
  resolveVisibleWeekdays,
  startOfMonth,
  weekdayLabels,
} from '../date-utils';

/** Per-day style entry keyed by a local ISO date string (see `dayStyle`). */
export interface DayStyle {
  border?: string;
  color?: string;
  background?: string;
  class?: string | string[];
}

/** Payload of the `dayClick` output: the clicked date + viewport coordinates. */
export interface CalendulumDayClickEvent {
  date: Date;
  x: number;
  y: number;
}

/** Flat implicit context for day templates: `let-day` exposes these fields. */
export interface CalendulumDayCellContext {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

/**
 * Maps a `DayStyle` entry to the `--cld-day-*` custom properties for one
 * cell. The `class` option is intentionally excluded — it belongs to the
 * cell's class list, not its inline styles.
 */
export function resolveDayStyle(
  style: Record<string, DayStyle>,
  key: string,
): Record<string, string> {
  const entry = style[key];
  if (!entry) {
    return {};
  }
  const props: Record<string, string> = {};
  if (entry.border != null) props['--cld-day-border'] = entry.border;
  if (entry.color != null) props['--cld-day-color'] = entry.color;
  if (entry.background != null) props['--cld-day-bg'] = entry.background;
  return props;
}

/**
 * Builds the class list for one day cell: component state classes first,
 * then the entry's consumer class. Consumer classes never replace state
 * classes — they are always appended.
 */
export function resolveCellClasses(
  cell: DayCell,
  today: boolean,
  selected: boolean,
  disabled: boolean,
  style: DayStyle | undefined,
): string[] {
  const classes: string[] = [];
  if (!cell.inMonth) classes.push('cld-month__day--outside');
  if (today) classes.push('cld-month__day--today');
  if (selected) classes.push('cld-month__day--selected');
  if (disabled) classes.push('cld-month__day--disabled');
  const extra = style?.class;
  if (typeof extra === 'string') {
    if (extra) classes.push(extra);
  } else if (extra) {
    classes.push(...extra);
  }
  return classes;
}

/**
 * Reusable month calendar view.
 *
 * Two-way bind the selected date with `[(value)]`. Customize each day cell
 * with the `dayCell` template input, and theme the component with the CSS
 * custom properties documented in the stylesheet.
 */
@Component({
  selector: 'calendulum-month',
  imports: [NgTemplateOutlet],
  templateUrl: './calendulum-month.html',
  styleUrl: './calendulum-month.scss',
})
export class CalendulumMonth {
  /** The selected date (two-way bindable with `[(value)]`). */
  readonly value = model<Date | null>(null);

  /** Week start: 0 = Sunday, 1 = Monday. */
  readonly firstDayOfWeek = input<0 | 1>(1);

  /** Locale override; defaults to the application locale (LOCALE_ID). */
  readonly locale = input<string | undefined>(undefined);

  /** Hide leading/trailing cells that belong to neighbor months. */
  readonly showOutsideDays = input(true);

  /** Custom day-cell template; receives `CalendulumDayCellContext` as `$implicit`. */
  readonly dayCell = input<TemplateRef<{ $implicit: CalendulumDayCellContext }> | null>(null);

  /** Template rendered above the day number; same context as `dayCell`. */
  readonly dayCellTop = input<TemplateRef<{ $implicit: CalendulumDayCellContext }> | null>(null);

  /** Template rendered below the day number; same context as `dayCell`. */
  readonly dayCellBottom = input<TemplateRef<{ $implicit: CalendulumDayCellContext }> | null>(null);

  /** Per-day styles keyed by local ISO date string (see `dateKey`). */
  readonly dayStyle = input<Record<string, DayStyle>>({});

  /**
   * Restricts which weekday columns render: a preset literal or an explicit
   * weekday list (0 = Sunday … 6 = Saturday, order-insensitive). Whole
   * columns are projected away — rows stay complete and 6-deep. Invalid
   * values normalize to `'all'`.
   */
  readonly visibleDays = input<CalendulumVisibleDays>('all');

  /**
   * Predicate marking dates that must not be activated by the user (no
   * `dayClick`, no selection). Programmatic `select()`/`goToToday()` stay
   * unconditional. Pass a stable function reference — inline arrows re-fire
   * on every change detection.
   */
  readonly isDayDisabled = input<(date: Date) => boolean>(() => false);

  /** Emitted with the first day of the month whenever the view month changes. */
  readonly monthChange = output<Date>();

  /** Emitted when a day cell is activated, carrying viewport coordinates. */
  readonly dayClick = output<CalendulumDayClickEvent>();

  /** The month currently displayed (first day of the month). */
  readonly view = signal<Date>(startOfMonth(this.value() ?? new Date()));

  private readonly localeId = inject(LOCALE_ID);

  /** Weekday numbers (0–6) that render as columns, from `visibleDays`. */
  readonly visibleWeekdaySet = computed(() => resolveVisibleWeekdays(this.visibleDays()));

  /** Number of weekday columns to render (headers and grid tracks). */
  readonly columnCount = computed(() => this.visibleWeekdaySet().size);

  /** Grid filtered to the visible weekday columns (whole-column projection). */
  readonly days = computed(() =>
    buildMonthGrid(this.view(), this.firstDayOfWeek()).filter((cell) =>
      this.visibleWeekdaySet().has(cell.date.getDay()),
    ),
  );

  /** Weekday header labels in the active locale, aligned with the columns. */
  readonly weekdays = computed(() => {
    const labels = weekdayLabels(this.effectiveLocale(), this.firstDayOfWeek());
    const first = this.firstDayOfWeek();
    return labels.filter((_, i) => this.visibleWeekdaySet().has((i + first) % 7));
  });

  /** Header title, e.g. "September 2026". */
  readonly title = computed(() => monthTitle(this.effectiveLocale(), this.view()));

  private effectiveLocale(): string {
    return this.locale() ?? this.localeId;
  }

  isSelected(date: Date): boolean {
    const current = this.value();
    return current != null && isSameDay(date, current);
  }

  isToday(date: Date): boolean {
    return isToday(date);
  }

  /** Whether `date` is rejected by the `isDayDisabled` predicate. */
  isDisabled(date: Date): boolean {
    return this.isDayDisabled()(date);
  }

  /** Builds the flat implicit context (`let-day`) for one grid cell. */
  cellContext(cell: DayCell): CalendulumDayCellContext {
    return {
      date: cell.date,
      inMonth: cell.inMonth,
      isToday: this.isToday(cell.date),
      isSelected: this.isSelected(cell.date),
      isDisabled: this.isDisabled(cell.date),
    };
  }

  /** Per-cell class list: state classes merged with the entry's `class`. */
  cellClasses(cell: DayCell): string[] {
    return resolveCellClasses(
      cell,
      this.isToday(cell.date),
      this.isSelected(cell.date),
      this.isDisabled(cell.date),
      this.dayStyle()[dateKey(cell.date)],
    );
  }

  /** Per-cell `--cld-day-*` inline custom properties from `dayStyle`. */
  cellStyle(cell: DayCell): Record<string, string> {
    return resolveDayStyle(this.dayStyle(), dateKey(cell.date));
  }

  /** Moves the view one month back. */
  previous(): void {
    this.setView(addMonths(this.view(), -1));
  }

  /** Moves the view one month forward. */
  next(): void {
    this.setView(addMonths(this.view(), 1));
  }

  /** Returns to the current month and selects today. */
  goToToday(): void {
    const today = new Date();
    this.setView(startOfMonth(today));
    this.select(today);
  }

  /** Selects a day and emits `valueChange`. */
  select(date: Date): void {
    this.value.set(date);
  }

  /**
   * Emits `dayClick` with the event's viewport coordinates, then selects
   * the day — `dayClick` is additive to the existing `select()` behavior.
   * Disabled dates short-circuit: no emission, no selection.
   */
  onDayClick(date: Date, event: MouseEvent): void {
    if (this.isDisabled(date)) {
      return;
    }
    this.dayClick.emit({ date, x: event.clientX, y: event.clientY });
    this.select(date);
  }

  /**
   * Keyboard activation for custom day cells (Enter/Space). A
   * `KeyboardEvent` carries no viewport coordinates, so the payload uses
   * the documented `{ x: 0, y: 0 }` convention and selection still applies.
   * Disabled dates short-circuit: no emission, no selection.
   */
  onDayKeydown(date: Date): void {
    if (this.isDisabled(date)) {
      return;
    }
    this.dayClick.emit({ date, x: 0, y: 0 });
    this.select(date);
  }

  private setView(next: Date): void {
    this.view.set(next);
    this.monthChange.emit(next);
  }
}
