import {
  CalendulumVisibleDays,
  clampDate,
  dateKey,
  getISOWeek,
  isInRange,
  isSameDay,
  normalizeValue,
  resolveVisibleWeekdays,
} from './date-utils';

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

describe('getISOWeek', () => {
  it('returns week 1 for Thursday Jan 4 (ISO week 1 anchor)', () => {
    // Jan 4 is always in ISO week 1
    expect(getISOWeek(new Date(2026, 0, 4))).toBe(1);
  });

  it('handles year boundary: Dec 31 2025 is week 1 of 2026', () => {
    // Dec 31 2025 is a Wednesday, belongs to week 1 of 2026 (week containing Jan 4 2026)
    expect(getISOWeek(new Date(2025, 11, 31))).toBe(1);
  });

  it('handles year boundary: Jan 1 2026 is week 1 of 2026 (first Thursday)', () => {
    // Jan 1 2026 is a Thursday - the first Thursday of 2026, so week 1
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
  });

  it('handles leap year: Feb 29 2024', () => {
    expect(getISOWeek(new Date(2024, 1, 29))).toBe(9);
  });

  it('known reference: 2026-06-15 is week 25', () => {
    expect(getISOWeek(new Date(2026, 5, 15))).toBe(25);
  });

  it('known reference: 2026-12-31 is week 53', () => {
    expect(getISOWeek(new Date(2026, 11, 31))).toBe(53);
  });

  it('known reference: 2025-12-28 is week 52 of 2025', () => {
    // Dec 28 2025 is the last week of 2025
    expect(getISOWeek(new Date(2025, 11, 28))).toBe(52);
  });
});

describe('clampDate', () => {
  it('returns date unchanged when both bounds are null', () => {
    const date = new Date(2026, 5, 15);
    expect(clampDate(date, null, null)).toBe(date);
  });

  it('clamps to minDate when date is before minDate', () => {
    const date = new Date(2025, 11, 15);
    const min = new Date(2026, 0, 1);
    const result = clampDate(date, min, null);
    expect(isSameDay(result, min)).toBe(true);
  });

  it('clamps to maxDate when date is after maxDate', () => {
    const date = new Date(2027, 0, 15);
    const max = new Date(2026, 11, 31);
    const result = clampDate(date, null, max);
    expect(isSameDay(result, max)).toBe(true);
  });

  it('returns date unchanged when within bounds', () => {
    const date = new Date(2026, 5, 15);
    const min = new Date(2026, 0, 1);
    const max = new Date(2026, 11, 31);
    const result = clampDate(date, min, max);
    expect(isSameDay(result, date)).toBe(true);
  });

  it('inclusive bounds: minDate itself is not clamped', () => {
    const min = new Date(2026, 0, 1);
    const result = clampDate(min, min, null);
    expect(isSameDay(result, min)).toBe(true);
  });

  it('inclusive bounds: maxDate itself is not clamped', () => {
    const max = new Date(2026, 11, 31);
    const result = clampDate(max, null, max);
    expect(isSameDay(result, max)).toBe(true);
  });

  it('handles minDate after maxDate gracefully (returns minDate)', () => {
    const date = new Date(2026, 5, 15);
    const min = new Date(2026, 11, 31);
    const max = new Date(2026, 0, 1);
    const result = clampDate(date, min, max);
    // When min > max, clamp to min as the more restrictive bound
    expect(isSameDay(result, min)).toBe(true);
  });
});

describe('normalizeValue', () => {
  describe('single mode', () => {
    it('passes Date through unchanged', () => {
      const date = new Date(2026, 5, 15);
      const result = normalizeValue(date, 'single');
      expect(isSameDay(result as Date, date)).toBe(true);
    });

    it('passes null through unchanged', () => {
      const result = normalizeValue(null, 'single');
      expect(result).toBeNull();
    });

    it('wraps Date in array when mode is multiple (triangulation)', () => {
      const date = new Date(2026, 5, 15);
      const result = normalizeValue(date, 'multiple');
      expect(Array.isArray(result)).toBe(true);
      expect((result as Date[]).length).toBe(1);
      expect(isSameDay((result as Date[])[0], date)).toBe(true);
    });
  });

  describe('multiple mode', () => {
    it('wraps single Date in array', () => {
      const date = new Date(2026, 5, 15);
      const result = normalizeValue(date, 'multiple');
      expect(Array.isArray(result)).toBe(true);
      expect((result as Date[]).length).toBe(1);
    });

    it('passes Date array through unchanged', () => {
      const dates = [new Date(2026, 5, 15), new Date(2026, 5, 20)];
      const result = normalizeValue(dates, 'multiple');
      expect(result).toEqual(dates);
    });

    it('normalizes null to empty array', () => {
      const result = normalizeValue(null, 'multiple');
      expect(result).toEqual([]);
    });
  });

  describe('range mode', () => {
    it('wraps single Date as {start: date, end: null}', () => {
      const date = new Date(2026, 5, 15);
      const result = normalizeValue(date, 'range');
      expect(result).toEqual({ start: date, end: null });
    });

    it('passes range object through unchanged', () => {
      const range = { start: new Date(2026, 5, 15), end: new Date(2026, 5, 20) };
      const result = normalizeValue(range, 'range');
      expect(result).toEqual(range);
    });

    it('completes partial range (start only)', () => {
      const partial = { start: new Date(2026, 5, 15), end: null };
      const result = normalizeValue(partial, 'range');
      expect(result).toEqual({ start: new Date(2026, 5, 15), end: null });
    });

    it('normalizes null to {start: null, end: null}', () => {
      const result = normalizeValue(null, 'range');
      expect(result).toEqual({ start: null, end: null });
    });

    it('auto-reorders when end < start (end becomes start, start becomes end)', () => {
      const range = { start: new Date(2026, 5, 20), end: new Date(2026, 5, 15) };
      const result = normalizeValue(range, 'range');
      expect(isSameDay((result as { start: Date; end: Date }).start, new Date(2026, 5, 15))).toBe(
        true,
      );
      expect(isSameDay((result as { start: Date; end: Date }).end, new Date(2026, 5, 20))).toBe(
        true,
      );
    });
  });
});

describe('isInRange', () => {
  it('returns false when both bounds are null', () => {
    expect(isInRange(new Date(2026, 5, 15), null, null)).toBe(false);
  });

  it('returns true when date equals start', () => {
    const start = new Date(2026, 5, 15);
    const end = new Date(2026, 5, 20);
    expect(isInRange(start, start, end)).toBe(true);
  });

  it('returns true when date equals end', () => {
    const start = new Date(2026, 5, 15);
    const end = new Date(2026, 5, 20);
    expect(isInRange(end, start, end)).toBe(true);
  });

  it('returns true when date is between start and end', () => {
    const start = new Date(2026, 5, 15);
    const end = new Date(2026, 5, 20);
    expect(isInRange(new Date(2026, 5, 18), start, end)).toBe(true);
  });

  it('returns false when date is before start', () => {
    const start = new Date(2026, 5, 15);
    const end = new Date(2026, 5, 20);
    expect(isInRange(new Date(2026, 5, 10), start, end)).toBe(false);
  });

  it('returns false when date is after end', () => {
    const start = new Date(2026, 5, 15);
    const end = new Date(2026, 5, 20);
    expect(isInRange(new Date(2026, 5, 25), start, end)).toBe(false);
  });

  it('single-point range (start === end): only that date is in range', () => {
    const date = new Date(2026, 5, 15);
    expect(isInRange(date, date, date)).toBe(true);
    expect(isInRange(new Date(2026, 5, 14), date, date)).toBe(false);
    expect(isInRange(new Date(2026, 5, 16), date, date)).toBe(false);
  });

  it('handles null start (unbounded start)', () => {
    const end = new Date(2026, 5, 20);
    expect(isInRange(new Date(2026, 5, 15), null, end)).toBe(true);
    expect(isInRange(new Date(2026, 5, 25), null, end)).toBe(false);
  });

  it('handles null end (unbounded end)', () => {
    const start = new Date(2026, 5, 15);
    expect(isInRange(new Date(2026, 5, 20), start, null)).toBe(true);
    expect(isInRange(new Date(2026, 5, 10), start, null)).toBe(false);
  });
});
