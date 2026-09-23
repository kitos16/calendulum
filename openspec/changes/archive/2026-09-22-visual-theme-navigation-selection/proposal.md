# Proposal: Visual Theme + Extended Navigation + Selection

## Intent

Bundle three cohesive feature areas into one PR: visual theming inputs, extended navigation with bounds, and selection modes with week numbers. All preserve backward compatibility with existing `CalendulumMonth` consumers.

## Scope

### In Scope

- **Visual**: `fontSize` (`sm`|`md`|`lg`), `density` (`compact`|`cozy`|`spacious`), `cornerRadius` inputs → CSS custom properties
- **Navigation**: `minDate`/`maxDate` bounds (clamp `value`, disable nav buttons, merge with `isDayDisabled`); `monthSelector: 'dropdown'|'arrows'|'none'` (native `<select>` for a11y)
- **Selection**: `selectionMode: 'single'|'multiple'|'range'` with discriminated union `value` type; `weekNumbers` boolean (ISO week numbers column)

### Out of Scope

- `colorScheme` input, full theme object
- `yearSelector`, `viewMode` (year/decade views)
- `firstDayOfWeek` localStorage persistence helper
- Range hover preview, multi-month view

## Capabilities

### New Capabilities

- `visual-theme`: discrete theming inputs mapping to CSS custom properties
- `date-bounds`: `minDate`/`maxDate` clamping and navigation disabling
- `month-selector`: dropdown month picker with native `<select>`
- `selection-modes`: `single`|`multiple`|`range` with discriminated union value
- `week-numbers`: ISO week number column

### Modified Capabilities

- `day-click`: `isDisabled` now also respects `minDate`/`maxDate` bounds
- `visible-days`: bounds applied before weekday filter (bounds are absolute limits)

## Approach

**Value typing**: Simple union `Date | null | Date[] | {start: Date | null; end: Date | null}` with `selectionMode` as discriminant. Default `selectionMode='single'` accepts `Date | null` — no migration needed. Model input normalizes on set.

**Bounds semantics**: `minDate`/`maxDate` are absolute calendar limits. On `value` set, clamp to bounds. Navigation buttons disable when view would exceed bounds. Day cells outside bounds render disabled (merged into `isDisabled()` logic alongside `isDayDisabled` predicate).

**Month selector**: Native `<select>` in header when `monthSelector='dropdown'`. Options = months within bounds (or all 12 if no bounds). Styled via `--cld-font`, `--cld-radius`, `--cld-bg`, `--cld-border`.

**Week numbers**: Boolean `weekNumbers`. When true, prepend ISO week number column (1-53). Grid becomes 8 columns; `--cld-week-columns` updates automatically. Column header shows "Wk".

**SCSS budget**: Current 3582B / 4096B. Strategy: reuse existing CSS vars where possible, consolidate density rules into single `--cld-density` multiplier, avoid new keyframes. Monitor with `npx sass --style=compressed` in CI.

## Affected Areas

| Area                       | Impact   | Description                                                            |
| -------------------------- | -------- | ---------------------------------------------------------------------- |
| `calendulum-month.ts`      | Modified | New inputs, value normalization, bounds logic, selection methods       |
| `calendulum-month.html`    | Modified | Header with month selector, week number column, selection rendering    |
| `calendulum-month.scss`    | Modified | Density/font-size/radius CSS vars, dropdown styles, week number column |
| `date-utils.ts`            | Modified | ISO week number helper, bounds clamping utilities                      |
| `calendulum-month.spec.ts` | Modified | Test suites for all new features                                       |

## Risks

| Risk                               | Likelihood | Mitigation                                                               |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Type complexity confuses consumers | Medium     | Clear README examples; `selectionMode` defaults to `'single'` with `Date | null`                              |
| Test combinatorial explosion       | High       | Derive expectations from logic (oracle pattern), not hardcoded matrices  |
| SCSS budget breach                 | Medium     | Reuse vars, single density multiplier, CI size check                     |
| Breaking `value` model             | Low        | Default `'single'` mode accepts `Date                                    | null` unchanged; union only widens |

## Rollback Plan

Revert `openspec/changes/visual-theme-navigation-selection/` folder. Component returns to post-day-restrictions state (day-click, day-styling, visible-days, disabled-days, context-contract specs intact). No database migrations or API changes.

## Dependencies

- Angular 19+ (signals, model inputs)
- No new external dependencies

## Success Criteria

- [ ] All existing tests pass (no regressions)
- [ ] New tests cover: each selection mode, bounds clamping, month selector a11y, week numbers, density/font-size/radius
- [ ] SCSS compressed size ≤ 4096B
- [ ] `monthSelector='dropdown'` passes axe-core a11y audit
- [ ] `selectionMode='range'` with `minDate`/`maxDate` clamps correctly
- [ ] Backward compat: `[(value)]` with `Date|null` works without `selectionMode` input
