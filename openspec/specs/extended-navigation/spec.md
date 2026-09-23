## Purpose

The component exposes `minDate` and `maxDate` bounds that clamp the `value`, disable navigation beyond bounds, and merge with `isDayDisabled` to disable cells outside bounds. A `monthSelector` input chooses between dropdown (native `<select>`), arrows, or no month navigation.

## Requirements

### Requirement: minDate and maxDate bound inputs

The component SHALL expose `minDate: Date | null` and `maxDate: Date | null` inputs, both defaulting to `null` (unbounded). Bounds are inclusive — dates equal to `minDate` or `maxDate` are within bounds.

#### Scenario: minDate clamps value on set

- GIVEN `minDate` is 2026-01-01
- WHEN `value` is set to 2025-12-15
- THEN `value` becomes 2026-01-01 (clamped to minDate)

#### Scenario: maxDate clamps value on set

- GIVEN `maxDate` is 2026-12-31
- WHEN `value` is set to 2027-01-15
- THEN `value` becomes 2026-12-31 (clamped to maxDate)

#### Scenario: value within bounds is unchanged

- GIVEN `minDate` is 2026-01-01 and `maxDate` is 2026-12-31
- WHEN `value` is set to 2026-06-15
- THEN `value` stays 2026-06-15

#### Scenario: null bounds impose no limit

- GIVEN `minDate` is `null` and `maxDate` is `null`
- WHEN `value` is set to any date
- THEN `value` is never clamped

### Requirement: navigation buttons disable when view would exceed bounds

The previous/next month buttons MUST be disabled (and carry `aria-disabled="true"`) when navigating would move the view month outside the bounds.

#### Scenario: previous button disables at minDate month

- GIVEN `minDate` is 2026-03-15 and view month is March 2026
- WHEN the grid renders
- THEN the previous button has `aria-disabled="true"`

#### Scenario: next button disables at maxDate month

- GIVEN `maxDate` is 2026-09-15 and view month is September 2026
- WHEN the grid renders
- THEN the next button has `aria-disabled="true"`

#### Scenario: buttons enable when view has room to navigate

- GIVEN `minDate` is 2026-01-01, `maxDate` is 2026-12-31, view month is June 2026
- WHEN the grid renders
- THEN both previous and next buttons are enabled

### Requirement: cells outside bounds render disabled

Dates before `minDate` or after `maxDate` MUST resolve as disabled through the existing `isDisabled` logic (merged with `isDayDisabled` predicate). Disabled cells block `dayClick` and selection, carry `aria-disabled="true"`, and show disabled styling.

#### Scenario: cell before minDate is disabled

- GIVEN `minDate` is 2026-06-01
- WHEN the grid renders May 2026
- THEN all May cells have `isDisabled: true` and `aria-disabled="true"`

#### Scenario: cell after maxDate is disabled

- GIVEN `maxDate` is 2026-09-30
- WHEN the grid renders October 2026
- THEN all October cells have `isDisabled: true` and `aria-disabled="true"`

#### Scenario: bounds combine with isDayDisabled predicate

- GIVEN `minDate` is 2026-06-01 and `isDayDisabled` disables 2026-06-15
- WHEN the grid renders June 2026
- THEN 2026-06-01 through 2026-05-31 are disabled (bounds), 2026-06-15 is disabled (predicate), other June dates are enabled

#### Scenario: programmatic select of out-of-bounds date succeeds

- GIVEN `maxDate` is 2026-09-30
- WHEN `select(2026-10-15)` is called
- THEN `value` becomes 2026-10-15 (select is unconditional per disabled-days spec)

### Requirement: monthSelector input chooses navigation mode

The component SHALL expose `monthSelector` accepting `'dropdown' | 'arrows' | 'none'`, defaulting to `'arrows'`.

#### Scenario: arrows mode shows previous/next buttons

- GIVEN `monthSelector` is `'arrows'` (default)
- WHEN the grid renders
- THEN previous/next month buttons render
- AND no dropdown renders

#### Scenario: dropdown mode shows native select

- GIVEN `monthSelector` is `'dropdown'`
- WHEN the grid renders
- THEN a native `<select>` renders in the header with month options
- AND previous/next buttons do not render

#### Scenario: none mode hides all month navigation

- GIVEN `monthSelector` is `'none'`
- WHEN the grid renders
- THEN neither arrows nor dropdown render
- AND the header shows only the month label

### Requirement: dropdown options respect bounds

When `monthSelector='dropdown'`, the `<select>` options MUST include only months within the effective bounds (or all 12 months if no bounds). The current view month MUST be the selected option.

#### Scenario: dropdown shows all months when no bounds

- GIVEN `monthSelector='dropdown'`, no `minDate`/`maxDate`
- WHEN the grid renders
- THEN the select has 12 options (January–December)

#### Scenario: dropdown excludes months before minDate

- GIVEN `monthSelector='dropdown'`, `minDate` is 2026-06-15
- WHEN the grid renders any month
- THEN the select options start at June 2026

#### Scenario: dropdown excludes months after maxDate

- GIVEN `monthSelector='dropdown'`, `maxDate` is 2026-09-15
- WHEN the grid renders any month
- THEN the select options end at September 2026

#### Scenario: dropdown selection changes view month

- GIVEN `monthSelector='dropdown'`, view is June 2026
- WHEN the user selects August 2026 from the dropdown
- THEN the view month changes to August 2026
- AND `monthChange` emits the new month start date

### Requirement: dropdown uses native select for accessibility

The month selector dropdown MUST be a native `<select>` element styled via CSS custom properties (`--cld-font`, `--cld-radius`, `--cld-bg`, `--cld-border`). No custom dropdown markup SHALL be used.

#### Scenario: dropdown is a native select element

- GIVEN `monthSelector='dropdown'`
- WHEN the grid renders
- THEN the header contains a `<select>` element (not a custom dropdown)

#### Scenario: dropdown styles via CSS custom properties

- GIVEN `monthSelector='dropdown'` and `cornerRadius='lg'`
- WHEN the grid renders
- THEN the select element has `border-radius: var(--cld-radius)`

#### Scenario: dropdown has proper label for accessibility

- GIVEN `monthSelector='dropdown'`
- WHEN the grid renders
- THEN the select has an associated `<label>` or `aria-label` describing "Month"
