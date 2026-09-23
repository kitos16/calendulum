import {
  Component,
  ElementRef,
  TemplateRef,
  computed,
  effect,
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
  clampDate,
  DayCell,
  addMonths,
  buildMonthGrid,
  dateKey,
  getISOWeek,
  isInRange,
  isSameDay,
  isSameMonth,
  isToday,
  monthTitle,
  normalizeValue,
  resolveVisibleWeekdays,
  startOfMonth,
  weekdayLabels,
  type CalendulumSelectionMode,
  type CalendulumValue,
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
  weekNumber: number | null;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
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
  /** The selected date/range (two-way bindable with `[(value)]`). Type depends on `selectionMode`. */
  readonly value = model<CalendulumValue>(null);

  /** Emitted when the value changes (for `[(value)]` two-way binding). */
  readonly valueChange = output<CalendulumValue>({ alias: 'valueChange' });

  private readonly _valueChangeEffect = effect(() => {
    this.valueChange.emit(this.value());
  });

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

  // Visual theme inputs
  /** Font size tier: 'sm' (0.875), 'md' (1), 'lg' (1.125). Default: 'md'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Density tier: 'compact' (0.75), 'cozy' (1), 'spacious' (1.375). Default: 'cozy'. */
  readonly density = input<'compact' | 'cozy' | 'spacious'>('cozy');

  /** Corner radius tier: 'sm' (0.25rem), 'md' (0.5rem), 'lg' (0.75rem), 'full' (9999px). Default: 'md'. */
  readonly cornerRadius = input<'sm' | 'md' | 'lg' | 'full'>('md');

  // Navigation bounds inputs
  /** Minimum selectable date (inclusive). Default: null (unbounded). */
  readonly minDate = input<Date | null>(null);

  /** Maximum selectable date (inclusive). Default: null (unbounded). */
  readonly maxDate = input<Date | null>(null);

  /** Month navigation mode: 'dropdown' (native select), 'arrows' (prev/next), 'none' (title only). Default: 'arrows'. */
  readonly monthSelector = input<'dropdown' | 'arrows' | 'none'>('arrows');

  // Selection inputs
  /** Selection mode: 'single' (Date|null), 'multiple' (Date[]), 'range' ({start, end}). Default: 'single'. */
  readonly selectionMode = input<CalendulumSelectionMode>('single');

  /** Show ISO week number column. Default: false. */
  readonly weekNumbers = input<boolean>(false);

  /** Emitted with the first day of the month whenever the view month changes. */
  readonly monthChange = output<Date>();

  /** Emitted when a day cell is activated, carrying viewport coordinates. */
  readonly dayClick = output<CalendulumDayClickEvent>();

  /** The month currently displayed (first day of the month). */
  readonly view = signal<Date>(
    (() => {
      const v = this.value();
      return v instanceof Date ? startOfMonth(v) : startOfMonth(new Date());
    })(),
  );

  private readonly localeId = inject(LOCALE_ID);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Visual theme computed signals (CSS variable multipliers)
  readonly fontSizeMultiplier = computed(() => {
    switch (this.fontSize()) {
      case 'sm':
        return 0.875;
      case 'lg':
        return 1.125;
      default:
        return 1;
    }
  });

  readonly densityMultiplier = computed(() => {
    switch (this.density()) {
      case 'compact':
        return 0.75;
      case 'spacious':
        return 1.375;
      default:
        return 1;
    }
  });

  readonly cornerRadiusValue = computed(() => {
    switch (this.cornerRadius()) {
      case 'sm':
        return '0.25rem';
      case 'lg':
        return '0.75rem';
      case 'full':
        return '9999px';
      default:
        return '0.5rem';
    }
  });

  // Effect to set CSS custom properties on host
  private readonly _themeEffect = effect(() => {
    const host = this.elementRef.nativeElement;
    if (host) {
      host.style.setProperty('--fz', String(this.fontSizeMultiplier()));
      host.style.setProperty('--dz', String(this.densityMultiplier()));
      host.style.setProperty('--rz', this.cornerRadiusValue());
    }
  });

  /** Clamps a CalendulumValue to min/max bounds. */
  private clampValue(value: CalendulumValue): CalendulumValue {
    const min = this.minDate();
    const max = this.maxDate();
    if (min == null && max == null) return value;

    if (value == null) return value;
    if (value instanceof Date) return clampDate(value, min, max);
    if (Array.isArray(value)) return value.map((d) => clampDate(d, min, max));
    // range object
    return {
      start: value.start != null ? clampDate(value.start, min, max) : null,
      end: value.end != null ? clampDate(value.end, min, max) : null,
    };
  }

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

  // Week numbers computed
  readonly weekColumns = computed(() => this.columnCount() + (this.weekNumbers() ? 1 : 0));

  // Month selector options (filtered by bounds)
  readonly monthOptions = computed(() => {
    const min = this.minDate();
    const max = this.maxDate();
    const startYear = min ? min.getFullYear() : this.view().getFullYear();
    const endYear = max ? max.getFullYear() : this.view().getFullYear();
    const options: { value: Date; label: string }[] = [];
    for (let year = startYear; year <= endYear; year++) {
      const startMonth = year === startYear && min ? min.getMonth() : 0;
      const endMonth = year === endYear && max ? max.getMonth() : 11;
      for (let month = startMonth; month <= endMonth; month++) {
        const date = new Date(year, month, 1);
        options.push({
          value: date,
          label: monthTitle(this.effectiveLocale(), date),
        });
      }
    }
    return options;
  });

  // Navigation bounds computed
  readonly canGoPrevious = computed(() => {
    const min = this.minDate();
    if (min == null) return true;
    return this.view() > startOfMonth(min);
  });

  readonly canGoNext = computed(() => {
    const max = this.maxDate();
    if (max == null) return true;
    return this.view() < startOfMonth(max);
  });

  /** Returns ISO week numbers for each row in the current grid. */
  getWeekNumbers(): number[] {
    const grid = buildMonthGrid(this.view(), this.firstDayOfWeek());
    const weeks: number[] = [];
    for (let i = 0; i < 6; i++) {
      const cell = grid[i * 7];
      if (cell) {
        weeks.push(getISOWeek(cell.date));
      }
    }
    return weeks;
  }

  /** Unique ID for the month select dropdown. */
  readonly monthSelectId = `cld-month-select-${Math.random().toString(36).slice(2)}`;

  /** Groups days into rows for rendering. */
  readonly dayRows = computed(() => {
    const cells = this.days();
    const rows: DayCell[][] = [];
    const cols = this.columnCount();
    for (let i = 0; i < cells.length; i += cols) {
      rows.push(cells.slice(i, i + cols));
    }
    return rows;
  });

  /** Gets the ISO week number for a row (based on first cell). */
  getWeekNumberForRow(row: DayCell[]): number {
    if (row.length === 0) return 0;
    return getISOWeek(row[0].date);
  }

  /** Builds cell context with week number for week number column. */
  cellContextWithWeekNumber(cell: DayCell): CalendulumDayCellContext {
    const baseContext = this.cellContext(cell);
    // Week number is only shown in the week number column, not in day cells
    return baseContext;
  }

  /** Builds cell classes including range selection flags. */
  cellClassesWithRange(cell: DayCell): string[] {
    const context = this.cellContext(cell);
    const baseClasses = resolveCellClasses(
      cell,
      context.isToday,
      context.isSelected,
      context.isDisabled,
      this.dayStyle()[dateKey(cell.date)],
    );
    if (context.isInRange) {
      baseClasses.push('cld-month__day--in-range');
    }
    if (context.isRangeStart) {
      baseClasses.push('cld-month__day--range-start');
    }
    if (context.isRangeEnd) {
      baseClasses.push('cld-month__day--range-end');
    }
    return baseClasses;
  }

  /** Handles month selection from dropdown. */
  onMonthSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const timestamp = Number(select.value);
    if (!isNaN(timestamp)) {
      this.setView(new Date(timestamp));
    }
  }

  private effectiveLocale(): string {
    return this.locale() ?? this.localeId;
  }

  isSelected(date: Date): boolean {
    const current = this.value();
    return current instanceof Date && isSameDay(date, current);
  }

  isToday(date: Date): boolean {
    return isToday(date);
  }

  /** Whether `date` is rejected by the `isDayDisabled` predicate OR falls outside minDate/maxDate bounds. */
  isDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min != null && date < min) return true;
    if (max != null && date > max) return true;
    return this.isDayDisabled()(date);
  }

  /** Builds the flat implicit context (`let-day`) for one grid cell. */
  cellContext(cell: DayCell): CalendulumDayCellContext {
    const date = cell.date;
    const value = this.value();
    const mode = this.selectionMode();

    let isSelected = false;
    let inRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;

    if (mode === 'single') {
      isSelected = value instanceof Date && isSameDay(date, value);
    } else if (mode === 'multiple') {
      isSelected = Array.isArray(value) && value.some((d) => isSameDay(date, d));
    } else if (mode === 'range') {
      const range = value as { start: Date | null; end: Date | null } | null;
      if (range?.start && range?.end) {
        inRange = isInRange(date, range.start, range.end);
        isRangeStart = isSameDay(date, range.start);
        isRangeEnd = isSameDay(date, range.end);
        isSelected = inRange || isRangeStart || isRangeEnd;
      } else if (range?.start) {
        isRangeStart = isSameDay(date, range.start);
        isSelected = isRangeStart;
      }
    }

    return {
      date,
      inMonth: cell.inMonth,
      isToday: this.isToday(date),
      isSelected,
      isDisabled: this.isDisabled(date),
      weekNumber: null, // Will be overridden for week number column cells
      isInRange: inRange,
      isRangeStart,
      isRangeEnd,
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
    const normalized = this.clampValue(normalizeValue(today, this.selectionMode()));
    this.value.set(normalized);
  }

  /** Selects a day and emits `valueChange`. Unconditional — bypasses disabled check. */
  select(date: Date): void {
    const normalized = this.clampValue(normalizeValue(date, this.selectionMode()));
    this.value.set(normalized);
  }

  // Selection mode-specific handlers
  private selectSingle(date: Date): void {
    const current = this.value();
    let normalized: CalendulumValue;
    if (current instanceof Date && isSameDay(date, current)) {
      normalized = this.clampValue(normalizeValue(null, this.selectionMode()));
    } else {
      normalized = this.clampValue(normalizeValue(date, this.selectionMode()));
    }
    this.value.set(normalized);
  }

  private toggleMultiple(date: Date): void {
    const current = this.value();
    const arr = Array.isArray(current)
      ? [...current]
      : current == null
        ? []
        : current instanceof Date
          ? [current]
          : [];
    const idx = arr.findIndex((d) => isSameDay(d, date));
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(date);
    }
    const normalized = this.clampValue(normalizeValue(arr, this.selectionMode()));
    this.value.set(normalized);
  }

  private selectRange(date: Date): void {
    const current = this.value();
    const range =
      current && typeof current === 'object' && 'start' in current
        ? (current as { start: Date | null; end: Date | null })
        : { start: null, end: null };

    let normalized: CalendulumValue;
    if (range.start == null) {
      // First click - set start
      normalized = this.clampValue(
        normalizeValue({ start: date, end: null }, this.selectionMode()),
      );
    } else if (range.end == null) {
      // Second click - set end (auto-reorder if needed)
      if (date < range.start) {
        normalized = this.clampValue(
          normalizeValue({ start: date, end: range.start }, this.selectionMode()),
        );
      } else {
        normalized = this.clampValue(
          normalizeValue({ start: range.start, end: date }, this.selectionMode()),
        );
      }
    } else {
      // Third click - reset to new start
      normalized = this.clampValue(
        normalizeValue({ start: date, end: null }, this.selectionMode()),
      );
    }
    this.value.set(normalized);
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

    const mode = this.selectionMode();
    if (mode === 'single') {
      this.selectSingle(date);
    } else if (mode === 'multiple') {
      this.toggleMultiple(date);
    } else if (mode === 'range') {
      this.selectRange(date);
    }
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

    const mode = this.selectionMode();
    if (mode === 'single') {
      this.selectSingle(date);
    } else if (mode === 'multiple') {
      this.toggleMultiple(date);
    } else if (mode === 'range') {
      this.selectRange(date);
    }
  }

  private setView(next: Date): void {
    this.view.set(next);
    this.monthChange.emit(next);
  }
}
