# Tasks: Day Restrictions

## Review Workload Forecast

| Field                   | Value                      |
| ----------------------- | -------------------------- |
| Estimated changed lines | ~550–700                   |
| 400-line budget risk    | High                       |
| Chained PRs recommended | Yes                        |
| Suggested split         | PR 1 core → PR 2 demo/docs |
| Delivery strategy       | ask-on-risk                |
| Chain strategy          | pending                    |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                              | Likely PR | Focused test command                                                | Runtime harness                      | Rollback boundary                                      |
| ---- | ----------------------------------------------------------------- | --------- | ------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| 1    | Library: helpers, inputs, guards, context, template/SCSS, specs   | PR 1      | `npx ng test --watch=false`                                         | N/A — TestBed specs; demo in unit 2  | Revert `src/lib/month/**`; defaults restore prior grid |
| 2    | Demo cards + README (API, precedence, visibility, key-set recipe) | PR 2      | `npx ng build calendulum && npx ng build demo` + `prettier --check` | `npx ng serve demo` — view new cards | Revert `projects/demo/**`, `README.md` only            |

## Phase 1: Pure Helpers

- [x] 1.1 RED: `date-utils.spec.ts` — `resolveVisibleWeekdays`: presets, `[6,0]`→{0,6}, `[1,1,9,-2]`→{1}, `[]`→all, unknown→all
- [x] 1.2 GREEN: `date-utils.ts` — add `Weekday`, `CalendulumVisibleDays`, `resolveVisibleWeekdays()` (dedupe, sort, empty/invalid → `'all'`)
- [x] 1.3 RED: `calendulum-month.spec.ts` — extend `resolveCellClasses` with inserted `disabled` arg (design combos; consumer class appended); update 4 existing calls
- [x] 1.4 GREEN: `calendulum-month.ts` — `resolveCellClasses(cell, today, selected, disabled, style)` appends `cld-month__day--disabled`; update `cellClasses` call (`false` until 2.2)

## Phase 2: Component Wiring

- [x] 2.1 RED: `calendulum-month.spec.ts` — disabled: default all enabled; predicate disables 15th; click/keyboard inert; `select()`/`goToToday()` with disabled; context `isDisabled`
- [x] 2.2 GREEN: `calendulum-month.ts` — `isDayDisabled = input<(...) => boolean>(() => false)`; early-return guards in `onDayClick`/`onDayKeydown`; add `isDisabled` to `CalendulumDayCellContext`; wire `cellContext`/`cellClasses`
- [x] 2.3 RED: `calendulum-month.spec.ts` — visible-days: 30/36/42 cells, membership, headers, order-insensitive, `[]`→42, fDoW=0 + monSat no Sunday col, hidden `value`, navigation
- [x] 2.4 GREEN: `calendulum-month.ts` — `visibleDays = input('all')`; `visibleWeekdaySet`; `columnCount`; filter `days`/`weekdays`; rerun suite green

## Phase 3: Template + SCSS

- [x] 3.1 RED: `calendulum-month.spec.ts` — DOM: `aria-disabled="true"` only on disabled, no native `disabled`, `tabindex` kept (both branches); `--cld-week-columns` proxy 5/6/7
- [x] 3.2 GREEN: `calendulum-month.html` — bind `[style.--cld-week-columns]="columnCount()"`; `[attr.aria-disabled]` on both branches
- [x] 3.3 GREEN: `calendulum-month.scss` — `repeat(var(--cld-week-columns), 1fr)` for weekdays/grid; `.cld-month__day--disabled` + `:hover` neutralizer (cursor not-allowed, hover neutralized); SCSS < 4 kB

## Phase 4: Demo + Docs

- [x] 4.1 `app.ts` — disabled predicate over `dateKey` `Set`; `visibleDays` values
- [x] 4.2 `app.html`/`app.scss` — cards: disabled days (mark via `day.isDisabled`) + Mon–Fri view; minimal styles
- [x] 4.3 `README.md` — API rows (isDayDisabled, visibleDays); precedence ladder; visibility contract (Sunday omission, hidden value, presets); key-set recipe + stable reference; context incl. `isDisabled`

## Phase 5: Verification

- [x] 5.1 `npx ng test --watch=false` — all specs green incl. pre-change behavior (defaults: all enabled, 42 cells)
- [x] 5.2 `npx ng build calendulum && npx ng build demo`
- [x] 5.3 `npx prettier --check .`; fix violations
- [x] 5.4 Confirm SCSS < 4 kB; README matches spec scenarios
