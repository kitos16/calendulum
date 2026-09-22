import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CalendulumDayClickEvent,
  CalendulumMonth,
  CalendulumVisibleDays,
  DayStyle,
  dateKey,
} from 'calendulum';

/** Unavailable booking window: today + the two following days. */
const unavailableKeys = new Set(buildUnavailableKeys());

function buildUnavailableKeys(): string[] {
  const today = new Date();
  return [0, 1, 2].map((offset) =>
    dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)),
  );
}

@Component({
  selector: 'app-root',
  imports: [CalendulumMonth, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly selected = signal<Date | null>(null);

  /** Last `dayClick` payload: the clicked date + viewport coordinates. */
  protected readonly lastClick = signal<CalendulumDayClickEvent | null>(null);

  /**
   * Per-day styles keyed by the exported `dateKey()` helper (local ISO date).
   * Today gets only a border (state classes keep background/color precedence);
   * tomorrow shows a custom background to prove per-cell styling.
   */
  protected readonly dayStyles = signal<Record<string, DayStyle>>(buildDayStyles());

  /**
   * Key-set recipe: a stable predicate over a `Set` of `dateKey()` strings.
   * The function reference is stable, so it never re-fires gratuitously.
   */
  protected readonly isDayDisabled = (d: Date) => unavailableKeys.has(dateKey(d));

  /** Visible-days filter selector: all weekdays, Mon–Fri, or Mon–Sat. */
  protected readonly visibleDays = signal<CalendulumVisibleDays>('all');

  protected onDayClick(event: CalendulumDayClickEvent): void {
    this.lastClick.set(event);
  }
}

function buildDayStyles(): Record<string, DayStyle> {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return {
    [dateKey(today)]: { border: '2px solid var(--cld-accent)' },
    [dateKey(tomorrow)]: { background: 'oklch(92% 0.09 75)', color: 'oklch(35% 0.12 65)' },
  };
}
