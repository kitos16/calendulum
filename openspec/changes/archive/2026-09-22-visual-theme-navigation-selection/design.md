# Design: Visual Theme + Extended Navigation + Selection

## Technical Approach

This design implements three cohesive feature areas as a single PR: **visual theming inputs** (fontSize, density, cornerRadius), **extended navigation** (minDate/maxDate bounds with clamping, monthSelector dropdown/arrows/none), and **selection modes** (single/multiple/range with discriminated union value, weekNumbers ISO column). All changes preserve backward compatibility — default `selectionMode='single'` accepts `Date | null` unchanged.

The approach follows existing patterns: discrete `input()` signals for configuration, CSS custom property multipliers for visual scaling, pure utility functions in `date-utils.ts` for logic, and computed signals for derived state. Selection behavior is implemented as methods on the component with `selectionMode` controlling the `value` model normalization.

## Architecture Decisions

### Decision: Value Type — Simple Union with selectionMode Discriminant

| Option                                                                        | Tradeoff                                                                          | Decision   |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| Discriminated union `{mode, value}`                                           | Explicit, self-documenting; requires migration for existing consumers             | Rejected   |
| Simple union `Date \| null \| Date[] \| {start, end}` + `selectionMode` input | Backward compatible; `selectionMode` default `'single'` narrows to `Date \| null` | **Chosen** |

**Rationale**: The simple union with `selectionMode` as external discriminant keeps existing `[(value)]="date"` bindings working without any code change. TypeScript narrows correctly when `selectionMode` is explicitly typed. Model input normalizes on set (e.g., single Date → `[date]` in multiple mode).

### Decision: Bounds Semantics — Inclusive Absolute Limits

| Option                                                              | Tradeoff                                                               | Decision   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| Bounds apply after weekday filter                                   | Simpler but inconsistent — bounds would "disappear" when days filtered | Rejected   |
| Bounds are absolute calendar limits, weekday filter projects within | Clear mental model; bounds always respected regardless of view         | **Chosen** |

**Rationale**: `minDate`/`maxDate` are hard calendar boundaries. `visibleDays` is a column projection. Cells outside bounds are disabled via merged `isDisabled` logic (OR with `isDayDisabled`). Navigation buttons disable when view month would exceed bounds.

### Decision: Month Selector — Native `<select>` for Accessibility

| Option                                                                                | Tradeoff                                                               | Decision   |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| Custom dropdown with full theming                                                     | Matches component aesthetic; complex a11y (ARIA, keyboard, focus mgmt) | Rejected   |
| Native `<select>` styled via `--cld-font`, `--cld-radius`, `--cld-bg`, `--cld-border` | Built-in a11y; sufficient styling via existing CSS vars                | **Chosen** |

**Rationale**: Native `<select>` provides keyboard navigation, screen reader support, and focus management for free. Options filtered to months within bounds (or all 12). Binds to `view` signal; emits `monthChange` on selection.

### Decision: Selection Modes — Behavior Controlled by selectionMode

| Mode         | Value Shape                                | Click Behavior                                               |
| ------------ | ------------------------------------------ | ------------------------------------------------------------ |
| `'single'`   | `Date \| null`                             | Click selects; re-click clears                               |
| `'multiple'` | `Date[]`                                   | Click toggles; order = selection order                       |
| `'range'`    | `{start: Date \| null, end: Date \| null}` | 1st click = start, 2nd = end (auto-reorder), 3rd = new start |

**Rationale**: Clear separation of concerns. Range auto-reorders if `end < start`. `isInRange`, `isRangeStart`, `isRangeEnd` flags added to context for template rendering.

### Decision: CSS Custom Properties — Single Multiplier Per Visual Input

| Input          | CSS Var                      | Multiplier Values                                          | Affected Properties                                              |
| -------------- | ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `fontSize`     | `--cld-font-size-multiplier` | `sm: 0.875`, `md: 1`, `lg: 1.125`                          | Root `font-size` (cascades to all text)                          |
| `density`      | `--cld-density-multiplier`   | `compact: 0.75`, `cozy: 1`, `spacious: 1.375`              | `--cld-padding`, `--cld-gap`, `--cld-header-height` via `calc()` |
| `cornerRadius` | `--cld-radius-override`      | `sm: 0.25rem`, `md: 0.5rem`, `lg: 0.75rem`, `full: 9999px` | Direct assignment to `--cld-radius`                              |

**Rationale**: Single multiplier per input minimizes CSS var count. Density consolidates padding/gap/height into one multiplier. No new keyframes. Budget impact estimated < 300B.

### Decision: Week Numbers — Prepend Column, Update `--cld-week-columns`

| Aspect       | Implementation                                                              |
| ------------ | --------------------------------------------------------------------------- |
| Grid columns | 7 weekdays + 1 week number = 8 (or 5+1, 6+1 for filtered)                   |
| CSS var      | `--cld-week-columns` = `columnCount() + (weekNumbers() ? 1 : 0)`            |
| Header       | First cell shows "Wk"                                                       |
| Context      | Week number cells get `weekNumber: N`; regular cells get `weekNumber: null` |

**Rationale**: ISO week numbers (1-53) computed per row via `getISOWeek()` utility. Grid template columns auto-adjust via CSS var.

## Data Flow

```
User Input (value, selectionMode, minDate, maxDate)
         │
         ▼
┌─────────────────────────────────────┐
│ Model Input Interceptor (value.set) │
│  - Normalize per selectionMode      │
│  - Clamp to minDate/maxDate bounds  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Computed Signals                    │
│  - isDisabled(date): isDayDisabled  │
│    OR bounds check                  │
│  - cellContext: adds weekNumber,    │
│    isInRange, isRangeStart,         │
│    isRangeEnd                       │
│  - weekColumns: columnCount +       │
│    (weekNumbers ? 1 : 0)            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Template                            │
│  - Header: monthSelector dropdown   │
│    or arrows based on input         │
│  - Grid: week number column when    │
│    weekNumbers=true                 │
│  - Selection rendering via          │
│    isSelected/isInRange flags       │
└─────────────────────────────────────┘
```

## File Changes

| File                                                                          | Action | Description                                                                                                                                          |
| ----------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects/calendulum/src/lib/month/date-utils.ts`                             | Modify | Add `getISOWeek(date)`, `clampDate(date, min, max)`, `normalizeValue(value, mode)`, `isInRange(date, start, end)` pure helpers                       |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.ts`      | Modify | Add 8 new inputs, extended `value` model type, selection methods, bounds logic, month selector logic, week numbers logic, updated context type       |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.html`    | Modify | Header with monthSelector dropdown/arrows/none, week number column in grid, updated context binding                                                  |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.scss`    | Modify | CSS var multipliers for fontSize/density/cornerRadius, dropdown styles, week number column styles, range highlight styles, updated precedence ladder |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.spec.ts` | Modify | Test suites for all new features (oracle-derived expectations)                                                                                       |
| `projects/calendulum/src/lib/month/date-utils.spec.ts`                        | Modify | Unit tests for new pure helpers                                                                                                                      |

## Interfaces / Contracts

### New Inputs (calendulum-month.ts)

```typescript
// Visual theming
readonly fontSize = input<'sm' | 'md' | 'lg'>('md');
readonly density = input<'compact' | 'cozy' | 'spacious'>('cozy');
readonly cornerRadius = input<'sm' | 'md' | 'lg' | 'full'>('md');

// Navigation bounds
readonly minDate = input<Date | null>(null);
readonly maxDate = input<Date | null>(null);

// Month navigation mode
readonly monthSelector = input<'dropdown' | 'arrows' | 'none'>('arrows');

// Selection
readonly selectionMode = input<'single' | 'multiple' | 'range'>('single');
readonly weekNumbers = input<boolean>(false);

// Extended value model — simple union, selectionMode is discriminant
readonly value = model<Date | null | Date[] | { start: Date | null; end: Date | null }>(null);
```

### Extended Context Type (calendulum-month.ts)

```typescript
export interface CalendulumDayCellContext {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  weekNumber: number | null; // NEW: ISO week for week number column
  isInRange: boolean; // NEW: range mode — inside selection range
  isRangeStart: boolean; // NEW: range mode — range start cell
  isRangeEnd: boolean; // NEW: range mode — range end cell
}
```

### Exported Value Type (calendulum-month.ts)

```typescript
export type CalendulumValue = Date | null | Date[] | { start: Date | null; end: Date | null };
```

### New Pure Utilities (date-utils.ts)

```typescript
// ISO week number (1-53)
export function getISOWeek(date: Date): number;

// Clamp date to inclusive bounds
export function clampDate(date: Date, min: Date | null, max: Date | null): Date;

// Normalize value per selectionMode
export function normalizeValue(
  value: Date | null | Date[] | { start: Date | null; end: Date | null },
  mode: 'single' | 'multiple' | 'range',
): Date | null | Date[] | { start: Date | null; end: Date | null };

// Check if date falls in range (inclusive)
export function isInRange(date: Date, start: Date | null, end: Date | null): boolean;
```

## Testing Strategy

| Layer                       | What to Test                                                               | Approach                                                                                           |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Unit (pure helpers)**     | `getISOWeek`, `clampDate`, `normalizeValue`, `isInRange`                   | Jest-style pure function tests with edge cases (year boundaries, null bounds, invalid inputs)      |
| **Unit (computed signals)** | `isDisabled` merges predicate + bounds, `cellContext` flags, `weekColumns` | Component tests with `fixture.componentRef.setInput()`; assert computed values                     |
| **Integration (DOM)**       | Month selector dropdown renders/works, week number column, range highlight | Render component, query DOM, assert structure/classes/aria; use oracle functions for expected grid |
| **Selection modes**         | Single/multiple/range click behavior, value normalization, context flags   | Host components per mode; simulate clicks; assert `value` model and `cellContext` flags            |
| **Bounds + selection**      | Range clamps to maxDate, multiple ignores out-of-bounds clicks             | Combined scenario tests per spec                                                                   |
| **A11y**                    | Dropdown is native `<select>`, has label, `aria-disabled` on nav buttons   | DOM assertions; axe-core in CI (out of scope for unit)                                             |
| **SCSS budget**             | Compressed size ≤ 4096B                                                    | CI step: `npx sass --style=compressed` + size check                                                |

**Oracle Pattern**: Test expectations derived from logic (e.g., `expectedDates()` oracle in existing tests), not hardcoded matrices. Prevents combinatorial explosion across `selectionMode × minDate/maxDate × visibleDays × density`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Backward compatibility maintained:

- Default `selectionMode='single'` accepts `Date | null` — existing `[(value)]="date"` works unchanged
- All new inputs have sensible defaults matching current behavior
- `value` model type widens (union) but narrows correctly with `selectionMode`

Rollback: Revert `openspec/changes/visual-theme-navigation-selection/` folder. Component returns to post-day-restrictions state.

## Open Questions

- [ ] Should `firstDayOfWeek` persistence helper be added to `date-utils.ts` as a separate utility (out of scope per proposal)?
- [ ] Confirm SCSS budget with actual compressed build — if exceeded, which rules to consolidate first?
- [ ] Range hover preview (visual feedback during drag) — explicitly out of scope; confirm no partial implementation needed

## Key Learnings

1. Simple union with external discriminant (`selectionMode` input) preserves backward compatibility better than discriminated union with mode embedded in value.
2. Bounds as absolute calendar limits (not view-dependent) prevents surprising behavior when `visibleDays` filters columns.
3. Native `<select>` for month selector provides full accessibility with minimal code; styling via existing CSS vars maintains theming consistency.
4. Oracle-derived test expectations (computing expected grid from same pure functions) eliminates combinatorial test explosion across feature combinations.
5. Single CSS custom property multiplier per visual input (fontSize, density, cornerRadius) keeps SCSS budget growth minimal and predictable.
