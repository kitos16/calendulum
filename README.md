# Calendulum

> Derived from _Calendula_, the marigold flower named after the Roman _calendae_ — it blooms every month, like the calendars you build.

A reusable, customizable calendar suite for modern Angular (17+). Standalone components, signals, SCSS theming, zero external runtime dependencies.

**Status:** early development — the first slice (`CalendulumMonth`) is working; the full suite (week/month/day views, date/range pickers, agenda, drag & drop, i18n) is on the roadmap.

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Theming](#theming)
- [Custom templates](#custom-templates)
- [Per-day styling (`dayStyle`)](#per-day-styling-daystyle)
- [Day clicks (`dayClick`)](#day-clicks-dayclick)
- [Disabled days (`isDayDisabled`)](#disabled-days-isdaydisabled)
- [Visible days (`visibleDays`)](#visible-days-visibledays)
- [Day cell slots](#day-cell-slots)
- [Development](#development)
- [Roadmap](#roadmap)
- [License](#license)

## Install

Not yet published to npm — use the source workspace while it matures.

## Usage

```ts
import { Component, signal } from '@angular/core';
import { CalendulumMonth } from 'calendulum';

@Component({
  selector: 'app-root',
  imports: [CalendulumMonth],
  template: `
    <calendulum-month [(value)]="selected" />
    <p>Selected: {{ selected() }}</p>
  `,
})
export class App {
  readonly selected = signal<Date | null>(null);
}
```

## API

### `CalendulumMonth`

| Input             | Type                                                                    | Default       | Description                                                                                |
| ----------------- | ----------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `value` (model)   | `Date \| null`                                                          | `null`        | Selected day. Two-way bindable with `[(value)]`.                                           |
| `firstDayOfWeek`  | `0 \| 1`                                                                | `1`           | `1` = Monday-first, `0` = Sunday-first.                                                    |
| `locale`          | `string`                                                                | `LOCALE_ID`   | Locale used for titles and weekday labels.                                                 |
| `showOutsideDays` | `boolean`                                                               | `true`        | Render the 42-cell grid with neighbor-month days.                                          |
| `dayCell`         | `TemplateRef<{ $implicit: CalendulumDayCellContext }>`                  | —             | Replaces the default day button.                                                           |
| `dayCellTop`      | `TemplateRef<{ $implicit: CalendulumDayCellContext }>`                  | —             | Overlay template above the day number (default button only).                               |
| `dayCellBottom`   | `TemplateRef<{ $implicit: CalendulumDayCellContext }>`                  | —             | Overlay template below the day number (default button only).                               |
| `dayStyle`        | `Record<string, DayStyle>`                                              | `{}`          | Per-day styles keyed by local ISO date — see [`dayStyle`](#per-day-styling-daystyle).      |
| `isDayDisabled`   | `(date: Date) => boolean`                                               | `() => false` | Marks dates that refuse UI activation — see [disabled days](#disabled-days-isdaydisabled). |
| `visibleDays`     | `'all' \| 'mondayToFriday' \| 'mondayToSaturday' \| readonly Weekday[]` | `'all'`       | Projects whole weekday columns — see [visible days](#visible-days-visibledays).            |

| Output        | Type                      | Description                                                                        |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `monthChange` | `Date`                    | Emits the first day of the visible month on navigation.                            |
| `dayClick`    | `CalendulumDayClickEvent` | Emits `{ date, x, y }` on day activation — see [day clicks](#day-clicks-dayclick). |

`CalendulumDayCellContext` is the implicit template context (bound via `let-day`) and exposes
`{ date: Date, inMonth: boolean, isToday: boolean, isSelected: boolean, isDisabled: boolean }`
— the flags reflect the current `value`, today, and the `isDayDisabled` predicate at render
time. The type and this documentation always match field-for-field.

## Theming

The component is styled with CSS custom properties scoped through `:host`:

```
--cld-accent, --cld-accent-contrast, --cld-accent-soft,
--cld-bg, --cld-border, --cld-text, --cld-text-muted,
--cld-radius
```

Override them on the component selector or a parent:

```css
calendulum-month {
  --cld-accent: oklch(68% 0.17 65);
  --cld-bg: oklch(99% 0.01 75);
}
```

## Custom templates

Pass any template as `dayCell` — it receives the day context via `let-day` and replaces the
default interaction cell:

```html
<calendulum-month [dayCell]="dayCell" />
<ng-template #dayCell let-day>
  <span [class.today]="day.isToday">{{ day.date.getDate() }}</span>
</ng-template>
```

The custom cell wrapper is interactive with button semantics: it has `role="button"` and
`tabindex="0"`, and activation (click, Enter, Space) emits `dayClick` and selects the day —
the same behavior as the default button.

## Per-day styling (`dayStyle`)

Style individual days with a record keyed by local ISO date strings (`YYYY-MM-DD`). Keys are
produced with the exported `dateKey()` helper, which uses local calendar getters (never
`toISOString`, so keys never shift across timezones):

```ts
import { dateKey, DayStyle } from 'calendulum';

const styles: Record<string, DayStyle> = {
  [dateKey(today)]: { border: '2px solid tomato' }, // border only
  [dateKey(holiday)]: { background: 'pink', color: '#7a1f1f' }, // fill + text
  [dateKey(special)]: { class: ['hl', 'spin'] }, // extra classes
};
```

```html
<calendulum-month [dayStyle]="styles" />
```

Each entry may set `border`, `color`, `background` (raw CSS strings) and `class` (string or
string array). They are applied through the per-cell custom properties `--cld-day-border`,
`--cld-day-color`, and `--cld-day-bg`, consumed by the base cell rule — so **state classes
win over `dayStyle`**:

- Today and selected cells keep their state background/text color even when the entry sets
  `background` or `color`.
- A `dayStyle` `border` **always applies** — the state rules do not set a border (the one
  documented exception).
- Consumer `class` entries are merged with (never replace) the state classes.
- Outside (neighbor-month) cells: the `--outside` state class overrides the cell text color,
  so a `color` entry has no visible effect on them (backgrounds and borders still apply).

The full visual precedence ladder, highest first: selected background/text > today/disabled
state styles > hover > `dayStyle` background/color — with `dayStyle` border as the exception
that always applies.

## Day clicks (`dayClick`)

Activating a day (click on the default button or a custom `dayCell` wrapper) emits
`dayClick` with `{ date, x, y }`, where `x`/`y` are the event's viewport coordinates
(`clientX`/`clientY`), and then selects the day through the `value` model — `dayClick` is
additive to selection.

Clicking an outside day emits and selects without navigating: the view month is unchanged and
`monthChange` does not fire. Hidden decorative cells (with `showOutsideDays` off) never emit.

Keyboard activation (custom `dayCell` only — Enter and Space) also emits `dayClick`; a
`KeyboardEvent` carries no coordinates, so the payload uses the documented convention
`{ date, x: 0, y: 0 }`.

To anchor a popover or tooltip to the clicked day, translate the viewport point into the
calendar's coordinate space:

```ts
onDayClick({ date, x, y }: CalendulumDayClickEvent) {
  const host = this.calendarRef.nativeElement.getBoundingClientRect();
  popover.show(date, { left: x - host.left, top: y - host.top });
}
```

## Disabled days (`isDayDisabled`)

Mark dates that must not be activatable (booked, holidays, past) with a predicate:

```ts
import { dateKey } from 'calendulum';

const holidayKeys = new Set([dateKey(new Date(2026, 11, 25))]);
const isDayDisabled = (d: Date) => holidayKeys.has(dateKey(d));
```

```html
<calendulum-month [isDayDisabled]="isDayDisabled" />
```

Pass a **stable function reference** — inline arrows (`[isDayDisabled]="(d) => ..."`) create a
new function every change detection and re-fire the predicate for every cell. The key-set recipe
above (`Set` of `dateKey()` strings + a stable closure) is the recommended pattern for a fixed
set of dates; ranges and recurring rules are one-liners in the same shape.

Disabled state is **UI-only**:

- Disabled dates emit no `dayClick` and never set `value` — from the default button, the custom
  `dayCell` wrapper, and outside-month cells alike (Enter/Space included).
- Programmatic `select(date)` and `goToToday()` stay unconditional: a disabled date can still
  hold the `value` model, and today can be disabled without breaking "Today".
- Disabled cells stay **focusable** — `aria-disabled="true"` with no native `disabled`
  attribute, on both branches, so screen-reader users still reach and hear the date.
- Cells resolve the `cld-month__day--disabled` state class (appended by `resolveCellClasses`).
  The stylesheet suppresses the hover background and the pointer cursor, while today/selected
  visuals still apply (a disabled today keeps its ring; a disabled selected day keeps its
  accent). The disabled hover neutralizer yields to the selected hover background.
- Templates receive `isDisabled` in the context, so custom `dayCell` content can render its own
  disabled affordance:

```html
<calendulum-month [dayCell]="dayCell" [isDayDisabled]="isDayDisabled" />
<ng-template #dayCell let-day>
  <span [class.struck]="day.isDisabled">{{ day.date.getDate() }}</span>
</ng-template>
```

## Visible days (`visibleDays`)

Restrict the calendar to a working-week view by projecting away whole weekday columns — never
individual dates, so every row stays complete and the grid always renders **6 rows**:

- `'all'` (default) — 7 columns, 42 cells.
- `'mondayToFriday'` — {1,2,3,4,5}, 5 columns, 30 cells.
- `'mondayToSaturday'` — {1,2,3,4,5,6}, 6 columns, 36 cells.
- `readonly Weekday[]` — any weekday list (`0` = Sunday … `6` = Saturday); values are deduped
  and sorted, out-of-range numbers are dropped, and an empty resolved set falls back to
  `'all'` — the grid never renders zero columns. Any other value also normalizes to `'all'`.

```html
<calendulum-month [visibleDays]="'mondayToFriday'" />
```

Column count is derived from the resolved set and bound as `--cld-week-columns` on the section;
both the header track and the grid consume it (`repeat(var(--cld-week-columns), 1fr)`), so
labels always align with their columns. It is safe to combine with `dayStyle`, `dayCell`, the
slots, and `isDayDisabled` — the predicate is only consulted for cells that exist.

Behavioral notes:

- **Hidden weekday `value`**: the model is authoritative, the view is a projection. A `value`
  landing on a hidden weekday stays set with no selected cell rendered.
- **`firstDayOfWeek=0` + `mondayToSaturday`**: the Sunday column simply does not exist — the
  first column is Monday (label order still follows `firstDayOfWeek`).
- **Navigation is unchanged** by `visibleDays`: months move and `monthChange` fires the same,
  with the same filter applied to the new month.

## Day cell slots

`dayCellTop` and `dayCellBottom` render consumer content above/below the day number without
disturbing its centered position (absolute overlays, `pointer-events: none`). They receive the
same context as `dayCell`:

```html
<calendulum-month [dayCellTop]="top" [dayCellBottom]="bottom" />
<ng-template #top let-day>
  <span class="badge" [class.hot]="day.isToday">★</span>
</ng-template>
<ng-template #bottom let-day> @if (day.isSelected) { <span class="dot">●</span> } </ng-template>
```

Slot content never intercepts pointer events — clicks landing on it still activate the day.
When `dayCell` is provided, it fully replaces the cell and slots do not render.

## Development

Workspace with a publishable library and a showcase demo:

```bash
npm install          # library + demo deps (project references)
ng serve demo        # run the demo at http://localhost:4200
ng test calendulum   # library unit tests (vitest + jsdom)
ng build demo        # production build of the demo
```

## Roadmap

- Month view polish: mobile, keyboard navigation, week numbers
- Event agenda and week/day views
- Date picker, range picker
- Locale/i18n utilities
- Drag & drop for events

## License

[MIT](LICENSE) © 2026 Marco Ornelas
