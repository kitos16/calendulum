import { ComponentFixture, TestBed } from '@angular/core/testing';

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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
