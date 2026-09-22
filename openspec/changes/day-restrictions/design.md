# Design: Day Restrictions

## Technical Approach

Add two additive capabilities on top of the standalone signal component:

1. **Disabled days**: a predicate `isDayDisabled: input<(date: Date) => boolean>` (default: always `false`). The predicate derives per-date disabled status. UI activation in `onDayClick`/`onDayKeydown` short-circuits for disabled dates (no `dayClick` emission, no `select()`). Disabled cells keep focusability (no `disabled` attribute), carry `aria-disabled="true"` on both branches (default button and custom `dayCell` wrapper), receive `--disabled` state class via an extended `resolveCellClasses`, and expose `isDisabled` in the template context. `select()` and `goToToday()` remain unconditional.

2. **Visible days**: a union input `visibleDays: input<'all' | 'mondayToFriday' | 'mondayToSaturday' | readonly Weekday[]>` with type `CalendulumVisibleDays` exported. A pure helper `resolveVisibleWeekdays()` in `date-utils.ts` normalizes presets/arrays to a canonical sorted `Set<number>` of weekday numbers (0–6). The `days` grid filters by weekday membership (whole columns only) and `weekdays` header filters by the same set; column count is derived from the set size. The component binds `--cld-week-columns` to the host/section and SCSS uses `repeat(var(--cld-week-columns), 1fr)` for both `.cld-month__weekdays` and `.cld-month__grid`. Row-completeness is preserved: cell count = |set| × 6 (42/36/30 for the presets). Invalid values normalize to `'all'`.

Both changes follow the existing patterns (signals, pure helpers for testability, object-form `[style]` where used). Strict TDD: unit tests for pure helpers, component tests for UI behavior.

## Architecture Decisions

### Decision: Type definitions and helper placement

| Symbol                                                             | Home                             | Rationale                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Weekday`, `CalendulumVisibleDays`, `resolveVisibleWeekdays()`     | `date-utils.ts`                  | Pure date/weekday logic; reusable and testable without TestBed. `Weekday` is the numeric 0–6 type; exported for public API.                                                                                                             |
| `CalendulumDayCellContext` (add `isDisabled`)                      | `calendulum-month.ts`            | Component API surface; already exported from the component module.                                                                                                                                                                      |
| `resolveCellClasses(cell, today, selected, disabled, style)`       | `calendulum-month.ts` (exported) | Colocated with `DayStyle`; signature extended with inserted `disabled: boolean` positional param (backward compatibility is not required inside this in-repo codebase — the change is localized; the spec documents the new signature). |
| `isDayDisabled` input, `visibleDays` input, `columnCount` computed | `calendulum-month.ts`            | Component state/computed properties.                                                                                                                                                                                                    |

### Decision: `resolveVisibleWeekdays` signature and normalization

Signature: `resolveVisibleWeekdays(visibleDays: CalendulumVisibleDays, firstDayOfWeek?: 0 | 1): Set<number>` (or just `visibleDays` parameter; normalization is independent of `firstDayOfWeek` for preset expansion as specified: presets expand to fixed sets `{1,2,3,4,5}` and `{1,2,3,4,5,6}` independent of `firstDayOfWeek`). The helper normalizes:

- `'all'` → `{0,1,2,3,4,5,6}`
- `'mondayToFriday'` → `{1,2,3,4,5}`
- `'mondayToSaturday'` → `{1,2,3,4,5,6}`
- `readonly Weekday[]` → collect only values in `[0,6]`, dedupe, sort ascending (order-insensitive for membership; sorted for stability). If resulting set is empty → fallback to `'all'`.
- Any other value → fallback to `'all'`.

This keeps membership checks simple (`set.has(cell.date.getDay())`) and produces the column count as `set.size`.

### Decision: Column projection and stability

`days` computed becomes filtered: `buildMonthGrid(view, firstDayOfWeek()).filter(c => visibleSet.has(c.date.getDay()))`. Filtering is by weekday (whole columns) — no per-date hiding. The grid always renders 6 rows because the base grid is 42 cells structured in 7 columns × 6 rows; filtering whole columns removes some columns but leaves each row with the same number of cells in their original column positions? Or more precisely, the sequence of 42 cells is row-major in the base layout; filtering by weekday membership keeps cells whose weekday is in the visible set — this removes entire weekday columns across all 6 rows simultaneously, so the remaining cells form 6 complete rows × N columns with day numbers staying in the same conceptual row positions (row-stability contract satisfied). Cell count = `visibleSet.size × 6`.

`weekdays` computed is filtered to the same set, preserving the order implied by `firstDayOfWeek`? The existing `weekdayLabels()` returns labels in the order starting at `firstDayOfWeek` (7 labels total). We filter these labels to only those weekdays that are in `visibleSet`, keeping their relative order as produced by `weekdayLabels()` (which already respects `firstDayOfWeek`). This matches header alignment with columns.

### Decision: CSS variable binding for column count

The component binds `--cld-week-columns` on the `<section class="cld-month">` (host/container). Both `.cld-month__weekdays` and `.cld-month__grid` use `grid-template-columns: repeat(var(--cld-week-columns), 1fr)`. Default (`all`, 7 columns) produces `repeat(7, 1fr)`. SCSS change is minimal (replace the hardcoded `7` with `var(--cld-week-columns)` in those two rules). The host already exposes CSS custom properties; we add no new ones.

### Decision: Disabled interaction and accessibility

- No `disabled` attribute on any interactive element (drops tab order).
- Default button branch: add `[attr.aria-disabled]="isDisabled(cell.date) ? 'true' : null"` (or just `"true"`/omit; spec states enabled MUST NOT have aria-disabled). Also guard in `onDayClick`: if disabled, return early (no `dayClick.emit`, no `select()`). But `onDayClick` is called from click handler; also need to consider — better to guard at handler start.
- Custom wrapper branch (`dayCell()` provided): the wrapper is a `div[role="button"][tabindex="0"]`. Add `aria-disabled` there too. Keyboard activation: `onDayKeydown(date)` must short-circuit if disabled — no emit, no select. Also click on wrapper: `onDayClick` must short-circuit.
- `select()` remains unconditional (public API). `goToToday()` calls `select(today)` unconditionally. The guards only live in the UI activation paths (`onDayClick`, `onDayKeydown`).

### Decision: `resolveCellClasses` signature extension

Extend signature to `(cell, today, selected, disabled, style)` with `disabled` as the 4th positional parameter (inserted). Append `cld-month__day--disabled` when `disabled` is true. The class ordering: state classes in a deterministic order (`outside`, `today`, `selected`, `disabled`) followed by consumer classes — maintains clarity and matches the precedence described (selected > today? > disabled > hover > dayStyle). Also `disabled` combines with others as specified.

SCSS: add rule for `.cld-month__day--disabled` to suppress cursor and hover background. Since bare class specificity (0,1,0) is lower than `:hover` (0,2,0), an explicit rule is needed: `.cld-month__day--disabled:hover { background: transparent; cursor: not-allowed; }` (or appropriate values matching design). Also ensure disabled doesn't kill today/selected visuals — today uses `box-shadow` (not background), selected uses background; so disabled hover neutralizer only affects background/cursor.

### Decision: Context contract

`CalendulumDayCellContext` gains `isDisabled: boolean`. The factory `cellContext(cell)` adds `isDisabled: this.isDayDisabled()(cell.date)` (or call the input function). All template outlets (`dayCell`, `dayCellTop`, `dayCellBottom`) receive the same context shape.

### Decision: Key-set recipe and stable reference

The spec/README must document: `isDayDisabled` as a predicate with stable reference recommended (inline arrows re-fire per change detection). The key-set recipe is `(d) => keys.has(dateKey(d))` over a `Set` of `dateKey` strings. We will include this in README and design notes. For implementation, consumers control stability; component just invokes the function.

## Interfaces / Contracts

```ts
// date-utils.ts
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CalendulumVisibleDays =
  'all' | 'mondayToFriday' | 'mondayToSaturday' | readonly Weekday[];
export function resolveVisibleWeekdays(visibleDays: CalendulumVisibleDays): Set<number>;

// calendulum-month.ts
export interface CalendulumDayCellContext {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}
export function resolveCellClasses(
  cell: DayCell,
  today: boolean,
  selected: boolean,
  disabled: boolean,
  style: DayStyle | undefined,
): string[];
```

Component members:

- `isDayDisabled = input<(date: Date) => boolean>(() => false)`
- `visibleDays = input<CalendulumVisibleDays>('all')`
- `columnCount = computed(() => this.visibleWeekdaySet().size)` (or derive from set)
- `visibleWeekdaySet = computed(() => resolveVisibleWeekdays(this.visibleDays()))`

## Data Flow

```
visibleDays input ──► resolveVisibleWeekdays ──► Set<number> (size = N) ──► days filter + columnCount
columnCount ──► [style.--cld-week-columns] bound on section ──► SCSS repeat(var(--cld-week-columns), 1fr)
isDayDisabled(date) ──► isDisabled flag (UI guards + context + classes)
click/keydown (if disabled) ──► early return (no dayClick, no select)
click/keydown (if enabled) ──► onDayClick/onDayKeydown ──► dayClick.emit + select() (unconditional select after emit)
select() ──► value model (never consults predicate)
cellContext ──► {date,inMonth,isToday,isSelected,isDisabled} to all outlets
```

## File Changes

| File                                                                          | Action | Description                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects/calendulum/src/lib/month/date-utils.ts`                             | Modify | Add `Weekday`, `CalendulumVisibleDays`, `resolveVisibleWeekdays()`                                                                                                                                                                                                                                                                          |
| `projects/calendulum/src/lib/month/date-utils.spec.ts`                        | Modify | Unit tests for `resolveVisibleWeekdays()` (presets, arrays, normalization, order-insensitive, empty/fallback)                                                                                                                                                                                                                               |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.ts`      | Modify | Add inputs, computeds, extend `CalendulumDayCellContext`, extend `resolveCellClasses` signature, add guards in handlers, update `cellContext`, `cellClasses` call, expose types                                                                                                                                                             |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.html`    | Modify | Bind `--cld-week-columns` on section; add `aria-disabled` on button and wrapper; wire disabled-aware guards (implicit via calling guarded handlers)                                                                                                                                                                                         |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.scss`    | Modify | Replace hardcoded `7` with `var(--cld-week-columns)` for weekdays/grid; add `.cld-month__day--disabled` and `.cld-month__day--disabled:hover` rules                                                                                                                                                                                         |
| `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.spec.ts` | Modify | Extend `resolveCellClasses` tests with disabled param; add component tests for disabled-days and visible-days                                                                                                                                                                                                                               |
| `projects/demo/src/app/app.html`, `app.ts`                                    | Modify | Add demo cards showcasing disabled days and Mon–Fri view (as per proposal)                                                                                                                                                                                                                                                                  |
| `projects/demo/src/app/app.scss`                                              | Modify | Minimal styling if needed for demo cards                                                                                                                                                                                                                                                                                                    |
| `README.md`                                                                   | Modify | API table entries for `isDayDisabled`, `visibleDays`; document precedence (selected > today? > disabled > hover > dayStyle), visibility contract (column projection, hidden-weekday value allowed, Sunday omission with `firstDayOfWeek=0` + `mondayToSaturday`), key-set recipe, context contract with `isDisabled`, stable reference note |

## SCSS Budget

Current baseline ~3.1 kB (based on file size observed). The change adds:

- Two `grid-template-columns: repeat(var(--cld-week-columns), 1fr)` rules replacing hardcoded `7` (no size increase)
- `.cld-month__day--disabled { ... }` rule
- `.cld-month__day--disabled:hover { background: transparent; cursor: not-allowed; }` rule

Estimated delta < +150 bytes. Total remains well under the 4 kB warning threshold. If sizing approaches threshold, we can consolidate the disabled rules.

## Precedence Ladder

Exact ordering as implemented:

1. Component state classes: `cld-month__day--outside` (if not in month)
2. `cld-month__day--today` (today in local calendar)
3. `cld-month__day--selected` (same day as `value`)
4. `cld-month__day--disabled` (predicate true) — appended after state; visual effect: hover neutralized explicitly; cursor not-allowed
5. Consumer classes from `DayStyle.class` (appended last)
6. Inline styles from `--cld-day-*` (via `[style]` object form) — set border/color/background custom properties; `background`/`color` can be overridden by selected/today via CSS variables cascade depending on rules, but the selected/today classes define their own `background`/`color` in the stylesheet. The disabled hover neutralizer explicitly sets `background: transparent` on hover for disabled cells; selected/disabled combination: selected sets `background: var(--cld-accent)` and also has `:hover` keeping it — disabled state doesn't override selected background except via the specific disabled:hover rule not targeting selected? The disabled rule is `.cld-month__day--disabled:hover` (specificity 0,2,0). Selected also has `.cld-month__day--selected:hover` (0,2,0) — same specificity; source order may decide, but both want to control background. The spec states "disabled MAY combine with today/selected/outside classes" and "disabled today keeps its ring"; precedence must be explicit. Tests should assert combinations.

## Testing Strategy (Strict TDD)

### Pure helpers (unit tests, no TestBed)

**`resolveVisibleWeekdays`** (date-utils.spec.ts):

- `'all'` → set containing 0,1,2,3,4,5,6 (size 7)
- `'mondayToFriday'` → {1,2,3,4,5} (size 5)
- `'mondayToSaturday'` → {1,2,3,4,5,6} (size 6)
- `[]` → falls back to `'all'` (size 7)
- `[6,0]` (weekends only) → {0,6} (size 2); input order irrelevant
- `[1,1,9,-2]` → deduped, out-of-range dropped; resolves to {1} (size 1)
- unknown string literal → falls back to `'all'`
- normalization is independent of `firstDayOfWeek` parameter (even if passed)

**`resolveCellClasses`** (component spec, existing describe extended):

- `(inMonth, false,false,false, undefined)` → `[]`
- `(outside,false,false,false,undefined)` → `['cld-month__day--outside']`
- `(inMonth,true,true,false,undefined)` → `['cld-month__day--today','cld-month__day--selected']`
- `(inMonth,false,false,true,undefined)` → `['cld-month__day--disabled']`
- `(inMonth,true,true,true,undefined)` → includes `cld-month__day--disabled` (order: outside,today,selected,disabled)
- `(inMonth,true,true,true,{class:'hl'})` → appends `'hl'` after state+disabled
- `(inMonth,false,true,true,{class:['a','b']})` → spreads after

### Component tests (TestBed)

**Disabled days:**

- Default: no cell has `aria-disabled="true"`; all activatable
- Predicate disables 15th: only 15th button has `aria-disabled="true"`; no `disabled` attr; carries `cld-month__day--disabled`
- Clicking disabled default button: `dayClick` does not emit; `value` unchanged
- Clicking enabled: still emits + selects
- Custom `dayCell` wrapper: disabled cell has `aria-disabled="true"`, `tabindex="0"`; enabled omits `aria-disabled`
- Keyboard on disabled custom wrapper (Enter/Space): no emit, no select
- Keyboard on enabled custom wrapper: emits with `{x:0,y:0}` + selects
- `select()` on disabled date succeeds (sets `value`)
- `goToToday()` works when today is disabled
- `isDisabled` context flag true only for disabled cells (custom template can render mark)
- Disabled + today: both classes present, `aria-disabled="true"`, today ring remains

**Visible days:**

- `'mondayToFriday'`: 30 cells render (6×5); 5 weekday headers; section has `--cld-week-columns: 5` (style proxy); every rendered cell has day in {1..5}
- `'mondayToSaturday'`: 36 cells (6×6); 6 headers; `--cld-week-columns: 6`
- `'all'`: 42 cells, 7 headers, `--cld-week-columns: 7`
- `[6,0]`: 12 cells (2 columns); headers filtered to those days in that order respecting `firstDayOfWeek`
- Input order `[0,6]` vs `[6,0]` gives same membership (count 2)
- Out of range `[1,1,9,-2]` → 6 cells (1 column)
- Empty `[]` → falls back to `'all'` (42 cells)
- `firstDayOfWeek=0` + `'mondayToSaturday'`: 36 cells, no Sunday column; first column is Monday (documented behavior)
- `value` is Saturday with `'mondayToFriday'`: `value` unchanged, no selected cell renders (model authoritative)
- Navigation unchanged by `visibleDays`

All counts derived from set size × 6 (never hardcoded except as derived expectations). jsdom style proxy used to assert `--cld-week-columns` value.

## Risks & Mitigations

| Risk                                                                | Likelihood | Mitigation                                                                                              |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `resolveCellClasses` signature change breaks callers (outside repo) | Low        | Signature change is localized to this codebase; documented in design/spec. No external callers in repo. |
| SCSS crosses 4 kB budget                                            | Low        | Delta < 150B; measure after implementation. Can consolidate rules if needed.                            |
| Disabled + selected hover precedence                                | Med        | Explicit `.cld-month__day--disabled:hover` and keep selected rules; write tests for combination.        |
| Column filtering affects track alignment in some browsers           | Low        | CSS Grid with explicit column count via CSS var is standard; existing 7-column layout already works.    |
| Predicate called frequently (per cell render)                       | Low        | Simple function calls; consumers should pass stable references (documented).                            |
