import { Component, TemplateRef, computed, inject, input, model, output, signal } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import {
  DayCell,
  addMonths,
  buildMonthGrid,
  isSameDay,
  isToday,
  monthTitle,
  startOfMonth,
  weekdayLabels,
} from '../date-utils';

/** Context passed to a custom `dayCell` template. */
export interface CalendulumDayCellContext {
  $implicit: DayCell;
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

  /** Custom day-cell template; receives the `DayCell` as `$implicit`. */
  readonly dayCell = input<TemplateRef<CalendulumDayCellContext> | null>(null);

  /** Emitted with the first day of the month whenever the view month changes. */
  readonly monthChange = output<Date>();

  /** The month currently displayed (first day of the month). */
  readonly view = signal<Date>(startOfMonth(this.value() ?? new Date()));

  private readonly localeId = inject(LOCALE_ID);

  /** 42-cell grid for the displayed month. */
  readonly days = computed(() => buildMonthGrid(this.view(), this.firstDayOfWeek()));

  /** Weekday header labels in the active locale. */
  readonly weekdays = computed(() => weekdayLabels(this.effectiveLocale(), this.firstDayOfWeek()));

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

  private setView(next: Date): void {
    this.view.set(next);
    this.monthChange.emit(next);
  }
}