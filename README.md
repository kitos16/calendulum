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

| Input             | Type                                                   | Default     | Description                                                                           |
| ----------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------- |
| `value` (model)   | `Date \| null`                                         | `null`      | Selected day. Two-way bindable with `[(value)]`.                                      |
| `firstDayOfWeek`  | `0 \| 1`                                               | `1`         | `1` = Monday-first, `0` = Sunday-first.                                               |
| `locale`          | `string`                                               | `LOCALE_ID` | Locale used for titles and weekday labels.                                            |
| `showOutsideDays` | `boolean`                                              | `true`      | Render the 42-cell grid with neighbor-month days.                                     |
| `dayCell`         | `TemplateRef<{ $implicit: CalendulumDayCellContext }>` | —           | Replaces the default day button.                                                      |
| `dayCellTop`      | `TemplateRef<{ $implicit: CalendulumDayCellContext }>` | —           | Overlay template above the day number (default button only).                          |
| `dayCellBottom`   | `TemplateRef<{ $implicit: CalendulumDayCellContext }>` | —           | Overlay template below the day number (default button only).                          |
| `dayStyle`        | `Record<string, DayStyle>`                             | `{}`        | Per-day styles keyed by local ISO date — see [`dayStyle`](#per-day-styling-daystyle). |

| Output        | Type                      | Description                                                                        |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `monthChange` | `Date`                    | Emits the first day of the visible month on navigation.                            |
| `dayClick`    | `CalendulumDayClickEvent` | Emits `{ date, x, y }` on day activation — see [day clicks](#day-clicks-dayclick). |

`CalendulumDayCellContext` is the implicit template context (bound via `let-day`) and exposes
`{ date: Date, inMonth: boolean, isToday: boolean, isSelected: boolean }` — the flags reflect
the current `value` and today at render time.

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
- A `dayStyle` `border` **always applies** — the state rules do not set a border.
- Consumer `class` entries are merged with (never replace) the state classes.
- Outside (neighbor-month) cells: the `--outside` state class overrides the cell text color,
  so a `color` entry has no visible effect on them (backgrounds and borders still apply).

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
