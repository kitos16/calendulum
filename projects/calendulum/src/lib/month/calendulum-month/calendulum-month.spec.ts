import { Component, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayCell, dateKey, isSameDay, monthTitle, startOfMonth } from '../date-utils';
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
    expect(resolveCellClasses(inMonth, true, true, undefined)).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
    ]);
  });

  it('marks outside cells with the outside state class', () => {
    expect(resolveCellClasses(outside, false, false, undefined)).toEqual([
      'cld-month__day--outside',
    ]);
  });

  it('appends the consumer class without replacing state classes', () => {
    expect(resolveCellClasses(inMonth, true, true, { class: 'hl' })).toEqual([
      'cld-month__day--today',
      'cld-month__day--selected',
      'hl',
    ]);
  });

  it('spreads array class entries after state classes', () => {
    expect(resolveCellClasses(inMonth, false, true, { class: ['a', 'b'] })).toEqual([
      'cld-month__day--selected',
      'a',
      'b',
    ]);
  });

  it('returns no classes for a plain in-month day', () => {
    expect(resolveCellClasses(inMonth, false, false, undefined)).toEqual([]);
  });
});
