# Tasks: Visual Theme + Extended Navigation + Selection

## Review Workload Forecast

| Field                   | Value                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | 850–1100                                                                                                                                                       |
| 400-line budget risk    | High                                                                                                                                                           |
| Chained PRs recommended | Yes                                                                                                                                                            |
| Suggested split         | PR 1: Pure helpers + date-utils tests → PR 2: Component wiring + core logic tests → PR 3: Template/SCSS + integration tests → PR 4: Demo/README + verification |
| Delivery strategy       | ask-on-risk                                                                                                                                                    |
| Chain strategy          | pending                                                                                                                                                        |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                                       | Likely PR | Focused test command                                                                                  | Runtime harness               | Rollback boundary                                |
| ---- | ------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| 1    | Pure date helpers (getISOWeek, clampDate, normalizeValue, isInRange) + unit tests          | PR 1      | `npx ng test calendulum -- --include="**/date-utils.spec.ts"`                                         | Jest-style unit tests, no DOM | Revert date-utils.ts and date-utils.spec.ts only |
| 2    | Component inputs, model normalization, bounds clamping, selection methods, context factory | PR 2      | `npx ng test calendulum -- --include="**/calendulum-month.spec.ts" --grep="model                      | bounds                        | selectionMode                                    | normalize"` | Component tests with setInput | Revert calendulum-month.ts only (tests may need co-revert) |
| 3    | Template: dropdown, week number column; SCSS: multipliers, density, range highlight        | PR 3      | `npx ng test calendulum -- --include="**/calendulum-month.spec.ts" --grep="dropdown                   | weekNumber                    | density                                          | fontSize    | cornerRadius                  | range"`                                                    | Full DOM render tests | Revert calendulum-month.html and calendulum-month.scss only |
| 4    | Demo app updates, README docs, full verification suite                                     | PR 4      | `npx ng test --watch=false && npx ng build calendulum && npx ng build demo && npx prettier --check .` | Full build + test + format    | Revert demo/ and README.md only                  |

---

## Phase 1: Pure Helpers (date-utils.ts) — TDD RED→GREEN

- [x] 1.1 **RED**: Add failing tests for `getISOWeek(date: Date): number` in `date-utils.spec.ts` covering ISO week boundaries (Dec 31/Jan 1 cross-year), leap years, known reference dates
- [x] 1.2 **GREEN**: Implement `getISOWeek` in `date-utils.ts` using ISO-8601 algorithm (Thursday-based week 1)
- [x] 1.3 **RED**: Add failing tests for `clampDate(date: Date, min: Date | null, max: Date | null): Date` covering null bounds, inclusive boundaries, date before min, date after max, date within
- [x] 1.4 **GREEN**: Implement `clampDate` in `date-utils.ts` with inclusive bounds semantics
- [x] 1.5 **RED**: Add failing tests for `normalizeValue(value, mode)` covering all three modes: single (Date|null → Date|null), multiple (Date → [Date], Date[] → Date[]), range (single Date → {start, end:null}, partial range → completed range, invalid → safe defaults)
- [x] 1.6 **GREEN**: Implement `normalizeValue` in `date-utils.ts` with mode-based coercion
- [x] 1.7 **RED**: Add failing tests for `isInRange(date, start, end)` covering null bounds, inclusive range, date before start, date after end, single-point range (start===end)
- [x] 1.8 **GREEN**: Implement `isInRange` in `date-utils.ts`
- [x] 1.9 **REFACTOR**: Export new functions from `date-utils.ts` public API; verify all tests pass

---

## Phase 2: Component Wiring (calendulum-month.ts) — TDD RED→GREEN

- [x] 2.1 **RED**: Add failing tests for new visual inputs: `fontSize` (sm|md|lg), `density` (compact|cozy|spacious), `cornerRadius` (sm|md|lg|full) — verify default values and CSS var multipliers via computed signals
- [x] 2.2 **GREEN**: Add 3 visual inputs with discrete tiers and default values; add computed signals `fontSizeMultiplier`, `densityMultiplier`, `cornerRadiusValue` mapping to CSS var values per design table
- [x] 2.3 **RED**: Add failing tests for navigation bounds: `minDate`/`maxDate` inputs (default null), value clamping on model set, navigation button disable logic, bounds merged into `isDisabled` (OR with predicate)
- [x] 2.4 **GREEN**: Add `minDate`, `maxDate` inputs; update `value` model interceptor to clamp on set using `clampDate`; add computed `canGoPrevious`/`canGoNext` for nav buttons; update `isDisabled` to merge predicate OR bounds check
- [x] 2.5 **RED**: Add failing tests for `monthSelector` input ('dropdown'|'arrows'|'none', default 'arrows'): dropdown options respect bounds, native select element, emits monthChange on selection
- [x] 2.6 **GREEN**: Add `monthSelector` input; computed `monthOptions` (filtered by bounds); template will consume in Phase 3
- [x] 2.7 **RED**: Add failing tests for `selectionMode` input ('single'|'multiple'|'range', default 'single') and discriminated union `value` model type; model normalization on set via `normalizeValue`
- [x] 2.8 **GREEN**: Change `value` model type to union; add `selectionMode` input; intercept model `set` to normalize via `normalizeValue`; backward compat: default 'single' accepts Date|null
- [x] 2.9 **RED**: Add failing tests for `weekNumbers` input (default false): weekColumns computed = columnCount + (weekNumbers ? 1 : 0)
- [x] 2.10 **GREEN**: Add `weekNumbers` input; computed `weekColumns`; add `getWeekNumbers()` for grid rows
- [x] 2.11 **RED**: Add failing tests for extended `cellContext`: `weekNumber`, `isInRange`, `isRangeStart`, `isRangeEnd` flags per selection mode and weekNumbers
- [x] 2.12 **GREEN**: Update `CalendulumDayCellContext` interface; update `cellContext()` to compute new flags using `isInRange`, `getISOWeek`; range flags only true in 'range' mode
- [x] 2.13 **RED**: Add failing tests for selection methods per mode: `selectSingle()`, `toggleMultiple()`, `selectRange()` with auto-reorder (end < start swaps), third click resets to new start
- [x] 2.14 **GREEN**: Implement mode-specific selection methods; update `onDayClick`/`onDayKeydown` to dispatch by `selectionMode`; `select()` stays unconditional (bypasses disabled)
- [x] 2.15 **RED**: Add failing tests for bounds + selection interaction: range clamps to maxDate, multiple ignores out-of-bounds clicks (blocked by disabled logic)
- [x] 2.16 **GREEN**: Ensure `isDisabled` bounds check blocks clicks in all modes; `select()` remains unconditional; verify `select()` with out-of-bounds still works

---

## Phase 3: Template & SCSS (calendulum-month.html/.scss) — TDD RED→GREEN

- [x] 3.1 **RED**: Add failing tests for header rendering: `monthSelector='arrows'` shows prev/next buttons; `'dropdown'` shows native `<select>` with month options, no arrows; `'none'` shows only title; dropdown has label/aria-label; options respect minDate/maxDate bounds
- [x] 3.2 **GREEN**: Update header template with conditional rendering for 3 modes; native `<select>` bound to `view` via `(change)`; emit `monthChange` on selection; accessibility: label + aria-label
- [x] 3.3 **RED**: Add failing tests for week number column: `weekNumbers=true` adds first column with "Wk" header; 8 columns for 'all', 6 for 'mondayToFriday'; `--cld-week-columns` updated; week number cells show ISO week numbers; context has `weekNumber` for week column, `null` for day cells
- [x] 3.4 **GREEN**: Add week number column to weekday header and grid; prepend week number cells to each row; update `--cld-week-columns` binding on section
- [x] 3.5 **RED**: Add failing tests for CSS var multipliers: `fontSize` sets `--cld-font-size-multiplier` (0.875|1|1.125); `density` sets `--cld-density-multiplier` (0.75|1|1.375); `cornerRadius` sets `--cld-radius-override` (0.25rem|0.5rem|0.75rem|9999px); root font-size uses multiplier; padding/gap/header-height use `calc(var(--cld-density-multiplier) * base)`
- [x] 3.6 **GREEN**: Add computed signals that set CSS custom properties on host via `host()` binding or `[style]`; consolidate density rules to single multiplier; apply radius to day cells, header, dropdown
- [x] 3.7 **RED**: Add failing tests for range selection visuals: `isInRange` cells get range highlight class; `isRangeStart`/`isRangeEnd` get distinct rounded-end classes; selected range cells combine classes correctly
- [x] 3.8 **GREEN**: Add range highlight CSS (background with accent opacity); update `resolveCellClasses` / cell classes to include range flags; ensure disabled+range combination works per precedence ladder
- [x] 3.9 **RED**: Add failing tests for dropdown styling: native select uses `--cld-font`, `--cld-radius`, `--cld-bg`, `--cld-border`
- [x] 3.10 **GREEN**: Style dropdown select with CSS vars; ensure `cornerRadius` applies to dropdown
- [x] 3.11 **REFACTOR**: Verify SCSS compressed size ≤ 4096B (`npx sass --style=compressed projects/calendulum/src/lib/month/calendulum-month/calendulum-month.scss`)

---

## Phase 4: Integration Tests & Oracle-Derived Expectations

- [x] 4.1 Write oracle helper `expectedGrid()` for combined `selectionMode × minDate/maxDate × visibleDays × density` — computes expected grid from same pure functions used by component
- [x] 4.2 Test single mode with bounds: value clamped, nav buttons disabled at edges, disabled cells carry aria-disabled
- [x] 4.3 Test multiple mode with bounds: toggling respects disabled cells, value stays array
- [x] 4.4 Test range mode with bounds: auto-reorder, clamp end to maxDate, third click reset
- [x] 4.5 Test range mode context flags: `isInRange`, `isRangeStart`, `isRangeEnd` correct across selections
- [x] 4.6 Test weekNumbers with all visibleDays presets: column count, header "Wk", weekNumber context
- [x] 4.7 Test monthSelector dropdown a11y: native select, label, keyboard nav, monthChange emission
- [x] 4.8 Test visual inputs runtime change: fontSize/density/cornerRadius update CSS vars immediately
- [x] 4.9 Test custom dayCell templates receive all 9 context fields (date, inMonth, isToday, isSelected, isDisabled, weekNumber, isInRange, isRangeStart, isRangeEnd)
- [x] 4.10 Test backward compat: existing consumer with `[(value)]="date"` and no selectionMode works identically

---

## Phase 5: Demo, README & Full Verification

- [x] 5.1 Update demo app (`projects/demo`) to showcase all new features: visual theme picker, bounds config, monthSelector toggle, selectionMode picker, weekNumbers toggle
- [x] 5.2 Update README.md: document all 8 new inputs in API table, `CalendulumValue` type, `CalendulumDayCellContext` extended shape, selectionMode behavior table, weekNumbers, monthSelector, bounds merge with isDayDisabled, key-set recipe
- [x] 5.3 Run full verification: `npx ng test --watch=false` (scope: `npx ng test calendulum`), `npx ng build calendulum && npx ng build demo`, `npx prettier --check .`
- [x] 5.4 Verify SCSS budget: compressed size ≤ 4096B
- [x] 5.5 If any failures, iterate fix → verify until clean

---

## Key Learnings

1. Pure helper functions (getISOWeek, clampDate, normalizeValue, isInRange) must be tested in isolation first — they form the oracle for all integration tests.
2. Model input normalization must happen in the `set` interceptor BEFORE bounds clamping to ensure consistent behavior across all selection modes.
3. The `isDisabled` computed signal is the single source of truth for disabled state — it must merge predicate OR bounds check for both default and custom dayCell branches.
4. Oracle-derived test expectations (computing expected grid from the same pure functions) eliminate combinatorial explosion across feature combinations.
5. Single CSS custom property multiplier per visual input (fontSize, density, cornerRadius) keeps SCSS budget growth minimal and predictable.
6. Native `<select>` for monthSelector provides full accessibility with minimal code; styling via existing CSS vars maintains theming consistency.
7. Range selection auto-reorder (swapping start/end when end < start) must happen in the selection logic, not in the model normalization.
8. Backward compatibility is preserved by defaulting `selectionMode='single'` which accepts `Date | null` — existing `[(value)]="date"` bindings work without any migration.
