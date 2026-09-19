# Calendulum

> Derived from *Calendula*, the marigold flower named after the Roman *calendae* — it blooms every month, like the calendars you build.

A reusable, customizable calendar suite for modern Angular (17+). Standalone components, signals, SCSS theming, zero external runtime dependencies.

**Status:** early development — the first slice (`CalendulumMonth`) is working; the full suite (week/month/day views, date/range pickers, agenda, drag & drop, i18n) is on the roadmap.

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Theming](#theming)
- [Custom templates](#custom-templates)
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

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (model) | `Date \| null` | `null` | Selected day. Two-way bindable with `[(value)]`. |
| `firstDayOfWeek` | `0 \| 1` | `1` | `1` = Monday-first, `0` = Sunday-first. |
| `locale` | `string` | `LOCALE_ID` | Locale used for titles and weekday labels. |
| `showOutsideDays` | `boolean` | `true` | Render the 42-cell grid with neighbor-month days. |
| `dayCell` | `TemplateRef<CalendulumDayCellContext>` | — | Replaces the default day button. |

| Output | Type | Description |
| --- | --- | --- |
| `monthChange` | `Date` | Emits the first day of the visible month on navigation. |

`CalendulumDayCellContext` exposes `{ date: Date, inMonth: boolean, isToday: boolean, selected: boolean }`.

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

Pass any template as `dayCell` — it receives the day context via `let-day` and replaces the default interaction cell:

```html
<calendulum-month [dayCell]="dayCell" />
<ng-template #dayCell let-day>
  <span [class.today]="day.isToday">{{ day.date.getDate() }}</span>
</ng-template>
```

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