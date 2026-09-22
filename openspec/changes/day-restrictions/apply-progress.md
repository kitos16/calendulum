# Apply Progress — day-restrictions

**Status**: success — all 18 tasks complete (checked in `tasks.md`), full gate green, verified fresh by the orchestrator (80 tests, both builds). Delivery: size:exception accepted (no PRs; direct commits to main).

## TDD Cycle Evidence

| Task    | Test File                          | Layer                 | Safety Net  | RED             | GREEN                                           | TRIANGULATE                                                                                 | REFACTOR                                                    |
| ------- | ---------------------------------- | --------------------- | ----------- | --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1.1–1.2 | `date-utils.spec.ts`               | Unit                  | ✅ 4/4      | ✅ Written      | ✅ Passed                                       | ✅ presets, `[6,0]`, `[1,1,9,-2]`, `[]`, unknown                                            | ➖ None needed                                              |
| 1.3–1.4 | `calendulum-month.spec.ts`         | Unit                  | ✅ 62/62    | ✅ Written      | ✅ Passed                                       | ✅ design combos + consumer class                                                           | ✅ Updated 4 existing calls + `false` placeholder until 2.2 |
| 2.1–2.2 | `calendulum-month.spec.ts`         | Integration (TestBed) | ✅ suite    | ✅ Written      | ✅ Passed                                       | ✅ default-enabled, predicate 15th, click/keyboard inert, select/goToToday, context         | ➖ None needed                                              |
| 2.3–2.4 | `calendulum-month.spec.ts`         | Integration (TestBed) | ✅ suite    | ✅ Written      | ✅ Passed                                       | ✅ 30/36/42 cells, membership, headers, order-insensitive, fDoW=0, hidden value, navigation | ➖ None needed                                              |
| 3.1–3.2 | `calendulum-month.spec.ts`         | Integration (TestBed) | ✅ suite    | ✅ Written      | ✅ Passed                                       | ✅ aria-disabled both branches, no native disabled, tabindex, `--cld-week-columns` 5/6/7    | ➖ None needed                                              |
| 3.3     | `calendulum-month.scss`            | Static                | ✅ suite    | ✅ (3.1)        | ✅ Passed                                       | ✅ repeat(var), disabled + hover neutralizer, < 4 kB                                        | ➖ None needed                                              |
| 4.1–4.3 | `app.{ts,html,scss}` / `README.md` | Demo/Docs             | ✅ 3/3 demo | N/A (demo/docs) | ✅ Passed                                       | —                                                                                           | —                                                           |
| 5.1–5.4 | full gate                          | —                     | —           | —               | ✅ 80 tests + 2 builds + prettier + SCSS budget | —                                                                                           | —                                                           |

## Work Unit Evidence

| Evidence             | Value                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused test command | `npx ng test --watch=false` → 80/80 pass (EXIT 0), verified fresh by orchestrator                                                                       |
| Library build        | `npx ng build calendulum` → OK (EXIT 0), verified fresh                                                                                                 |
| Demo build           | `npx ng build demo` → OK (EXIT 0), verified fresh                                                                                                       |
| Formatter            | `npx prettier --check .` → clean (EXIT 0), verified fresh                                                                                               |
| Style budget         | 3582 B < 4096 B (`anyComponentStyle`)                                                                                                                   |
| Runtime harness      | N/A — no server runtime; TestBed integration covers interaction paths                                                                                   |
| Rollback boundary    | Library: `date-utils.ts(.spec)`, `calendulum-month.{ts,html,scss,spec.ts}`; demo: `projects/demo/src/app/{app.ts,app.html,app.scss}`; docs: `README.md` |

## Implementation Summary

- **`date-utils.ts`**: added pure `resolveVisibleWeekdays()` (preset union + weekday-array projection, normalization to `all`, dedupe/sort); extended `resolveCellClasses(cell, today, selected, disabled, style)` with inserted `disabled` positional param.
- **`calendulum-month.ts`**: added `isDayDisabled` predicate input, `visibleDays` union input, `columnCount` computed, filtered `days`/`weekdays` computeds, `isDisabled` context flag on `CalendulumDayCellContext`, UI-path guards in `onDayClick`/`onDayKeydown` (disabled: no emit, no select), `select()`/`goToToday()` remain unconditional.
- **`calendulum-month.html`**: `aria-disabled="true"` on button and custom-wrapper branches (focusable, never native `disabled`), `--cld-week-columns` binding on weekdays + grid.
- **`calendulum-month.scss`**: `repeat(var(--cld-week-columns), 1fr)`, `--disabled` state class + disabled-hover neutralizer; final size 3582 B < 4096 B threshold.
- **Demo** (`app.{ts,html,scss}`): showcase card for disabled days + card for visible-days filter variants.
- **`README.md`**: precedence ladder (selected > today/disabled > hover > dayStyle bg/color, border exception), `firstDayOfWeek=0` + `mondayToSaturday` Sunday omission, programmatic-selection note, stable-predicate-reference note.

## Deviations from Design

None reported. Orchestrator verified gate evidence independently; component spec additions drive the estimated changed lines (~550–700, accepted as size:exception).

## Key Findings

- Combination test counts are derived from resolved-set size × 6 rows / date logic, never hardcoded month-dependent day counts.
- `aria-disabled` + retained focusability keeps disabled dates reachable by keyboard while visually and behaviorally inert.
- The repo uses direct commits with no PR flow; the workload guard was resolved via maintainer-accepted size:exception.
- OpenSpec artifacts materialized by the orchestrator must be formatted with prettier at write time, or the declared formatter gate fails on the change's own files.
