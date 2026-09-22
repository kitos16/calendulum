# Proposal: Day Cell Enhancements

## Intent

Make day cells hostable: click with coordinates, per-day styling + external class, layered content above/below the day number — and implement the documented-but-missing `dayCell` context contract.

## Scope

### In Scope

- `dayClick` output `{ date, x, y }` (viewport `clientX`/`clientY`); additive — keeps `select()`; fires on outside days.
- Custom `dayCell` wrapper emits `dayClick` + selects; a11y parity (`role="button"`, `tabindex="0"`, Enter/Space).
- `dayStyle`: `Record<string, DayStyle>` keyed by local ISO `dateKey()`; fields `border`/`color`/`background`/`class`; via `--cld-day-*` props (state wins by cascade); class merged by `resolveCellClasses`.
- `dayCellTop`/`dayCellBottom` slots (same context), overlay spans, `pointer-events: none`; `dayCell` wins if both.
- Context gains `isToday`/`isSelected`; fix demo `day.isToday`; README recipe.

### Out of Scope

- Container queries; preset dot/dash policy.
- Cell-relative coords output; keyboard grid navigation.
- `value`/`valueChange` model changes.

## Decisions

- **`dayClick` additive** (Rec. A): emits alongside `select()`.
- **Custom `dayCell` parity: yes** — same click+coords, a11y parity; documented behavior change.
- **Context naming**: `isToday`/`isSelected` (not README `selected`); README updated.

## Capabilities

### New Capabilities

- `day-click`: `dayClick` output, viewport coords, additive selection, custom-cell parity + a11y.
- `day-styling`: `dayStyle` input, `dateKey()` keying, per-cell custom properties, class merge.
- `day-cell-content`: top/bottom slots, extended context.

### Modified Capabilities

None — `openspec/specs/` empty.

## Approach

Additive APIs per exploration. Pure helpers `dateKey()`, `resolveCellClasses()`, `resolveDayStyle()` are strict-TDD seams. Coordinate tests dispatch constructed `MouseEvent`s (`.click()` yields 0). Spike-test `[style]` custom-property form; per-property fallback.

## Affected Areas

(under `projects/calendulum/src/lib/month/` unless noted)

| Area                                   | Impact   | Change                             |
| -------------------------------------- | -------- | ---------------------------------- |
| `calendulum-month.ts`                  | Modified | Inputs/outputs, context, handlers  |
| `calendulum-month.html`/`.scss`        | Modified | Wiring, slots, `--cld-day-*` rules |
| `date-utils.ts`                        | Modified | `dateKey()`; `DayCell` untouched   |
| spec + helper spec                     | Modified | TDD coverage                       |
| `projects/demo/src/app/*`, `README.md` | Modified | Showcase; API docs                 |

## Risks

| Risk                           | Likelihood | Mitigation                           |
| ------------------------------ | ---------- | ------------------------------------ |
| UTC keying flips days          | Med        | Local getters + padding; unit-tested |
| Custom-cell click parity       | Med        | Documented; a11y parity              |
| State vs day style precedence  | Med        | Cascade; documented                  |
| jsdom clicks lack coords       | High       | Dispatch `MouseEvent`s               |
| `[style]` custom-property form | Med        | Spike test; fallback                 |
| Style budget / docs drift      | Low–Med    | Lean SCSS; README same commit        |

## Rollback Plan

Additive — revert commits in reverse order; `value`/`select()` untouched; docs/demo revert together.

## Dependencies

None — Angular `output()`/`TemplateRef` only.

## Success Criteria

- [ ] `npx ng test --watch=false` green (new + existing specs)
- [ ] `npx ng build calendulum && npx ng build` green
- [ ] README documents API, context, recipe
- [ ] Demo shows all capabilities; `day.isToday` works
