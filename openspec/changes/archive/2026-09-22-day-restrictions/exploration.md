# Exploration: day-restrictions

Change: `day-restrictions` — project `calendulum`
Phase: sdd-explore — artifact `exploration.md`
Date: 2026-09-22

## Current State

`CalendulumMonth` is a standalone, signal-based month grid. Relevant facts today:

- **Grid geometry**: `buildMonthGrid(view, firstDayOfWeek)` (in `date-utils.ts`) always returns
  **42 cells = exactly 6 complete weeks** (the offset aligns cell 0 to `firstDayOfWeek`, so every
  row of 7 is a full week). The component renders all 42; `showOutsideDays=false` swaps
  neighbor-month cells for `aria-hidden` decorative spans — the 7-column track structure never
  changes. Both `.cld-month__weekdays` and `.cld-month__grid` hardcode
  `grid-template-columns: repeat(7, 1fr)` in SCSS.
- **Selection**: `value = model<Date | null>(null)`; public `select(date)` is unconditional.
  `onDayClick(date, event)` emits `dayClick` then calls `select()`; `onDayKeydown(date)` does the
  same with the `{ x: 0, y: 0 }` convention. Both are wired to the default `<button>` (native
  click/Enter/Space) and the custom `dayCell` wrapper (`role="button"`, `tabindex="0"`,
  explicit keydown handlers). There is **no disabled concept anywhere** — every rendered cell is
  activatable.
- **State rendering**: `resolveCellClasses(cell, today, selected, style)` (exported pure helper)
  builds `--outside` / `--today` / `--selected` + appended consumer class;
  `resolveDayStyle` maps `dayStyle` entries to per-cell `--cld-day-*` custom properties.
  Documented precedence: state classes beat `dayStyle` on background/color; `dayStyle` border
  always applies.
- **Context contract**: `CalendulumDayCellContext = { date, inMonth, isToday, isSelected }` —
  flags reflect component state at render time (`DayCell` itself stays pure in `date-utils`;
  archived change `day-cell-enhancements` explicitly decided component state must not leak into
  `date-utils`).
- **Header**: `weekdays = computed(() => weekdayLabels(locale, firstDayOfWeek))` — always 7
  labels, parallel to the 7 tracks.
- **Tests**: vitest + jsdom, strict TDD. Behavioral assertions (`aria-selected`, emitted
  payloads, inline `--cld-day-*` props) plus pure-helper unit tests; jsdom cannot resolve
  `var()` or layout — bound attribute/style values are the documented proxy.

## Affected Areas

- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.ts` — new inputs
  (`isDayDisabled`, `visibleDays`), guards in `onDayClick`/`onDayKeydown`, `days`/`weekdays`
  computeds filtered by the visible set, `columnCount` derived value, `isDisabled` context flag,
  extended `resolveCellClasses`, new pure resolver(s).
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.html` —
  `aria-disabled` bindings on both branches, dynamic grid-column binding for header + grid.
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.scss` — `--disabled`
  state rule, hover suppression, `repeat(var(--cld-week-columns), 1fr)` in both track rules.
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.spec.ts` — pure-helper +
  behavior tests for both capabilities and their combinations.
- `projects/demo/src/app/app.{ts,html,scss}` — showcase cards (disabled days, Mon–Fri view).
- `README.md` — API table rows, new sections, precedence/visibility contracts.
- `projects/calendulum/src/lib/month/date-utils.ts` — **unchanged** (`buildMonthGrid` keeps its
  42-cell contract; filtering happens in the component).
- `projects/calendulum/src/public-api.ts` — unchanged (`export *` covers new exports).

## Approaches

### Capability 1 — Disabled days

Keying question first: the request offers predicate vs. key set vs. weekday rules. Weekday rules
are a strict subset of both others (`(d) => [0, 6].includes(d.getDay())`) and, as a _disable_
rule, would duplicate what Capability 2 does structurally better (hide vs. disable) — it is not
worth its own input.

| Approach                                                                  | Pros                                                                                                                                                                                                 | Cons                                                                                                                                                     | Complexity |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **A. Predicate input** `isDayDisabled = input<(date: Date) => boolean>`   | Most general: covers key sets, ranges, holidays, weekdays as one-line closures; single input, no precedence between inputs; mirrors Angular Material's `dateFilter`; behavior-shaped like `select()` | Function inputs have an identity footgun (inline arrows re-fire every CD — document "pass a stable reference"); plain data lists need a `dateKey` recipe | Low        |
| B. Key set `disabledDays = input<readonly string[]>` keyed by `dateKey()` | Matches the `dayStyle` Record precedent exactly; declarative, serializable, no identity issues                                                                                                       | Ranges/holiday rules must be enumerated; "every Sunday" needs pre-computed keys; less general                                                            | Low        |
| C. Union input `string[] \| predicate`                                    | Both ergonomics                                                                                                                                                                                      | Two resolution paths + precedence docs; bigger surface for a 4 kB component                                                                              | Medium     |
| D. Weekday-rules input `disabledWeekdays: number[]`                       | Trivial "block weekends"                                                                                                                                                                             | Too narrow; subsumed by A and by `visibleDays`                                                                                                           | Low        |

**Behavior contract (applies to any chosen API):**

- **UI-only restriction**: guards live in `onDayClick`/`onDayKeydown` — no `dayClick` emit, no
  `select()`. Public `select()` stays unconditional (programmatic seeding of a disabled date is a
  consumer decision; `goToToday` keeps working even if today is disabled). The view restriction
  never corrupts the `value` model — same philosophy as the archived context-contract decision.
- **A11y**: `aria-disabled="true"` + **keep focusable** (do NOT set native `disabled` — native
  disabled drops the cell from tab order and screen readers lose the date). Default buttons get
  the attribute; native Enter/Space fires `click`, so the single `onDayClick` guard covers mouse
  and keyboard. Custom `dayCell` wrapper gets `aria-disabled` + the same guards on its keydown
  handlers. A new `isDisabled` context flag lets custom templates render their own affordance
  (the component cannot style consumer content — `isSelected` precedent).
- **Visual**: new state class `cld-month__day--disabled`; suppresses `cursor: pointer` and the
  `:hover` background (needs an explicit `--disabled:hover` neutralizer — `:hover` at (0,2,0)
  outranks a bare class). Precedence ladder to document: selected/today keep their informative
  visuals (state wins), disabled governs interaction affordances (cursor/hover) and mutes text
  only when not selected/today. `dayStyle` border still applies (existing border exception).
- **Edge combos**: disabled + today → ring stays, not clickable; disabled + selected (programmatic
  value or predicate flip) → both classes, `aria-disabled="true"` + `aria-selected="true"` coexist
  truthfully, selection visuals win; disabled + outside month → same guard; disabled + custom
  `dayCell` → wrapper guarded, context flag exposed.

**Recommendation: A** — predicate input. `dayStyle` remains the _data-shaped_ input (Record keyed
by `dateKey`); disabled days are _behavior_, and behavior reads naturally as a predicate. Recipe
for key sets documented in README:
`(d) => holidayKeys.has(dateKey(d))` with a `Set` for O(1).

**Strict-TDD seams**: extend `resolveCellClasses(cell, today, selected, disabled, style)` (exported
pure helper — appending a parameter is a signature change; no external callers in-repo, flag as
minor in proposal); guard logic unit-testable through behavior tests asserting no emit / no
select / `aria-disabled` attribute (same style as `aria-selected` assertions).

### Capability 2 — Visible-days filter

The decisive insight: **visible-days must be a column (weekday) filter, not a per-date predicate.**
Hiding arbitrary individual dates would punch holes in rows and break alignment; hiding whole
weekdays removes complete columns. Because all 42 cells form 6 _complete_ weeks, filtering to a
weekday set yields deterministic geometry: **6 rows × |visible| cells = 42 / 36 (Mon–Sat) / 30
(Mon–Fri)** — row count never changes, so the "no jumping rows" contract survives.

| Approach                                                                                                                                                               | Pros                                                                                                                                                                                                                                              | Cons                                                                                                                                                                                                             | Complexity |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **A. Single union input + column projection** `visibleDays = input<'all' \| 'mondayToFriday' \| 'mondayToSaturday' \| readonly Weekday[]>` resolved to a weekday `Set` | One knob; presets for the common cases, weekday array as escape hatch (covers every future preset); header labels, `days` filter, and track count all derive from one resolved set; navigation untouched; defaults preserve today's 42-cell tests | Dynamic `grid-template-columns` (bound once as `--cld-week-columns` on the section, consumed by both track rules); jsdom can't verify layout — assert the bound style value (documented `--cld-day-*` precedent) | Medium     |
| B. Keep 7 tracks, decorative placeholders for hidden weekdays                                                                                                          | Fixed geometry                                                                                                                                                                                                                                    | Empty gutter columns waste exactly the space the feature exists to reclaim; header alignment games                                                                                                               | Medium     |
| C. Per-date predicate `(date) => boolean` as the escape hatch                                                                                                          | Familiar callback shape                                                                                                                                                                                                                           | **Breaks column semantics** (per-date holes misalign rows); cannot derive header labels reliably → rejected on architecture grounds                                                                              | —          |
| D. Boolean `showWeekends`-style flags                                                                                                                                  | Simple                                                                                                                                                                                                                                            | Boolean soup; can't express custom sets (e.g. Fri+Sat off); presets already cover the booleans                                                                                                                   | Low        |

**Recommendation: A**, with these contracts:

- **Input**: exact preset literals `all` (default) | `mondayToFriday` | `mondayToSaturday`, or a
  weekday-number array (`0`–`6`, order-insensitive, deduped). Exported type
  `CalendulumVisibleDays`. Normalization decisions for design: invalid numbers dropped; empty
  result after normalization → fall back to `all` (defensive, never renders a zero-column grid).
  Pure resolver `resolveVisibleWeekdays(value): Weekday[]` (sorted in `firstDayOfWeek` order)
  is the strict-TDD seam, colocated with the other exported helpers in `calendulum-month.ts`.
- **Geometry**: `buildMonthGrid` stays untouched; the component's `days` computed filters cells
  whose `date.getDay()` is visible (component-level view filter — respects the archived "DayCell
  stays pure" decision). Hidden-weekday cells are removed entirely (not decorated): with
  `showOutsideDays=false`, a row is `|visible|` items mixing buttons and decorative spans — always
  aligned because every row has the same visible weekdays.
- **Header**: `weekdays` computed filters `weekdayLabels()` output by the same resolved set, so
  label count always equals column count. `columnCount = resolved.length` bound as the
  `--cld-week-columns` custom property consumed by `.cld-month__weekdays` and `.cld-month__grid`
  (`repeat(var(--cld-week-columns), 1fr)`) — one binding, both rules.
- **Navigation**: unchanged. Any non-empty weekday set occurs ≥4 times per month, so a month can
  never be empty; `goToToday` may select a date on a hidden weekday — the `value` model is
  independent of the view, so no selected cell is visible (document as known behavior, same
  philosophy as disabled days).
- **`firstDayOfWeek` interplay**: `mondayToSaturday` with `firstDayOfWeek=0` (Sunday-first)
  renders Mon–Sat columns — the Sunday column simply does not exist; label order still follows
  `firstDayOfWeek`. Surprising but correct; document.

### Interplay between the two capabilities

Orthogonal inputs, no shared state: `visibleDays` decides which cells _exist_; `isDayDisabled`
decides which existing cells _refuse activation_ (predicate never consulted for hidden columns —
irrelevant by construction). Both compose with `showOutsideDays`, `dayStyle`, `dayCell`, and the
slots. Neither ever mutates `value` — programmatic selection can land on a disabled or hidden
date; the model is authoritative, the view is a projection.

## Recommendation

One additive change, two capabilities, no breaking API (one minor exported-helper signature
extension):

1. **Disabled days** — predicate input `isDayDisabled: (date: Date) => boolean`; UI-path guards
   in `onDayClick`/`onDayKeydown` (no emit, no select); `select()` stays unconditional; state
   class `--disabled` with hover/cursor suppression; `aria-disabled="true"` while staying
   focusable on both branches; context gains `isDisabled`; `resolveCellClasses` gains a `disabled`
   param (pure TDD seam).
2. **Visible days** — union input `visibleDays: 'all' | 'mondayToFriday' | 'mondayToSaturday' |
readonly Weekday[]` resolved by a pure helper to a weekday set; column projection in the
   `days`/`weekdays` computeds (6 rows preserved: 42/36/30 cells); one `--cld-week-columns`
   custom property drives both track rules; navigation and `value` untouched.

Strict TDD: pure helpers (`resolveVisibleWeekdays`, extended `resolveCellClasses`) carry decision
logic; integration tests assert `aria-disabled`, absence of `dayClick`/`valueChange` emissions,
filtered button counts (anchored to the resolved set, not magic numbers), and the bound
`--cld-week-columns` value (jsdom layout proxy). Defaults keep every existing spec green
(`42 buttons`, `repeat(7,1fr)` equivalent at default).

## Risks

- **SCSS budget**: prior change estimated the style file near the 4 kB `anyComponentStyle`
  warning after +~600 B. Disabled rule + dynamic-track change + hover neutralizer may cross the
  threshold — measure in design/apply; trim if warned.
- **Exported helper signature change**: `resolveCellClasses` gains a parameter — a breaking
  change for any external direct caller (none in-repo); note in proposal, keep positional append
  or move to an options object (design call).
- **Precedence ladder grows**: selected/today vs. disabled vs. hover vs. `dayStyle` must be
  documented explicitly or consumers will fight the cascade (same lesson as `day-styling`).
- **A11y choice is load-bearing**: native `disabled` would silently drop dates from tab order;
  the `aria-disabled` + intercept pattern must be asserted in tests so it can't regress.
- **Predicate identity footgun**: inline arrows in templates re-fire the input every change
  detection — README must say "pass a stable function reference"; cheap at 42 cells but a
  documented contract.
- **Combination test counts**: `visibleDays × showOutsideDays × disabled` produces month-dependent
  button counts (e.g. in-month weekdays vary 20–23) — tests must derive expectations from the
  date logic or anchor to a fixed month, never hardcode.
- **Invalid `visibleDays` values**: empty array, out-of-range numbers, wrong runtime types need a
  defined normalization (fallback to `all`) or the grid can render zero columns.
- **`firstDayOfWeek=0` + preset surprise**: Mon–Sat view under Sunday-first ordering omits Sunday
  entirely — must be stated in README to avoid "bug" reports.
- **Docs/demo drift**: README API table, new sections, and demo cards must land in the same
  change (recurring lesson from the archived change).
- **Row-completeness assumption**: the 30/36 counts depend on `buildMonthGrid` producing 6
  complete weeks — lock it with tests so a future builder change cannot silently break filtering.

## Ready for Proposal

**Yes.** Tell the user: both capabilities are additive with defaults that preserve current
behavior (42-cell grid, all days visible, everything clickable); the recommended API is a
`isDayDisabled` predicate (key-set recipe documented) plus a `visibleDays` union input
(`all | mondayToFriday | mondayToSaturday | weekday[]`) implemented as column projection that
keeps 6 stable rows; disabled days block only UI activation (click/keyboard/`dayClick`) while the
`value` model and `select()` stay unconditional; a11y uses focusable `aria-disabled` cells with a
new `isDisabled` context flag; one minor exported-helper signature extension and one SCSS budget
check are the only sharper edges to confirm in proposal/design.
