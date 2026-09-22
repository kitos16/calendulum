# Exploration: day-cell-enhancements

Change: `day-cell-enhancements` — project `calendulum`
Phase: sdd-explore — artifact `exploration.md`
Date: 2026-09-22

## Current State

`CalendulumMonth` is a standalone, signal-based month grid (42 cells, `buildMonthGrid`),
themed with CSS custom properties (`--cld-accent`, `--cld-bg`, ...), with these public members:

- **Model**: `value = model<Date | null>(null)` — selection is two-way bound; `valueChange` is
  free from `model()`.
- **Inputs**: `firstDayOfWeek` (`0 | 1`), `locale`, `showOutsideDays` (bool), `dayCell`
  (`TemplateRef<CalendulumDayCellContext> | null`) — full-cell template replacement.
- **Outputs**: `monthChange: Date` (navigation only).
- **Template**: `@if (dayCell())` renders the custom template inside a **passive** div
  `.cld-month__cell` (no click handler); `@else if (cell.inMonth || showOutsideDays())` renders the
  default `<button class="cld-month__day" (click)="select(cell.date)">` with state classes
  `--outside` / `--today` / `--selected` and `aria-selected`; otherwise an empty decorative span.
- **Styles**: state affordances by class rules; `.cld-month__day` is a square
  (`aspect-ratio: 1`) flex-centered button. `--today` = inset ring, `--selected` = accent
  background + contrast text.
- **Data model**: `DayCell { date: Date; inMonth: boolean }` in `date-utils.ts` — pure,
  immutable, local-calendar dates, DST-safe (no millisecond math). Existing behavior: clicking an
  outside day selects it **without** moving the view.
- **Tests**: 11 library specs + 3 demo specs, all green (`npx ng test --watch=false`).
  Assertions are behavioral (aria-selected, text content, emitted values).

### Drift found (relevant to this change)

- `README.md` documents `CalendulumDayCellContext` as `{ date, inMonth, isToday, selected }`,
  but the code exposes only `{ $implicit: DayCell }` (`{ date, inMonth }`).
- The demo template uses `day.isToday` (`projects/demo/src/app/app.html`). It compiles silently
  because `#dayCell` is an untyped `TemplateRef` (template ref vars are `any` at the call site)
  and evaluates to `undefined` at runtime — the custom-card today highlight never applies.
- This change is the right vehicle to implement the documented context contract.

## Affected Areas

- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.ts` — new `dayClick`
  output, per-day styling input, top/bottom template inputs, extended context interface, click
  handler, computed helpers.
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.html` — click handler
  wiring, per-cell style/class bindings, layer slot wrappers.
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.scss` — per-cell custom
  properties, layer wrapper rules, documented state-vs-data precedence.
- `projects/calendulum/src/lib/month/date-utils.ts` — `dateKey(date)` pure helper (local ISO
  `YYYY-MM-DD`); `DayCell` stays untouched.
- `projects/calendulum/src/lib/month/calendulum-month/calendulum-month.spec.ts` (+ new
  colocated helper spec) — tests for all three capabilities under strict TDD.
- `projects/demo/src/app/app.html`, `app.scss`, `app.ts` — showcase cards for the new
  capabilities; fix the `day.isToday` usage.
- `README.md` — API table update (new inputs/outputs, context contract).

## Approach Analysis per Capability

### Capability 1 — Click coordinates

| Approach                                                                                                                                    | Pros                                                                                                                               | Cons                                                          | Complexity |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------- |
| **A. New `dayClick` output** `{ date, x, y }`; `x`/`y` = `MouseEvent.clientX/clientY` (viewport). Handler also keeps calling `select(date)` | Clean typed payload; selection behavior untouched (backwards compatible); viewport coords are exactly what popover anchoring needs | Coordinate reference must be documented                       | Low        |
| B. Emit `{ date, event: MouseEvent }`                                                                                                       | Consumer derives any frame                                                                                                         | Leaks DOM event; awkward typing for test authors              | Low        |
| C. Emit cell-relative `offsetX/offsetY`                                                                                                     | Intuitive for "inside the cell"                                                                                                    | Almost useless for real overlays; target-relative quirks      | Low        |
| D. No new output; encode coords in `valueChange`                                                                                            | —                                                                                                                                  | Breaks the model contract; impossible to keep the model clean | —          |

**Recommendation: A.** New exported interface
`CalendulumDayClickEvent { date: Date; x: number; y: number }` and output
`dayClick = output<CalendulumDayClickEvent>()`. Contract: `x`/`y` are **viewport-relative**
(`clientX`/`clientY`). Consumers needing cell-relative coordinates subtract
`cell.getBoundingClientRect().left/top` — document this one-liner. Clicking an outside day also
emits (consistent with current selectable-outside behavior). Selection keeps working via the
model; `dayClick` is additive.

**Custom `dayCell` templates**: the custom branch is currently inert. Scope says "when clicking a
day" — uniform behavior means the custom wrapper should also emit `dayClick` (and select).
This is a **behavior change** (custom cells become interactive) and introduces an a11y gap
(div click without keyboard/role); flag it for the proposal and add `role="button"` +
`tabindex="0"` + keydown handling, or explicitly document the partial parity.

**Testability (strict TDD)**: jsdom supports `new MouseEvent('click', { clientX, clientY,
bubbles: true })` + `dispatchEvent`. Plain `.click()` yields `clientX = 0`, so tests must
dispatch constructed events. Triangulation: two clicks at different coordinates.

### Capability 2 — Per-day styling

Keying question first: **key by local ISO date string, never by `Date` reference or day
number.** Grid `Date` instances are recreated on every recompute (reference identity is
useless), and day numbers repeat within a 42-cell grid (e.g. the 1st appears twice when the
month starts mid-week). Add a pure helper in `date-utils.ts`:

```ts
/** Local calendar date key, e.g. "2026-09-22". DST-safe, never UTC-based. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

| Approach                                                                                                                                                                                                                                                                                                 | Pros                                                                                                                                            | Cons                                                                                                            | Complexity |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| **A. Record input + per-cell CSS custom properties** — `dayStyle = input<Record<string, DayStyle>>()`, `DayStyle { class?, border?, color?, background? }`; bind `--cld-day-border/--cld-day-color/--cld-day-bg` inline per button; base SCSS rules consume them; state classes override by source order | State affordances (today/selected) win for free via CSS cascade; theming system stays consistent; no specificity war; class merge stays central | More SCSS work; precedence must be documented                                                                   | Med        |
| B. `[ngStyle]` direct inline styles                                                                                                                                                                                                                                                                      | Trivial binding                                                                                                                                 | Inline styles beat state classes — selected/today affordances silently disappear; consumer fights the component | Low        |
| C. Separate `dayClass` + `dayStyle` inputs                                                                                                                                                                                                                                                               | Fine-grained                                                                                                                                    | Two knobs for one concern; more surface to test                                                                 | Med        |

**Recommendation: A.** `DayStyle` fields hold raw CSS strings (e.g. `border: '1px solid var(--cld-accent)'`),
documented as such. Precedence contract: **state affordances win over per-day data** on
conflicting properties (background/text), because `.cld-month__day--selected`/`--today` rules
appear later in the stylesheet at equal specificity — zero extra code; custom border survives on
selected/today (those rules don't set border). Document this explicitly.

**External class**: `DayStyle.class?: string | string[]`. Bind **one computed full class list**
via a pure helper `resolveCellClasses(cell, isToday, isSelected, dayStyle): string[]`
(component state classes + consumer class appended). `[class]="...array"` merges with the
static `cld-month__day` attribute without conflicts. The pure helper is the strict-TDD seam:
unit-test its string output, never DOM `className` assertions (banned pattern).

Style mapping also goes through a pure helper (`resolveDayStyle(cell, dayStyle): Record<string, string>`
returning the `--cld-day-*` custom-property map) so the `[style]` binding is a thin shell.
Angular supports custom properties in `[style]` bindings; the design phase should confirm the
object-form behavior with a test before committing to it (fallback: one `[style.--cld-day-x]`
binding per property).

### Capability 3 — In-cell content layers

| Approach                                                                                     | Pros                                                                           | Cons                                                                                                                                                                                          | Complexity                                                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **A. Template slots** `dayCellTop` / `dayCellBottom` (`TemplateRef<CalendulumDayCellContext> | null`), rendered in absolutely-positioned wrapper spans above/below the number | Idiomatic Angular (matches existing `dayCell`); consumer decides content per day via context; number stays perfectly centered (overlay, not flow — no jitter when content appears/disappears) | Fixed cell size (`aspect-ratio: 1`) means layers must be small or they overflow | Med |
| B. Data-driven preset layers (map input `{ dot: true }` rendered by the component)           | No templates needed                                                            | Component owns rendering policy; arbitrary content impossible; duplicates what a slot + consumer `@if` does                                                                                   | Med-High                                                                        |
| C. Container queries (`@container` on cells)                                                 | Adaptive cell-internal layout                                                  | jsdom cannot exercise it (no layout); no requirement today; budget cost in the 4 kB component style chunk                                                                                     | High                                                                            |

**Recommendation: A.** Two new template inputs with the same context type as `dayCell`; rendered
only when provided, inside `.cld-month__day-top` / `.cld-month__day-bottom` overlay spans
(`position: absolute`, `pointer-events: none` by default so they never swallow clicks). The day
number keeps its existing centered flex layout unchanged — zero visual regression for existing
consumers. If both `dayCell` and the slots are provided, `dayCell` wins (full replacement takes
precedence; document it).

**Context contract fix (bundled)**: extend `CalendulumDayCellContext` to
`{ $implicit: DayCell; isToday: boolean; isSelected: boolean }`, populated at each outlet from
the existing `isToday()`/`isSelected()` methods. This implements the README-documented contract,
fixes the demo's dead `day.isToday`, and gives slot templates the flags they need. `DayCell`
itself stays pure — component state never leaks into `date-utils`.

## Recommendation (consolidated)

One incremental change, three additive capabilities, plus the context-contract fix:

1. **`dayClick` output** — `{ date, x, y }` viewport coords; keeps `select()`; fires on default
   buttons and (new behavior) custom day-cell wrappers; `role`/keyboard parity addressed in design.
2. **`dayStyle` input** — `Record<string, DayStyle>` keyed by `dateKey()` (local ISO), consumed
   via per-cell `--cld-day-*` custom properties so state affordances keep winning; `class` field
   merged through a computed class list from a pure helper.
3. **`dayCellTop` / `dayCellBottom` template slots** — overlay wrappers, number stays centered;
   no container queries.
4. **Context extension** `{ isToday, isSelected }` — fixes README/demo drift.

Pure helpers to extract for strict TDD: `dateKey()`, `resolveCellClasses()`, `resolveDayStyle()`.
Everything additive → no breaking API changes except the documented custom-cell click parity.

## Risks

- **Date keying**: must be local-calendar based. `Date.prototype.toISOString()` is UTC — using it
  flips the key on the previous/next day in negative-offset timezones. `dateKey()` must use
  `getFullYear/getMonth/getDate` with padding.
- **Duplicate day numbers** in the 42-cell grid make day-number keying impossible; date keys are
  unique within one grid.
- **Precedence ambiguity** (state vs. per-day data): resolved by cascade (state wins), but must be
  documented in the API docs or consumers will fight it.
- **Custom-cell click parity is a behavior change**: today's custom cells are inert. Making them
  clickable can surprise existing consumers and, without `role="button"`/key handling, creates an
  a11y regression. Must be explicit in proposal + design.
- **Strict TDD constraints**: CSS-class and inline-style DOM assertions are banned patterns in
  this project's TDD module — new tests must target the pure helpers' outputs and behavioral
  outcomes (`aria-selected`, emitted payloads), not `className`.
- **jsdom click coordinates**: `.click()` does not carry `clientX/clientY`; coordinate tests must
  construct and dispatch real `MouseEvent`s.
- **`[style]` object binding with custom properties** should be confirmed by a small test in
  design/apply; fallback is one `[style.--cld-day-x]` binding per property.
- **Component style budget**: production `anyComponentStyle` warns at 4 kB; layer wrappers +
  per-day rules add modest size. Keep SCSS lean; re-check the budget after apply.
- **Viewport vs cell-relative coordinates** will be a recurring consumer question — document the
  `getBoundingClientRect()` subtraction recipe in the README.
- **README drift**: docs claim context fields that don't exist; the change must reconcile docs and
  code in the same commit.

## Ready for Proposal

**Yes.** Tell the user: the three capabilities map cleanly onto the existing signal/input/model
architecture as additive, non-breaking APIs; one deliberate behavior change to confirm
(custom `dayCell` templates become clickable, emitting `dayClick` + selecting); coordinates will
be emitted as viewport-relative `x`/`y`; per-day data will be keyed by local ISO date string; and
the change will also implement the already-documented but missing context fields (`isToday`,
`isSelected`) that the README and demo silently rely on.
