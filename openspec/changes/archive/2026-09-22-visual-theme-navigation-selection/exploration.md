# Exploration: Visual Theme + Extended Navigation + Selection

## Context

Continuing from two completed SDD cycles on `CalendulumMonth`:

- **day-cell-enhancements**: dayClick coordinates, per-day styling (dayStyle), dayCellTop/Bottom slots, context contract fix
- **day-restrictions**: isDayDisabled predicate, visibleDays filter (all / Mon-Fri / Mon-Sat / custom weekdays)

Current component exports: `CalendulumMonth`, `CalendulumDayClickEvent`, `CalendulumDayCellContext`, `DayStyle`, `CalendulumVisibleDays`, `Weekday`, `dateKey`, `resolveVisibleWeekdays`, `resolveCellClasses`, `resolveDayStyle`.

## Brainstorming Directions (User Request)

User selected three areas for the next change:

### 1. Temática Visual (Visual Theming)

| Idea                 | Description                                                                                 | Current Gap                             |
| -------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- |
| `fontSize` input     | Global font-size scale for the component (e.g., `sm` \| `md` \| `lg` or numeric rem)        | Only --cld-font inherits; no size scale |
| `density` input      | Spacing scale: `compact` \| `cozy` \| `spacious` (affects cell padding, gap, header height) | Fixed 1rem padding, 0.25rem gaps        |
| `cornerRadius` input | Global border-radius override (already have --cld-radius but no typed input)                | --cld-radius exists as CSS var only     |
| `colorScheme` input  | Light/dark/auto toggle at component level (currently inherits)                              | No component-level control              |

**Recommendation**: Single `theme` input object or individual inputs? Given existing pattern (discrete inputs like `firstDayOfWeek`, `showOutsideDays`), individual inputs align better. Start with `fontSize`, `density`, `cornerRadius` as discrete inputs mapping to CSS custom properties.

### 2. Navegación Extendida (Extended Navigation)

| Idea                  | Description                                                                                 | Current Gap                    |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `monthSelector`       | `'dropdown' \| 'arrows' \| 'none'` — render native select or custom dropdown for month jump | Only arrows (±1 month)         |
| `yearSelector`        | `'dropdown' \| 'input' \| 'none'` — year jump control                                       | No year navigation             |
| `minDate` / `maxDate` | Date bounds that disable navigation and clamp `value`                                       | No bounds; infinite navigation |
| `viewMode`            | `'month' \| 'year' \| 'decade'` — multi-view navigation (like Material datepicker)          | Single month view only         |

**Recommendation**: Phase 1 = `minDate`/`maxDate` bounds (clamping + nav disable) + `monthSelector` dropdown (low complexity, high value). `yearSelector` and `viewMode` are Phase 2 (require year/decade view templates).

### 3. Selección (Selection Modes)

| Idea                         | Description                                                                                        | Current Gap                |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| `selectionMode`              | `'single' \| 'multiple' \| 'range'` — `value` becomes `Date \| Date[] \| {start: Date; end: Date}` | Single Date only           |
| `weekNumbers`                | Show ISO week numbers in first column (ISO 8601)                                                   | No week numbers            |
| `firstDayOfWeek` persistence | Already exists as input; consider localStorage persistence helper                                  | Input only, no persistence |

**Recommendation**: `selectionMode: 'single' \| 'multiple' \| 'range'` is the high-value feature. `weekNumbers` is a visual add-on. `firstDayOfWeek` persistence is a helper utility, not a component feature. Prioritize `selectionMode` with backward-compatible `value` typing (discriminated union).

## Scope for This Change (Single Cohesive PR)

Given review budget (800 lines) and user's "size:exception" tolerance, bundle the **core trio** with manageable scope:

| Area           | In Scope (MVP)                                                                                         | Out of Scope (Future)                                    |
| -------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **Visual**     | `fontSize` (`sm`\|`md`\|`lg`), `density` (`compact`\|`cozy`\|`spacious`), `cornerRadius` input         | `colorScheme`, full theme object                         |
| **Navigation** | `minDate`/`maxDate` bounds (clamp + disable nav), `monthSelector: 'dropdown'\|'arrows'\|'none'`        | `yearSelector`, `viewMode` (year/decade views)           |
| **Selection**  | `selectionMode: 'single'\|'multiple'\|'range'` with discriminated union `value`; `weekNumbers` boolean | `firstDayOfWeek` persistence helper, range hover preview |

## Key Technical Decisions to Resolve

1. **`value` type for selection modes** — discriminated union:

   ```ts
   type CalendulumValue =
     | { mode: 'single'; value: Date | null }
     | { mode: 'multiple'; value: Date[] }
     | { mode: 'range'; value: { start: Date | null; end: Date | null } };
   ```

   Or keep simple `Date | Date[] | {start, end}` with `selectionMode` as discriminant? Latter is simpler for consumers.

2. **`minDate`/`maxDate` interaction with `visibleDays`** — bounds should apply after weekday filter? Or before? Recommendation: bounds are absolute calendar limits; weekday filter is a view projection within bounds.

3. **`monthSelector` dropdown a11y** — native `<select>` vs custom dropdown. Native has better a11y; custom matches theming. Recommendation: native `<select>` with `--cld-font`/`--cld-radius` styling via CSS.

4. **Backward compatibility** — `value` as `Date | null` must still work when `selectionMode` defaults to `'single'`. Model input can accept union and normalize.

5. **SCSS budget** — current 3582B / 4096B limit. New inputs add CSS vars + rules. Must measure.

## Risks

- **Type complexity**: Discriminated union for `value` + `selectionMode` may confuse consumers. Needs clear README examples.
- **Test combinatorial explosion**: selectionMode × minDate/maxDate × visibleDays × density = many combos. Must derive expectations from logic, not hardcode.
- **SCSS budget breach**: Density adds padding/gap rules; monthSelector adds dropdown styles. Monitor.
- **Breaking `value` model**: Must support `Date | null` for `'single'` default without migration pain.

## Next Step

Proceed to **Proposal** phase with explicit decisions on the above.
