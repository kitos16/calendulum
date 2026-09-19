import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { isSameDay, monthTitle, startOfMonth } from '../date-utils';
import { CalendulumMonth } from './calendulum-month';

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