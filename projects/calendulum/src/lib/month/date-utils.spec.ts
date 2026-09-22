import { dateKey } from './date-utils';

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
