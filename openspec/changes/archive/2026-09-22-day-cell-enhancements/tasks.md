# Tasks: Day Cell Enhancements

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~450–600    |
| 400-line budget risk    | High        |
| Chained PRs recommended | Yes         |
| Delivery strategy       | ask-on-risk |

Decision needed before apply: Yes — resolved by maintainer: `exception-ok` (size:exception accepted)
Chained PRs recommended: Yes — overridden by maintainer acceptance
Chain strategy: none (direct commits to main per project preference)
400-line budget risk: High — accepted

### Suggested Work Units

| Unit | Goal                                                        | PR  | Focused test command        | Runtime harness                    | Rollback boundary                                                    |
| ---- | ----------------------------------------------------------- | --- | --------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| 1    | Pure helpers + types                                        | 1   | `npx ng test calendulum`    | N/A — pure fns; unit tests suffice | `date-utils.ts(.spec)`; helper block in `calendulum-month.ts(.spec)` |
| 2    | Component wiring (click, style, context, slots, SCSS, a11y) | 2   | `npx ng test calendulum`    | N/A — TestBed harness; no server   | `calendulum-month.{ts,html,scss,spec.ts}`                            |
| 3    | Demo + README + full gate                                   | 3   | `npx ng test --watch=false` | `npx ng serve` smoke (optional)    | `projects/demo/src/app/*`, `README.md`                               |

## Phase 1: Pure Helpers (strict TDD)

- [x] 1.1 RED: create `date-utils.spec.ts` — padding (`2026-01-05`); local 23:30→`2026-09-22`; no `toISOString`.
- [x] 1.2 GREEN: `dateKey` in `date-utils.ts` (local getters, padStart); `DayCell` untouched.
- [x] 1.3 RED: `calendulum-month.spec.ts` — `resolveDayStyle` entry→`--cld-day-*` map, absent→`{}`; `resolveCellClasses` appends consumer class, keeps state classes.
- [x] 1.4 GREEN: add `DayStyle`, `CalendulumDayClickEvent`, `CalendulumDayCellContext`, `resolveDayStyle`, `resolveCellClasses` to `calendulum-month.ts`.

## Phase 2: Component API Wiring

- [x] 2.1 RED: `dayClick` — dispatched `MouseEvent`(120,340) payload + select; coordinate triangulation; outside click emits, `monthChange` silent; decorative cell silent.
- [x] 2.2 GREEN: `dayClick` output; `onDayClick` emits `{date, x: clientX, y: clientY}` then `select(date)`; wire default button.
- [x] 2.3 RED: context — marker `day.isToday`/`day.isSelected` true for matching cells; flags flip on selection change.
- [x] 2.4 GREEN: `cellContext(cell)` factory from `isToday()`/`isSelected()`; type 3 inputs `TemplateRef<{ $implicit: CalendulumDayCellContext }>`.
- [x] 2.5 RED: `dayStyle` — inline `--cld-day-*` on styled cell; absent key→none; selected keeps state bg, entry border applies; consumer class coexists.
- [x] 2.6 GREEN: `dayStyle = input<Record<string, DayStyle>>({})`; `[style]`/`[class]` from helpers on default button.

## Phase 3: Template Behavior + SCSS

- [x] 3.1 RED: slots — top/bottom above number; absent→no wrappers; slot reads flags; slot-content click emits + selects; `dayCell` suppresses slots; styled cell keeps entry.
- [x] 3.2 GREEN: `calendulum-month.html` slot outlets in default-button branch; `.scss` — `--cld-day-*` in base rules, `position: relative`, `.cld-month__day-top/bottom` (`absolute`, `pointer-events: none`).

## Phase 4: A11y Parity (custom dayCell)

- [x] 4.1 RED: custom wrapper — `role="button"`/`tabindex="0"`; click emits + selects; Enter and Space each emit `{date, x:0, y:0}` + select.
- [x] 4.2 GREEN: wrapper `(click)`→`onDayClick`, `(keydown.enter|space)`→`onDayKeydown` with `{x:0, y:0}` convention.

## Phase 5: Demo + README

- [x] 5.1 Update `projects/demo/src/app/app.{html,scss,ts}` — showcase coords/style/slots; `day.isToday` now real.
- [x] 5.2 Update `README.md` — API entries; context `{date, inMonth, isToday, isSelected}`; state-vs-dayStyle precedence + border exception; outside-day color caveat; `getBoundingClientRect` recipe; keyboard `{x:0, y:0}` convention.

## Phase 6: Full Verification

- [x] 6.1 `npx ng test --watch=false` green.
- [x] 6.2 `npx ng build calendulum && npx ng build demo`; style < 4 kB (3,092 B).
- [x] 6.3 `npx prettier --check .` (repo-wide formatting fixed; gate was pre-existing red at HEAD).
