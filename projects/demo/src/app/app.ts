import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CalendulumDayClickEvent,
  CalendulumMonth,
  CalendulumVisibleDays,
  DayStyle,
  dateKey,
} from 'calendulum';

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
   * Weekday predicate: disable every Saturday and Sunday so clicking them
   * does nothing (no `dayClick`, no selection). Works for any rule you can
   * express as a `(date: Date) => boolean`.
   */
  protected readonly isDayDisabled = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

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
