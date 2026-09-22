import { Component, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CalendulumVisibleDays,
  DayCell,
  buildMonthGrid,
  dateKey,
  isSameDay,
  monthTitle,
  resolveVisibleWeekdays,
  startOfMonth,
  weekdayLabels,
} from '../date-utils';
import {
  CalendulumDayClickEvent,
  CalendulumMonth,
  DayStyle,
  resolveCellClasses,
  resolveDayStyle,
} from './calendulum-month';

describe('CalendulumMonth', () => {
  let component: CalendulumMonth;
  let fixture: ComponentFixture<CalendulumMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendulumMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendulumMonth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a stable 42-cell month grid', () => {
    const dayButtons = fixture.nativeElement.querySelectorAll('button.cld-month__day');
    expect(dayButtons.length).toBe(42);
  });

  it('shows the current month in the header', () => {
    const title = fixture.nativeElement.querySelector('.cld-month__title');
    expect(title.textContent).toContain(monthTitle('en-US', startOfMonth(new Date())));
  });

  it('marks today with the today class and shows its day number', () => {
    const today = fixture.nativeElement.querySelector(
      'button.cld-month__day--today',
    ) as HTMLButtonElement | null;
    expect(today).not.toBeNull();
    expect(today!.textContent!.trim()).toBe(String(new Date().getDate()));
  });

  describe('selection', () => {
    it('selects a day, updates the model and emits valueChange', () => {
      const emitted: Date[] = [];
      component.value.subscribe((d) => emitted.push(d!));

      const today = fixture.nativeElement.querySelector(
        'button.cld-month__day--today',
      ) as HTMLButtonElement | null;
      today!.click();
      fixture.detectChanges();

      expect(component.value()).not.toBeNull();
      expect(isSameDay(component.value()!, new Date())).toBe(true);
      expect(emitted.length).toBe(1);
      expect(isSameDay(emitted[0], new Date())).toBe(true);

      const selected = fixture.nativeElement.querySelector('button.cld-month__day--selected');
      expect(selected).not.toBeNull();
      expect(selected!.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('navigation', () => {
    it('moves forward one month and emits monthChange', () => {
      const emitted: Date[] = [];
      component.monthChange.subscribe((d) => emitted.push(d));

      const navButtons = fixture.nativeElement.querySelectorAll('button.cld-month__nav');
      navButtons[1].click(); // next
      fixture.detectChanges();

      const expected = new Date(
        startOfMonth(new Date()).getFullYear(),
        startOfMonth(new Date()).getMonth() + 1,
        1,
      );
      expect(monthTitle('en-US', component.view())).toBe(monthTitle('en-US', expected));
      expect(emitted.length).toBe(1);
      expect(isSameDay(emitted[0], expected)).toBe(true);
    });

    it('moves backward one month', () => {
      const navButtons = fixture.nativeElement.querySelectorAll('button.cld-month__nav');
      navButtons[0].click(); // previous
      fixture.detectChanges();

      const expected = new Date(
        startOfMonth(new Date()).getFullYear(),
        startOfMonth(new Date()).getMonth() - 1,
        1,
      );
      expect(monthTitle('en-US', component.view())).toBe(monthTitle('en-US', expected));
    });

    it('goToToday returns to the current month and selects today', () => {
      const navButtons = fixture.nativeElement.querySelectorAll('button.cld-month__nav');
      navButtons[0].click();
      navButtons[0].click();
      fixture.detectChanges();

      component.goToToday();
      fixture.detectChanges();

      expect(isSameDay(component.view(), startOfMonth(new Date()))).toBe(true);
      expect(isSameDay(component.value()!, new Date())).toBe(true);
    });
  });

  describe('customization', () => {
    it('hides outside-month cells when showOutsideDays is false', () => {
      fixture.componentRef.setInput('showOutsideDays', false);
      fixture.detectChanges();

      const dayButtons = fixture.nativeElement.querySelectorAll('button.cld-month__day');
      expect(dayButtons.length).toBeGreaterThan(27);
      expect(dayButtons.length).toBeLessThan(42);
    });

    it('respects firstDayOfWeek = 0 (Sunday first)', () => {
      fixture.componentRef.setInput('firstDayOfWeek', 0);
      fixture.detectChanges();

      const weekdays = fixture.nativeElement.querySelectorAll('.cld-month__weekday');
      const first = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
        new Date(2024, 0, 7),
      );
      expect(weekdays[0].textContent).toContain(first);
    });

    it('renders no slot wrappers when neither slot input is provided', () => {
      const wrappers = fixture.nativeElement.querySelectorAll(
        '.cld-month__day-top, .cld-month__day-bottom',
      );
      expect(wrappers.length).toBe(0);
    });
  });

  describe('dayClick', () => {
    it('emits the date and viewport coordinates, then selects the day', () => {
      const emitted: CalendulumDayClickEvent[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));

      const today = fixture.nativeElement.querySelector(
        'button.cld-month__day--today',
      ) as HTMLButtonElement;
      today.dispatchEvent(new MouseEvent('click', { clientX: 120, clientY: 340, bubbles: true }));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(isSameDay(emitted[0].date, new Date())).toBe(true);
      expect(emitted[0].x).toBe(120);
      expect(emitted[0].y).toBe(340);
      expect(isSameDay(component.value()!, new Date())).toBe(true);
    });

    it('emits distinct coordinates for clicks at different viewport points', () => {
      const emitted: CalendulumDayClickEvent[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));

      const buttons = fixture.nativeElement.querySelectorAll('button.cld-month__day');
      (buttons[0] as HTMLButtonElement).dispatchEvent(
        new MouseEvent('click', { clientX: 10, clientY: 20, bubbles: true }),
      );
      (buttons[1] as HTMLButtonElement).dispatchEvent(
        new MouseEvent('click', { clientX: 300, clientY: 500, bubbles: true }),
      );
      fixture.detectChanges();

      expect(emitted.length).toBe(2);
      expect([emitted[0].x, emitted[0].y]).toEqual([10, 20]);
      expect([emitted[1].x, emitted[1].y]).toEqual([300, 500]);
    });

    it('selects an outside day without navigating or emitting monthChange', () => {
      const emitted: CalendulumDayClickEvent[] = [];
      const monthChanges: Date[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));
      component.monthChange.subscribe((d) => monthChanges.push(d));

      const monthStart = startOfMonth(new Date());
      const offset = (monthStart.getDay() - 1 + 7) % 7;
      const firstOutside = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - offset);

      const outsideButton = fixture.nativeElement.querySelector(
        'button.cld-month__day--outside',
      ) as HTMLButtonElement;
      expect(outsideButton).not.toBeNull();
      outsideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(isSameDay(emitted[0].date, firstOutside)).toBe(true);
      expect(isSameDay(component.value()!, firstOutside)).toBe(true);
      expect(monthChanges.length).toBe(0);
      expect(isSameDay(component.view(), monthStart)).toBe(true);
    });

    it('does not emit for hidden decorative cells when outside days are hidden', () => {
      fixture.componentRef.setInput('showOutsideDays', false);
      fixture.detectChanges();

      const decorative = fixture.nativeElement.querySelector(
        'span.cld-month__cell[aria-hidden="true"]',
      ) as HTMLElement;
      expect(decorative).not.toBeNull();

      const emitted: CalendulumDayClickEvent[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));
      decorative.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(emitted.length).toBe(0);
      expect(component.value()).toBeNull();
    });
  });

  describe('dayStyle', () => {
    function dayInView(day: number): Date {
      const view = component.view();
      return new Date(view.getFullYear(), view.getMonth(), day);
    }

    function dayButton(day: number): HTMLButtonElement {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cld-month__day',
      ) as NodeListOf<HTMLButtonElement>;
      const match = Array.from(buttons).find((b) => Number(b.textContent!.trim()) === day);
      expect(match).toBeDefined();
      return match!;
    }

    it('applies the entry via --cld-day-* custom properties to that day only', () => {
      fixture.componentRef.setInput('dayStyle', {
        [dateKey(dayInView(15))]: {
          background: 'pink',
          color: 'red',
          border: '1px solid blue',
        },
      });
      fixture.detectChanges();

      const styled = dayButton(15);
      expect(styled.style.getPropertyValue('--cld-day-bg')).toBe('pink');
      expect(styled.style.getPropertyValue('--cld-day-color')).toBe('red');
      expect(styled.style.getPropertyValue('--cld-day-border')).toBe('1px solid blue');
      expect(styled.style.background).toBe('');

      const untouched = dayButton(16);
      expect(untouched.style.getPropertyValue('--cld-day-bg')).toBe('');
    });

    it('keeps the selected state background while the entry border still applies', () => {
      component.value.set(dayInView(15));
      fixture.componentRef.setInput('dayStyle', {
        [dateKey(dayInView(15))]: { background: 'pink', border: '2px solid red' },
      });
      fixture.detectChanges();

      const selected = dayButton(15);
      expect(selected.classList.contains('cld-month__day--selected')).toBe(true);
      expect(selected.style.getPropertyValue('--cld-day-bg')).toBe('pink');
      expect(selected.style.getPropertyValue('--cld-day-border')).toBe('2px solid red');
      // The entry background must not be written inline: the state class
      // rule wins via the cascade (jsdom cannot resolve var() — documented proxy).
      expect(selected.style.background).toBe('');
    });

    it('merges the consumer class with the state classes', () => {
      component.value.set(dayInView(15));
      fixture.componentRef.setInput('dayStyle', {
        [dateKey(dayInView(15))]: { class: 'hl', background: 'pink' },
      });
      fixture.detectChanges();

      const selected = dayButton(15);
      expect(selected.classList.contains('cld-month__day--selected')).toBe(true);
      expect(selected.classList.contains('hl')).toBe(true);
    });

    it('leaves days absent from the record unmodified', () => {
      fixture.componentRef.setInput('dayStyle', {
        [dateKey(dayInView(15))]: { background: 'pink' },
      });
      fixture.detectChanges();

      const untouched = dayButton(20);
      expect(untouched.style.getPropertyValue('--cld-day-bg')).toBe('');
      expect(untouched.classList.contains('hl')).toBe(false);
    });
  });

  describe('disabled days', () => {
    function dayInView(day: number): Date {
      const view = component.view();
      return new Date(view.getFullYear(), view.getMonth(), day);
    }

    function dayButton(day: number): HTMLButtonElement {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cld-month__day',
      ) as NodeListOf<HTMLButtonElement>;
      const match = Array.from(buttons).find((b) => Number(b.textContent!.trim()) === day);
      expect(match).toBeDefined();
      return match!;
    }

    it('keeps every cell enabled when the predicate is unset', () => {
      expect(fixture.nativeElement.querySelectorAll('button.cld-month__day--disabled').length).toBe(
        0,
      );
    });

    it('resolves the disabled state only for dates the predicate rejects', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => d.getDate() === 15);
      fixture.detectChanges();

      const disabledButtons = fixture.nativeElement.querySelectorAll(
        'button.cld-month__day--disabled',
      );
      expect(disabledButtons.length).toBe(1);
      expect(Number(disabledButtons[0].textContent!.trim())).toBe(15);
      expect(dayButton(16).classList.contains('cld-month__day--disabled')).toBe(false);
    });

    it('blocks dayClick and selection on the disabled day', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => d.getDate() === 15);
      fixture.detectChanges();

      const emitted: CalendulumDayClickEvent[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));

      dayButton(15).click();
      fixture.detectChanges();

      expect(emitted.length).toBe(0);
      expect(component.value()).toBeNull();
    });

    it('still emits and selects on an enabled day next to a disabled one', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => d.getDate() === 15);
      fixture.detectChanges();

      const emitted: CalendulumDayClickEvent[] = [];
      component.dayClick.subscribe((e) => emitted.push(e));

      dayButton(16).click();
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(isSameDay(component.value()!, dayInView(16))).toBe(true);
    });

    it('select() sets value on a disabled date without consulting the predicate', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => d.getDate() === 15);
      fixture.detectChanges();

      component.select(dayInView(15));
      fixture.detectChanges();

      expect(isSameDay(component.value()!, dayInView(15))).toBe(true);
    });

    it('goToToday still selects today when today is disabled', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => isSameDay(d, new Date()));
      fixture.detectChanges();

      component.goToToday();
      fixture.detectChanges();

      expect(isSameDay(component.value()!, new Date())).toBe(true);
    });

    it('keeps the today visuals on a disabled today cell', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => isSameDay(d, new Date()));
      fixture.detectChanges();

      const today = fixture.nativeElement.querySelector(
        'button.cld-month__day--today',
      ) as HTMLButtonElement | null;
      expect(today).not.toBeNull();
      expect(today!.classList.contains('cld-month__day--disabled')).toBe(true);
    });

    it('marks only the disabled button aria-disabled, without native disabled', () => {
      fixture.componentRef.setInput('isDayDisabled', (d: Date) => d.getDate() === 15);
      fixture.detectChanges();

      const disabled = dayButton(15);
      expect(disabled.getAttribute('aria-disabled')).toBe('true');
      expect(disabled.hasAttribute('disabled')).toBe(false);

      const enabled = dayButton(16);
      expect(enabled.getAttribute('aria-disabled')).toBeNull();
      expect(enabled.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('visible days', () => {
    /** Oracle: the filtered grid dates the component SHOULD render. */
    function expectedDates(): Date[] {
      const grid = buildMonthGrid(component.view(), component.firstDayOfWeek());
      const visible = resolveVisibleWeekdays(component.visibleDays());
      return grid.filter((c) => visible.has(c.date.getDay())).map((c) => c.date);
    }

    /** Oracle: the header labels the component SHOULD render, in order. */
    function expectedHeaders(): string[] {
      const labels = weekdayLabels('en-US', component.firstDayOfWeek());
      const visible = resolveVisibleWeekdays(component.visibleDays());
      return labels.filter((_, i) => visible.has((i + component.firstDayOfWeek()) % 7));
    }

    function renderedButtons(): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll(
          'button.cld-month__day',
        ) as NodeListOf<HTMLButtonElement>,
      );
    }

    function renderedHeaders(): HTMLElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('.cld-month__weekday') as NodeListOf<HTMLElement>,
      );
    }

    /** Asserts the component matches the oracle, then returns the weekday set. */
    function assertGridMatchesOracle(): number[] {
      const buttons = renderedButtons();
      const expected = expectedDates();
      expect(buttons.length).toBe(expected.length);
      buttons.forEach((button, i) => {
        expect(Number(button.textContent!.trim())).toBe(expected[i].getDate());
      });
      return expected.map((d) => d.getDay());
    }

    it('renders 30 Mon–Fri cells for mondayToFriday', () => {
      fixture.componentRef.setInput('visibleDays', 'mondayToFriday');
      fixture.detectChanges();

      const weekdays = assertGridMatchesOracle();
      expect(weekdays.length).toBe(30);
      expect(weekdays.every((w) => w >= 1 && w <= 5)).toBe(true);
      expect(weekdays.filter((w) => w === 1).length).toBe(6);
    });

    it('renders 36 cells for mondayToSaturday', () => {
      fixture.componentRef.setInput('visibleDays', 'mondayToSaturday');
      fixture.detectChanges();

      expect(assertGridMatchesOracle().length).toBe(36);
    });

    it('renders 42 cells for the all default', () => {
      const weekdays = assertGridMatchesOracle();
      expect(weekdays.length).toBe(42);
    });

    it('filters headers to the same set with matching order', () => {
      fixture.componentRef.setInput('visibleDays', 'mondayToFriday');
      fixture.detectChanges();

      const headers = renderedHeaders();
      const expected = expectedHeaders();
      expect(headers.length).toBe(5);
      headers.forEach((header, i) => expect(header.textContent).toContain(expected[i]));
    });

    it('renders weekends only for [6, 0] and [0, 6] alike', () => {
      fixture.componentRef.setInput('visibleDays', [6, 0]);
      fixture.detectChanges();
      const ascending = assertGridMatchesOracle();
      expect(ascending.length).toBe(12);
      expect(ascending.every((w) => w === 0 || w === 6)).toBe(true);

      fixture.componentRef.setInput('visibleDays', [0, 6]);
      fixture.detectChanges();
      const reversed = assertGridMatchesOracle();
      expect(reversed.length).toBe(12);
      expect(reversed.every((w) => w === 0 || w === 6)).toBe(true);
    });

    it('cleans out-of-range and duplicate entries down to one column', () => {
      fixture.componentRef.setInput('visibleDays', [
        1, 1, 9, -2,
      ] as unknown as CalendulumVisibleDays);
      fixture.detectChanges();

      expect(assertGridMatchesOracle().length).toBe(6);
      expect(renderedHeaders().length).toBe(1);
    });

    it('falls back to all for an empty array', () => {
      fixture.componentRef.setInput('visibleDays', []);
      fixture.detectChanges();

      expect(assertGridMatchesOracle().length).toBe(42);
      expect(renderedHeaders().length).toBe(7);
    });

    it('firstDayOfWeek=0 with mondayToSaturday omits Sunday', () => {
      fixture.componentRef.setInput('firstDayOfWeek', 0);
      fixture.componentRef.setInput('visibleDays', 'mondayToSaturday');
      fixture.detectChanges();

      expect(assertGridMatchesOracle().length).toBe(36);
      const headers = renderedHeaders();
      expect(headers.length).toBe(6);
      const monday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
        new Date(2024, 0, 1),
      );
      const sunday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
        new Date(2024, 0, 7),
      );
      expect(headers[0].textContent).toContain(monday);
      expect(headers.some((h) => h.textContent!.includes(sunday))).toBe(false);
    });

    it('binds the resolved column count as --cld-week-columns on the section', () => {
      const section = fixture.nativeElement.querySelector('section.cld-month') as HTMLElement;

      fixture.componentRef.setInput('visibleDays', 'mondayToFriday');
      fixture.detectChanges();
      expect(section.style.getPropertyValue('--cld-week-columns')).toBe('5');

      fixture.componentRef.setInput('visibleDays', 'mondayToSaturday');
      fixture.detectChanges();
      expect(section.style.getPropertyValue('--cld-week-columns')).toBe('6');

      fixture.componentRef.setInput('visibleDays', 'all');
      fixture.detectChanges();
      expect(section.style.getPropertyValue('--cld-week-columns')).toBe('7');
    });

    it('keeps value on a hidden weekday without rendering a selected cell', () => {
      fixture.componentRef.setInput('visibleDays', 'mondayToFriday');
      fixture.detectChanges();

      const view = component.view();
      const saturday = new Date(view.getFullYear(), view.getMonth(), 1);
      while (saturday.getDay() !== 6) {
        saturday.setDate(saturday.getDate() + 1);
      }
      component.value.set(saturday);
      fixture.detectChanges();

      expect(isSameDay(component.value()!, saturday)).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('button.cld-month__day--selected').length).toBe(
        0,
      );
    });

    it('leaves navigation unchanged', () => {
      fixture.componentRef.setInput('visibleDays', 'mondayToFriday');
      fixture.detectChanges();

      const emitted: Date[] = [];
      component.monthChange.subscribe((d) => emitted.push(d));

      const navButtons = fixture.nativeElement.querySelectorAll('button.cld-month__nav');
      navButtons[1].click(); // next
      fixture.detectChanges();

      const monthStart = startOfMonth(new Date());
      const expected = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      expect(monthTitle('en-US', component.view())).toBe(monthTitle('en-US', expected));
      expect(emitted.length).toBe(1);
      expect(assertGridMatchesOracle().length).toBe(30);
    });
  });
});

describe('CalendulumMonth with custom dayCell', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCell]="cell" />
      <ng-template #cell let-day>
        <span class="custom-cell">{{ day.date.getDate() }}</span>
      </ng-template>
    `,
  })
  class Host {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
  }

  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the custom template for every cell and no default buttons', () => {
    const customCells = fixture.nativeElement.querySelectorAll('.custom-cell');
    expect(customCells.length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('button.cld-month__day').length).toBe(0);
  });

  it('passes the DayCell as the implicit context', () => {
    const first = fixture.nativeElement.querySelector('.custom-cell');
    expect(Number(first!.textContent!.trim())).toBeGreaterThan(0);
    expect(Number(first!.textContent!.trim())).toBeLessThanOrEqual(31);
  });
});

describe('CalendulumMonth custom dayCell interaction parity', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCell]="cell" />
      <ng-template #cell let-day>
        <span class="custom-cell">{{ day.date.getDate() }}</span>
      </ng-template>
    `,
  })
  class InteractionHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
  }

  let fixture: ComponentFixture<InteractionHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InteractionHost] }).compileComponents();
    fixture = TestBed.createComponent(InteractionHost);
    fixture.detectChanges();
  });

  function wrapperByDay(day: number): HTMLElement {
    const wrappers = Array.from(
      fixture.nativeElement.querySelectorAll('.cld-month__cell'),
    ) as HTMLElement[];
    const match = wrappers.find(
      (w) => Number(w.querySelector('.custom-cell')?.textContent?.trim()) === day,
    );
    expect(match).toBeDefined();
    return match!;
  }

  it('exposes button semantics on the cell wrapper', () => {
    const wrapper = wrapperByDay(15);
    expect(wrapper.getAttribute('role')).toBe('button');
    expect(wrapper.getAttribute('tabindex')).toBe('0');
  });

  it('emits dayClick with viewport coordinates and selects on click', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    wrapperByDay(15).dispatchEvent(
      new MouseEvent('click', { clientX: 55, clientY: 99, bubbles: true }),
    );
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].x).toBe(55);
    expect(emitted[0].y).toBe(99);
    const view = fixture.componentInstance.month.view();
    expect(isSameDay(emitted[0].date, new Date(view.getFullYear(), view.getMonth(), 15))).toBe(
      true,
    );
    expect(fixture.componentInstance.month.value()).not.toBeNull();
  });

  it('emits {date, x: 0, y: 0} and selects on Enter', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    wrapperByDay(15).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect([emitted[0].x, emitted[0].y]).toEqual([0, 0]);
    expect(fixture.componentInstance.month.value()).not.toBeNull();
  });

  it('emits {date, x: 0, y: 0} and selects on Space', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    wrapperByDay(20).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect([emitted[0].x, emitted[0].y]).toEqual([0, 0]);
    expect(fixture.componentInstance.month.value()).not.toBeNull();
  });
});

describe('CalendulumMonth disabled custom dayCell', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCell]="cell" [isDayDisabled]="disabled" />
      <ng-template #cell let-day>
        <span class="custom-cell">{{ day.date.getDate() }}{{ day.isDisabled ? '-D' : '' }}</span>
      </ng-template>
    `,
  })
  class DisabledHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
    disabled = (d: Date) => d.getDate() === 15;
  }

  let fixture: ComponentFixture<DisabledHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DisabledHost] }).compileComponents();
    fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
  });

  function dayWrapper(day: number): HTMLElement {
    const wrappers = Array.from(
      fixture.nativeElement.querySelectorAll('.cld-month__cell'),
    ) as HTMLElement[];
    const match = wrappers.find((w) => {
      const text = w.querySelector('.custom-cell')?.textContent?.trim() ?? '';
      return Number(text.replace('-D', '')) === day;
    });
    expect(match).toBeDefined();
    return match!;
  }

  it('exposes isDisabled in the context only for the rejected date', () => {
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('.custom-cell') as NodeListOf<HTMLElement>,
    );
    const marked = cells.filter((c) => c.textContent!.includes('-D'));
    expect(marked.length).toBe(1);
    expect(Number(marked[0].textContent!.trim().replace('-D', ''))).toBe(15);
  });

  it('blocks Enter and Space on the disabled wrapper', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    const wrapper = dayWrapper(15);
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(0);
    expect(fixture.componentInstance.month.value()).toBeNull();
  });

  it('still activates enabled wrappers while the predicate is set', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    dayWrapper(16).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(fixture.componentInstance.month.value()).not.toBeNull();
  });

  it('marks the disabled wrapper aria-disabled and keeps it focusable', () => {
    const disabled = dayWrapper(15);
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('tabindex')).toBe('0');

    const enabled = dayWrapper(16);
    expect(enabled.getAttribute('aria-disabled')).toBeNull();
    expect(enabled.getAttribute('tabindex')).toBe('0');
  });
});

describe('CalendulumMonth day context flags', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCell]="cell" />
      <ng-template #cell let-day>
        <span class="flag-cell">
          {{ day.date.getDate() }}-{{ day.isToday ? 'T' : 'F' }}-{{ day.isSelected ? 'S' : 'N' }}
        </span>
      </ng-template>
    `,
  })
  class FlagHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
  }

  let fixture: ComponentFixture<FlagHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FlagHost] }).compileComponents();
    fixture = TestBed.createComponent(FlagHost);
    fixture.detectChanges();
  });

  function flagCells(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.flag-cell')) as HTMLElement[];
  }

  function dayNumberOf(cell: HTMLElement): number {
    return Number(cell.textContent!.split('-')[0]);
  }

  it('reports day.isToday true for today only', () => {
    const todays = flagCells().filter((c) => c.textContent!.includes('-T-'));
    expect(todays.length).toBe(1);
    expect(dayNumberOf(todays[0])).toBe(new Date().getDate());
  });

  it('reports day.isSelected only for the value-model day', () => {
    const target = new Date(new Date().getFullYear(), new Date().getMonth(), 15);
    fixture.componentInstance.month.value.set(target);
    fixture.detectChanges();

    const selected = flagCells().filter((c) => c.textContent!.includes('-S'));
    expect(selected.length).toBe(1);
    expect(dayNumberOf(selected[0])).toBe(15);
  });

  it('flips isSelected flags when the selection changes', () => {
    const month = fixture.componentInstance.month;
    const year = new Date().getFullYear();
    const monthIndex = new Date().getMonth();

    month.value.set(new Date(year, monthIndex, 15));
    fixture.detectChanges();
    let selected = flagCells().filter((c) => c.textContent!.includes('-S'));
    expect(selected.length).toBe(1);
    expect(dayNumberOf(selected[0])).toBe(15);

    month.value.set(new Date(year, monthIndex, 20));
    fixture.detectChanges();
    selected = flagCells().filter((c) => c.textContent!.includes('-S'));
    expect(selected.length).toBe(1);
    expect(dayNumberOf(selected[0])).toBe(20);
  });
});

describe('CalendulumMonth with dayCellTop/dayCellBottom slots', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCellTop]="top" [dayCellBottom]="bottom" [dayStyle]="styles()" />
      <ng-template #top let-day>
        <span class="top-slot">{{ day.date.getDate() }}</span>
      </ng-template>
      <ng-template #bottom let-day>
        <span class="bottom-slot">{{ day.isToday ? 'T' : '' }}</span>
      </ng-template>
    `,
  })
  class SlotsHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
    styles = signal<Record<string, DayStyle>>({});
  }

  let fixture: ComponentFixture<SlotsHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SlotsHost] }).compileComponents();
    fixture = TestBed.createComponent(SlotsHost);
    fixture.detectChanges();
  });

  function dayButtonByNumber(day: number): HTMLButtonElement {
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cld-month__day',
    ) as NodeListOf<HTMLButtonElement>;
    const match = Array.from(buttons).find((b) => {
      const numberText = Array.from(b.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim();
      return Number(numberText) === day;
    });
    expect(match).toBeDefined();
    return match!;
  }

  it('renders slot wrappers in every day cell, top above the number and bottom below', () => {
    const wrappers = fixture.nativeElement.querySelectorAll(
      '.cld-month__day-top, .cld-month__day-bottom',
    );
    expect(wrappers.length).toBe(84);

    const firstButton = fixture.nativeElement.querySelector('button.cld-month__day');
    const top = firstButton.querySelector('.cld-month__day-top');
    const bottom = firstButton.querySelector('.cld-month__day-bottom');
    expect(top).not.toBeNull();
    expect(bottom).not.toBeNull();
    // Structural proxy for "above/below" (jsdom cannot compute layout):
    // the number text node sits between the top and bottom wrappers, and the
    // wrappers are absolutely positioned (SCSS) so the number never shifts.
    // Element nodes only — Angular inserts comment markers for control flow.
    const elements = (Array.from(firstButton.childNodes) as Node[]).filter(
      (node) => node.nodeType === Node.ELEMENT_NODE,
    );
    expect(elements[0]).toBe(top);
    expect(elements[elements.length - 1]).toBe(bottom);
  });

  it('passes the flat context flags to slot templates', () => {
    const bottoms = Array.from(
      fixture.nativeElement.querySelectorAll('.bottom-slot'),
    ) as HTMLElement[];
    expect(bottoms.length).toBe(42);
    const todays = bottoms.filter((s) => s.textContent === 'T');
    expect(todays.length).toBe(1);
  });

  it('activates the day when slot content is clicked (click bubbles to the button)', () => {
    const emitted: CalendulumDayClickEvent[] = [];
    fixture.componentInstance.month.dayClick.subscribe((e) => emitted.push(e));

    const viewStart = startOfMonth(fixture.componentInstance.month.view());
    const offset = (viewStart.getDay() - 1 + 7) % 7;
    const firstCell = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1 - offset);

    const firstTop = fixture.nativeElement.querySelector('.top-slot');
    firstTop.dispatchEvent(new MouseEvent('click', { clientX: 45, clientY: 60, bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(isSameDay(emitted[0].date, firstCell)).toBe(true);
    expect(isSameDay(fixture.componentInstance.month.value()!, firstCell)).toBe(true);
  });

  it('keeps dayStyle entries on cells that render slot content', () => {
    const view = fixture.componentInstance.month.view();
    const key = dateKey(new Date(view.getFullYear(), view.getMonth(), 15));
    fixture.componentInstance.styles.set({ [key]: { background: 'pink' } });
    fixture.detectChanges();

    const styled = dayButtonByNumber(15);
    expect(styled.style.getPropertyValue('--cld-day-bg')).toBe('pink');
    expect(styled.querySelector('.cld-month__day-top')).not.toBeNull();
  });
});

describe('CalendulumMonth dayCellBottom slot exposes isDisabled', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCellBottom]="bottom" [isDayDisabled]="disabled" />
      <ng-template #bottom let-day>
        <span class="bottom-slot">{{ day.isDisabled ? 'D' : '' }}</span>
      </ng-template>
    `,
  })
  class DisabledSlotHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
    disabled = (d: Date) => d.getDate() === 15;
  }

  let fixture: ComponentFixture<DisabledSlotHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DisabledSlotHost] }).compileComponents();
    fixture = TestBed.createComponent(DisabledSlotHost);
    fixture.detectChanges();
  });

  it('renders the disabled mark in the bottom slot only for the disabled day', () => {
    const bottoms = Array.from(
      fixture.nativeElement.querySelectorAll('.bottom-slot'),
    ) as HTMLElement[];
    expect(bottoms.length).toBe(42);

    const marked = bottoms.filter((s) => s.textContent === 'D');
    expect(marked.length).toBe(1);

    const button = marked[0].closest('button.cld-month__day') as HTMLButtonElement;
    const dayNumber = Array.from(button.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join('')
      .trim();
    expect(Number(dayNumber)).toBe(15);
  });
});

describe('CalendulumMonth with dayCell alongside slots', () => {
  @Component({
    imports: [CalendulumMonth],
    template: `
      <calendulum-month [dayCell]="cell" [dayCellTop]="top" [dayCellBottom]="bottom" />
      <ng-template #cell let-day>
        <span class="custom-cell">{{ day.date.getDate() }}</span>
      </ng-template>
      <ng-template #top let-day><span class="top-slot">T</span></ng-template>
      <ng-template #bottom let-day><span class="bottom-slot">B</span></ng-template>
    `,
  })
  class SlotsWithDayCellHost {
    @ViewChild(CalendulumMonth) month!: CalendulumMonth;
  }

  let fixture: ComponentFixture<SlotsWithDayCellHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SlotsWithDayCellHost] }).compileComponents();
    fixture = TestBed.createComponent(SlotsWithDayCellHost);
    fixture.detectChanges();
  });

  it('renders only the custom dayCell content when dayCell is provided with slots', () => {
    expect(fixture.nativeElement.querySelectorAll('.custom-cell').length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('button.cld-month__day').length).toBe(0);
    expect(
      fixture.nativeElement.querySelectorAll('.cld-month__day-top, .cld-month__day-bottom').length,
    ).toBe(0);
  });
});

describe('resolveDayStyle', () => {
  const record = {
    '2026-09-22': { background: 'pink', color: 'red', border: '1px solid blue' },
  };

  it('maps an entry to --cld-day-* custom properties', () => {
    expect(resolveDayStyle(record, '2026-09-22')).toEqual({
      '--cld-day-bg': 'pink',
      '--cld-day-color': 'red',
      '--cld-day-border': '1px solid blue',
    });
  });

  it('emits only the properties the entry sets', () => {
    expect(resolveDayStyle({ '2026-09-22': { background: 'pink' } }, '2026-09-22')).toEqual({
      '--cld-day-bg': 'pink',
    });
  });

  it('returns an empty record for a day absent from the record', () => {
    expect(resolveDayStyle(record, '2026-09-21')).toEqual({});
  });

  it('excludes the class option from style properties', () => {
    expect(
      resolveDayStyle({ '2026-09-22': { class: 'hl', background: 'pink' } }, '2026-09-22'),
    ).toEqual({
      '--cld-day-bg': 'pink',
    });
  });
});

describe('resolveCellClasses', () => {
  const inMonth: DayCell = { date: new Date(2026, 8, 22), inMonth: true };
  const outside: DayCell = { date: new Date(2026, 7, 31), inMonth: false };

  it('returns the today and selected state classes', () => {
    expect(resolveCellClasses(inMonth, true, true, false, undefined)).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
    ]);
  });

  it('marks outside cells with the outside state class', () => {
    expect(resolveCellClasses(outside, false, false, false, undefined)).toEqual([
      'cld-month__day--outside',
    ]);
  });

  it('appends the consumer class without replacing state classes', () => {
    expect(resolveCellClasses(inMonth, true, true, false, { class: 'hl' })).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
      'hl',
    ]);
  });

  it('spreads array class entries after state classes', () => {
    expect(resolveCellClasses(inMonth, false, true, false, { class: ['a', 'b'] })).toEqual([
      'cld-month__day--selected',
      'a',
      'b',
    ]);
  });

  it('returns no classes for a plain in-month day', () => {
    expect(resolveCellClasses(inMonth, false, false, false, undefined)).toEqual([]);
  });

  it('appends the disabled state class between selected and consumer classes', () => {
    expect(resolveCellClasses(inMonth, false, false, true, undefined)).toEqual([
      'cld-month__day--disabled',
    ]);
  });

  it('combines disabled with today and selected in deterministic order', () => {
    expect(resolveCellClasses(inMonth, true, true, true, undefined)).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
      'cld-month__day--disabled',
    ]);
  });

  it('keeps consumer classes last when disabled combines with selection', () => {
    expect(resolveCellClasses(inMonth, true, true, true, { class: 'hl' })).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
      'cld-month__day--disabled',
      'hl',
    ]);
  });

  it('spreads array class entries after the disabled state class', () => {
    expect(resolveCellClasses(inMonth, false, true, true, { class: ['a', 'b'] })).toEqual([
      'cld-month__day--selected',
      'cld-month__day--disabled',
      'a',
      'b',
    ]);
  });

  it('marks outside disabled cells with both state classes', () => {
    expect(resolveCellClasses(outside, false, false, true, undefined)).toEqual([
      'cld-month__day--outside',
      'cld-month__day--disabled',
    ]);
  });
});
