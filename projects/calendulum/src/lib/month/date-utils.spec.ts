import { CalendulumVisibleDays, dateKey, resolveVisibleWeekdays } from './date-utils';

describe('dateKey', () => {
  it('zero-pads single-digit month and day', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('keeps the local calendar day at 23:30 local time', () => {
    expect(dateKey(new Date(2026, 8, 22, 23, 30))).toBe('2026-09-22');
  });

  it('never follows toISOString into the UTC-shifted day', () => {
    const date = new Date(2026, 8, 22, 23, 30);
    const localKey = '2026-09-22';
    const utcKey = date.toISOString().slice(0, 10);

    // Where the UTC day differs from the local day, dateKey must stay local.
    if (utcKey !== localKey) {
      expect(dateKey(date)).not.toBe(utcKey);
    }
    expect(dateKey(date)).toBe(localKey);
  });

  it('formats the last day of the year (triangulation)', () => {
    expect(dateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('resolveVisibleWeekdays', () => {
  it('expands the all preset to every weekday', () => {
    expect(resolveVisibleWeekdays('all')).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });

  it('expands mondayToFriday to {1, 2, 3, 4, 5}', () => {
    expect(resolveVisibleWeekdays('mondayToFriday')).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('expands mondayToSaturday to {1, 2, 3, 4, 5, 6}', () => {
    expect(resolveVisibleWeekdays('mondayToSaturday')).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('keeps weekends only for [6, 0] and sorts them ascending', () => {
    expect([...resolveVisibleWeekdays([6, 0])]).toEqual([0, 6]);
    expect([...resolveVisibleWeekdays([0, 6])]).toEqual([0, 6]);
  });

  it('drops duplicates and out-of-range numbers', () => {
    const dirty = [1, 1, 9, -2] as unknown as CalendulumVisibleDays;
    expect([...resolveVisibleWeekdays(dirty)]).toEqual([1]);
  });

  it('falls back to all for an empty array', () => {
    expect(resolveVisibleWeekdays([])).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });

  it('falls back to all for an unknown literal', () => {
    expect(resolveVisibleWeekdays('weekendsOnly' as CalendulumVisibleDays)).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6]),
    );
  });
});
