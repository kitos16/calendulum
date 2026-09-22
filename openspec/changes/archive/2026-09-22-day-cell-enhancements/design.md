# Design: Day Cell Enhancements

## Technical Approach

All four specs are additive over the existing standalone signal component. Three deliberate strict-TDD seams: pure helpers (`dateKey`, `resolveDayStyle`, `resolveCellClasses`) carry the decision logic and are unit-tested without TestBed; the template stays a thin shell binding their outputs; interaction tests dispatch constructed `MouseEvent`s (jsdom `.click()` yields `clientX/clientY = 0`). A spike experiment (temporary spec, since removed) proved Angular 21's object-form `[style]` binding writes CSS custom properties inline — the per-cell styling mechanism is confirmed empirically, not assumed.

## Architecture Decisions

### Decision: Per-cell styling — object-form `[style]` + custom properties

| Option                                          | Tradeoff                                                                                            | Decision            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| `[style]="{ '--cld-day-bg': ... }"` object form | Spike green (3/3, Angular 21.2 + jsdom 28): custom props written inline, `null` leaves no attribute | **Chosen**          |
| Per-property `[style.--cld-day-bg]` bindings    | Also works (spike baseline)                                                                         | Fallback documented |
| `[ngStyle]` / direct inline declarations        | Inline styles outrank state classes — selected/today affordances silently disappear                 | Rejected            |

State rules (`.cld-month__day--today/--selected/--outside`) appear later in the stylesheet at equal specificity (0,1,0) and do not set `border`, so state wins background/color while `--cld-day-border` always applies. Hover (`:hover`, 0,2,0) still overrides. README states this precedence explicitly.

### Decision: `dayClick` coordinate capture

`(click)="onDayClick(cell.date, $event)"` on both the default button and the custom-cell wrapper; `onDayClick` emits `{ date, x: event.clientX, y: event.clientY }` (viewport-relative) then calls the existing `select(date)` — additive. Keyboard activation (custom wrapper only) uses `onDayKeydown`, because `KeyboardEvent` has no `clientX/clientY`; keyboard emits `{ date, x: 0, y: 0 }` (documented convention; spec only requires the date).

### Decision: Context contract shape

`CalendulumDayCellContext` becomes the flat value `{ date, inMonth, isToday, isSelected }` — the exact shape of `$implicit`, so `let-day` + `day.isToday` works (the demo's dead reference). Inputs are typed `TemplateRef<{ $implicit: CalendulumDayCellContext }>`. `DayCell` stays pure in `date-utils`; a `cellContext(cell)` factory builds the flat value per outlet from `isToday()`/`isSelected()`.

### Decision: Type and helper homes

| Symbol                                                            | Home                                      | Rationale                                                             |
| ----------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `dateKey`                                                         | `date-utils.ts`                           | It is a date helper; local getters + padding, never `toISOString`     |
| `DayStyle`, `CalendulumDayClickEvent`, `CalendulumDayCellContext` | `calendulum-month.ts`                     | Component API surface; `public-api.ts` already `export *`s both files |
| `resolveDayStyle`, `resolveCellClasses`                           | `calendulum-month.ts` (exported pure fns) | Colocated with `DayStyle`; unit-testable without TestBed              |

`dayStyle = input<Record<string, DayStyle>>({})` — empty default avoids `undefined` branches in template bindings.

### Decision: Slot layout

Top/bottom slots render only in the default-button branch (`@if (dayCell())` fully replaces the button — slots MUST NOT render). They are absolutely-positioned spans inside the button (`position: relative` added to `.cld-month__day`), `pointer-events: none`, so the centered number never shifts (no visual regression) and real clicks pass through; in jsdom, dispatched clicks on slot content bubble structurally to the button handler — one behavior, both worlds.

## Data Flow

```
dateKey(key) ──► dayStyle Record ──► resolveDayStyle ──► [style] ──► --cld-day-* inline ──► SCSS var() ──► cell look
click (button | custom wrapper) ──► onDayClick ──► dayClick.emit + select ──► value model
        ──► isToday/isSelected ──► cellContext ──► $implicit ──► let-day flags (all 3 outlets)
```

## File Changes

| File                                                   | Action    | Description                                                                                                                 |
| ------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `projects/calendulum/src/lib/month/date-utils.ts`      | Modify    | Add `dateKey()`                                                                                                             |
| `projects/calendulum/src/lib/month/date-utils.spec.ts` | Create    | `dateKey` unit tests                                                                                                        |
| `.../calendulum-month/calendulum-month.ts`             | Modify    | Types, `dayClick`, `dayStyle`/`dayCellTop`/`dayCellBottom` inputs, `onDayClick`/`onDayKeydown`, `cellContext`, pure helpers |
| `.../calendulum-month.html`                            | Modify    | Handler wiring, `[style]`/`[class]`, slot outlets, wrapper `role`/`tabindex`                                                |
| `.../calendulum-month.scss`                            | Modify    | `var()` consumption, `position: relative`, slot wrapper rules                                                               |
| `.../calendulum-month.spec.ts`                         | Modify    | Pure-helper describe + capability tests                                                                                     |
| `projects/demo/src/app/app.html`, `app.scss`, `app.ts` | Modify    | Showcase cards; `day.isToday` now real                                                                                      |
| `README.md`                                            | Modify    | API entries, context contract, precedence, coordinate recipe                                                                |
| `projects/calendulum/src/public-api.ts`                | No change | `export *` already covers both modules                                                                                      |

## Interfaces / Contracts

```ts
// date-utils.ts
export function dateKey(date: Date): string; // "2026-09-22" — local, padded, no toISOString

// calendulum-month.ts
export interface CalendulumDayClickEvent {
  date: Date;
  x: number;
  y: number;
} // x/y = clientX/clientY
export interface DayStyle {
  border?: string;
  color?: string;
  background?: string;
  class?: string | string[];
}
export interface CalendulumDayCellContext {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}
export function resolveDayStyle(
  style: Record<string, DayStyle>,
  key: string,
): Record<string, string>;
export function resolveCellClasses(
  cell: DayCell,
  today: boolean,
  selected: boolean,
  style: DayStyle | undefined,
): string[];
```

Component members: `dayClick = output<CalendulumDayClickEvent>()`; `dayStyle = input<Record<string, DayStyle>>({})`; `dayCell`/`dayCellTop`/`dayCellBottom` = `input<TemplateRef<{ $implicit: CalendulumDayCellContext }> | null>(null)`. `select()` stays public (used by `goToToday`).

## SCSS Budget

New inline custom properties: `--cld-day-border`, `--cld-day-color`, `--cld-day-bg`. New classes: `.cld-month__day-top`, `.cld-month__day-bottom`. One modified rule (`position: relative` on `.cld-month__day`). Est. +~600 B on a ~3.4 kB file — stays under the 4 kB `anyComponentStyle` warning; re-verified after apply.

## Testing Strategy

| Layer       | What                                    | Approach                                                                                                                  |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Unit (pure) | `dateKey`                               | Padding (`2026-01-05`); local 23:30 case asserts `2026-09-22` in any TZ; no `toISOString` drift                           |
| Unit (pure) | `resolveDayStyle`, `resolveCellClasses` | Map content; absent key → `{}`; consumer class appended, never replacing state classes                                    |
| Integration | `dayClick` coords                       | Dispatch `new MouseEvent('click', { clientX: 120, clientY: 340, bubbles: true })`; triangulate two points                 |
| Integration | Outside / hidden cells                  | Outside click emits + selects, `monthChange` silent; decorative-span click emits nothing                                  |
| Integration | Custom wrapper a11y                     | `role="button"`/`tabindex="0"`; Enter + Space `KeyboardEvent`s emit (x: 0, y: 0) + select                                 |
| Integration | Context contract                        | Marker templates (`day.isToday`/`day.isSelected`); flags flip on selection change                                         |
| Integration | Slots                                   | Spans only when provided; `dayCell` + slots → only custom content; click on slot content bubbles; styled cell keeps entry |
| Integration | Styling proxy                           | Assert inline `--cld-day-*` custom props (jsdom cannot resolve `var()` or layout — documented proxy)                      |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Additive; the only documented behavior change is custom `dayCell` becoming interactive (click/Enter/Space emit `dayClick` + select).

## Open Questions

None.
