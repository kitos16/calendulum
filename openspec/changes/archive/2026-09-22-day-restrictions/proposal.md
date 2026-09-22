# Proposal: Day Restrictions

## Intent

Consumers cannot express two everyday constraints: dates that must not be activatable (booked, holidays, past) and work-week views (Mon–Fri / Mon–Sat). Today every cell is clickable and all columns render.

## Scope

### In Scope

- `isDayDisabled` predicate + UI-path guards: `onDayClick`/`onDayKeydown` blocked (no `dayClick`, no select); `select()` unconditional.
- Focusable `aria-disabled` (native `disabled` rejected — drops tab order); `--disabled` class + hover neutralizer; `isDisabled` context; README key-set recipe (`dateKey`).
- `visibleDays` union (`all | mondayToFriday | mondayToSaturday | readonly Weekday[]`); column projection keeps 6 rows (42/36/30 cells); header filtered likewise; `--cld-week-columns` binding; invalid → `all`.
- Demo cards; README API rows + precedence/visibility contracts.

### Out of Scope

- `minDate`/`maxDate`, selection-range (start/end), date-picker sizing.
- `value`/navigation changes; `buildMonthGrid` changes.

## Capabilities

### New Capabilities

- `disabled-days`: predicate input, UI-path guards, focusable `aria-disabled`, `--disabled` styling, `isDisabled` context, edge combos.
- `visible-days`: union input, column projection, header/column-count binding, normalization, `firstDayOfWeek` interplay.

### Modified Capabilities

- `context-contract`: context requirement gains `isDisabled` (type + README updated).

## Approach

Rec. A/A, strict TDD. Disable: handler guards; extend `resolveCellClasses(cell, today, selected, disabled, style)` (inserted param — no in-repo callers). Visible days: `resolveVisibleWeekdays` normalizes presets/arrays to a sorted set; `days`/`weekdays` filter by it; `--cld-week-columns` drives both tracks. Tests assert no-emit/no-select, `aria-disabled`, counts anchored to the set, bound style (jsdom proxy). Defaults keep every existing spec green.

## Decisions

- Predicate for behavior; key-set recipe (`dateKey` + `Set`) documented.
- Weekday columns only — per-date hide rejected (breaks alignment).
- `aria-disabled` + intercept, never native `disabled`.
- `firstDayOfWeek=0` + `mondayToSaturday` omits Sunday — documented.
- Disabled/hidden dates may hold `value` — model authoritative, view a projection.

## Affected Areas

(under `projects/calendulum/src/lib/month/` unless noted)

| Area                                   | Impact   | Change                                          |
| -------------------------------------- | -------- | ----------------------------------------------- |
| `calendulum-month.ts`                  | Modified | Inputs, guards, computeds, context, resolvers   |
| `calendulum-month.html`                | Modified | `aria-disabled`, `--cld-week-columns`           |
| `calendulum-month.scss`                | Modified | `--disabled`, hover neutralizer, dynamic tracks |
| `calendulum-month.spec.ts`             | Modified | Coverage for both capabilities                  |
| `projects/demo/src/app/*`, `README.md` | Modified | Showcase cards; API/docs                        |

## Risks

| Risk                                           | Likelihood | Mitigation               |
| ---------------------------------------------- | ---------- | ------------------------ |
| SCSS crosses 4 kB style budget                 | Med        | Measure at apply; trim   |
| `resolveCellClasses` signature break           | Low        | None in-repo; documented |
| `aria-disabled` regresses to native `disabled` | Med        | Test-asserted            |
| Inline predicate re-fires per CD               | Low        | README: stable reference |
| Month-dependent combo counts                   | Med        | Derive from date logic   |
| `firstDayOfWeek=0` + Mon–Sat surprise          | Med        | README note              |

## Rollback Plan

Additive — revert commits in reverse order; defaults restore today's grid; docs/demo + signature change revert with call sites.

## Dependencies

None — Angular signals and existing helpers only.

## Success Criteria

- [ ] `npx ng test --watch=false` green (new + existing under defaults)
- [ ] `npx ng build calendulum && npx ng build demo` green; SCSS < 4 kB
- [ ] README documents both APIs, precedence, Sunday omission, key-set recipe
- [ ] Demo shows disabled days and a Mon–Fri view
