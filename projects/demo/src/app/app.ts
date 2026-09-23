import { Component, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CalendulumDayClickEvent,
  CalendulumMonth,
  CalendulumVisibleDays,
  CalendulumValue,
  CalendulumSelectionMode,
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
  /** The selected date/range (two-way bindable with `[(value)]`). Type depends on `selectionMode`. */
  protected readonly value = signal<CalendulumValue>(null);

  /** Selection mode: 'single' (Date|null), 'multiple' (Date[]), 'range' ({start, end}). */
  protected readonly selectionMode = signal<CalendulumSelectionMode>('single');

  /** Visual theme inputs */
  protected readonly fontSize = signal<'sm' | 'md' | 'lg'>('md');
  protected readonly density = signal<'compact' | 'cozy' | 'spacious'>('cozy');
  protected readonly cornerRadius = signal<'sm' | 'md' | 'lg' | 'full'>('md');

  /** Navigation bounds */
  protected readonly minDate = signal<Date | null>(null);
  protected readonly maxDate = signal<Date | null>(null);

  /** Month navigation mode */
  protected readonly monthSelector = signal<'dropdown' | 'arrows' | 'none'>('arrows');

  /** Show ISO week number column */
  protected readonly weekNumbers = signal<boolean>(false);

  /** Visible-days filter selector: all weekdays, Mon–Fri, or Mon–Sat. */
  protected readonly visibleDays = signal<CalendulumVisibleDays>('all');

  /** Last `dayClick` payload: the clicked date + viewport coordinates. */
  protected readonly lastClick = signal<CalendulumDayClickEvent | null>(null);

  /** Weekday predicate: disable weekends. */
  protected readonly isDayDisabled = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  /** Per-day styles keyed by the exported `dateKey()` helper (local ISO date). */
  protected readonly dayStyles = signal<Record<string, DayStyle>>(buildDayStyles());

  /** Sync selectionMode changes to value normalization. */
  private readonly _modeEffect = effect(() => {
    const mode = this.selectionMode();
    const current = this.value();
    if (mode === 'single' && !(current instanceof Date) && current !== null) {
      this.value.set(null);
    } else if (mode === 'multiple' && !Array.isArray(current)) {
      this.value.set(current instanceof Date ? [current] : []);
    } else if (
      mode === 'range' &&
      (!current || typeof current !== 'object' || !('start' in current))
    ) {
      this.value.set({ start: current instanceof Date ? current : null, end: null });
    }
  });

  protected onDayClick(event: CalendulumDayClickEvent): void {
    this.lastClick.set(event);
  }

  /** Quick presets for bounds. */
  protected setBoundsPreset(preset: 'none' | 'past' | 'future' | 'month'): void {
    const now = new Date();
    switch (preset) {
      case 'none':
        this.minDate.set(null);
        this.maxDate.set(null);
        break;
      case 'past':
        this.minDate.set(new Date(2020, 0, 1));
        this.maxDate.set(now);
        break;
      case 'future':
        this.minDate.set(now);
        this.maxDate.set(new Date(2030, 11, 31));
        break;
      case 'month':
        this.minDate.set(new Date(now.getFullYear(), now.getMonth(), 1));
        this.maxDate.set(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
    }
  }

  /** Quick presets for visual theme. */
  protected setVisualPreset(preset: 'default' | 'compact' | 'comfortable'): void {
    switch (preset) {
      case 'default':
        this.fontSize.set('md');
        this.density.set('cozy');
        this.cornerRadius.set('md');
        break;
      case 'compact':
        this.fontSize.set('sm');
        this.density.set('compact');
        this.cornerRadius.set('sm');
        break;
      case 'comfortable':
        this.fontSize.set('lg');
        this.density.set('spacious');
        this.cornerRadius.set('lg');
        break;
    }
  }

  /** Current value as a display string. */
  protected readonly valueDisplay = computed(() => {
    const v = this.value();
    if (v == null) return 'null';
    if (v instanceof Date) return v.toLocaleDateString();
    if (Array.isArray(v)) return `[${v.map((d) => d.toLocaleDateString()).join(', ')}]`;
    return `{ start: ${v.start?.toLocaleDateString() ?? 'null'}, end: ${v.end?.toLocaleDateString() ?? 'null'} }`;
  });

  /** Event handlers for visual theme select inputs */
  protected onFontSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.fontSize.set(select.value as 'sm' | 'md' | 'lg');
  }

  protected onDensityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.density.set(select.value as 'compact' | 'cozy' | 'spacious');
  }

  protected onCornerRadiusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.cornerRadius.set(select.value as 'sm' | 'md' | 'lg' | 'full');
  }

  protected onSelectionModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectionMode.set(select.value as CalendulumSelectionMode);
  }

  protected onMonthSelectorChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.monthSelector.set(select.value as 'dropdown' | 'arrows' | 'none');
  }

  protected onMinDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.minDate.set(input.value ? new Date(input.value) : null);
  }

  protected onMaxDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.maxDate.set(input.value ? new Date(input.value) : null);
  }
}

function buildDayStyles(): Record<string, DayStyle> {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const dayAfterTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
  return {
    [dateKey(today)]: { border: '2px solid var(--cld-accent)' },
    [dateKey(tomorrow)]: { background: 'oklch(92% 0.09 75)', color: 'oklch(35% 0.12 65)' },
    [dateKey(dayAfterTomorrow)]: { class: ['day-cell--highlight', 'pulse'] },
  };
}
