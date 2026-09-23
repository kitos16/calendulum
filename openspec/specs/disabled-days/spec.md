# Disabled Days Specification

## Purpose

Consumers mark dates that must not be activatable (booked, holidays, past). Disabled days block
only UI activation — no `dayClick`, no selection — while `value` and `select()` stay
unconditional: the view is a projection, never a gatekeeper.

## Requirements

### Requirement: isDayDisabled predicate input

The component SHALL expose `isDayDisabled` as `(date: Date) => boolean`, defaulting to false for
every date. Disabled status SHALL derive per date from the predicate, which MAY capture consumer
state (sets, ranges, holidays). Additionally, dates outside `minDate`/`maxDate` bounds (when set) MUST resolve as disabled regardless of the predicate. The effective disabled state is the logical OR of the predicate result and the bounds check.

(Previously: disabled status derived only from the `isDayDisabled` predicate.)

#### Scenario: predicate disables a single date

- GIVEN `isDayDisabled` is true only for the 15th
- WHEN the grid renders
- THEN only the 15th cell resolves disabled

#### Scenario: default keeps every cell enabled

- GIVEN `isDayDisabled` is unset
- WHEN the grid renders
- THEN every cell resolves enabled and activation works as today

#### Scenario: minDate disables cells before bound

- GIVEN `minDate` is 2026-06-01, `isDayDisabled` returns false for all dates
- WHEN the grid renders May 2026
- THEN all May cells resolve disabled (bounds check)

#### Scenario: maxDate disables cells after bound

- GIVEN `maxDate` is 2026-09-30, `isDayDisabled` returns false for all dates
- WHEN the grid renders October 2026
- THEN all October cells resolve disabled (bounds check)

#### Scenario: bounds combine with isDayDisabled predicate (OR logic)

- GIVEN `minDate` is 2026-06-01 and `isDayDisabled` disables 2026-06-15
- WHEN the grid renders June 2026
- THEN 2026-06-01 through 2026-05-31 are disabled (bounds)
- AND 2026-06-15 is disabled (predicate)
- AND other June dates are enabled

#### Scenario: bounds on exact minDate/maxDate are inclusive (enabled)

- GIVEN `minDate` is 2026-06-01, `maxDate` is 2026-06-30
- WHEN the grid renders June 2026
- THEN 2026-06-01 and 2026-06-30 are enabled (inclusive bounds)
- AND 2026-05-31 and 2026-07-01 are disabled

### Requirement: UI activation is blocked for disabled dates

`onDayClick` and `onDayKeydown` MUST short-circuit disabled dates: no `dayClick` emission and no
`value` change, on the default button and the custom `dayCell` wrapper alike, including
outside-month cells. This applies to both predicate-disabled and bounds-disabled dates.

(Previously: only predicate-disabled dates blocked activation.)

#### Scenario: clicking a disabled default button is inert

- GIVEN the 15th is disabled
- WHEN the 15th button is clicked
- THEN `dayClick` does not emit and `value` stays null

#### Scenario: keyboard activation of a disabled custom cell is inert

- GIVEN a custom `dayCell` with the 15th disabled
- WHEN Enter and Space are pressed on that wrapper
- THEN no `dayClick` emits each time and `value` stays unchanged

#### Scenario: clicking a bounds-disabled default button is inert

- GIVEN `minDate` is 2026-06-01
- WHEN the 2026-05-15 button is clicked
- THEN `dayClick` does not emit and `value` stays unchanged

#### Scenario: keyboard activation of a bounds-disabled custom cell is inert

- GIVEN a custom `dayCell` with a date before `minDate`
- WHEN Enter and Space are pressed on that wrapper
- THEN no `dayClick` emits each time and `value` stays unchanged

### Requirement: disabled cells keep focus and expose aria-disabled

Neither branch MUST use native `disabled` (it drops the date from tab order); disabled cells MUST
carry `aria-disabled="true"`, enabled MUST NOT. This applies to both predicate-disabled and bounds-disabled dates.

(Previously: only predicate-disabled dates carried `aria-disabled`.)

#### Scenario: disabled default button stays focusable

- GIVEN a disabled day on the default branch
- WHEN the grid renders
- THEN the button has `aria-disabled="true"` and no `disabled` attribute

#### Scenario: disabled custom wrapper is marked and focusable

- GIVEN a custom `dayCell` with a disabled date
- WHEN the grid renders
- THEN the wrapper has `aria-disabled="true"` and `tabindex="0"`
- AND enabled wrappers omit `aria-disabled`

#### Scenario: bounds-disabled default button stays focusable

- GIVEN a date before `minDate` on the default branch
- WHEN the grid renders
- THEN the button has `aria-disabled="true"` and no `disabled` attribute

#### Scenario: bounds-disabled custom wrapper is marked and focusable

- GIVEN a custom `dayCell` with a date after `maxDate`
- WHEN the grid renders
- THEN the wrapper has `aria-disabled="true"` and `tabindex="0"`
- AND enabled wrappers omit `aria-disabled`

### Requirement: --disabled state class with interaction neutralizer

Cells resolved disabled MUST carry `cld-month__day--disabled`, appended by the exported
`resolveCellClasses` helper. The stylesheet MUST suppress cursor and hover background for the
disabled class while today/selected visuals still apply. Disabled MAY combine with
today/selected/outside classes. This applies to both predicate-disabled and bounds-disabled dates.

(Previously: only predicate-disabled cells carried the disabled class.)

#### Scenario: resolveCellClasses appends the disabled class

- GIVEN a cell resolved disabled and selected
- WHEN `resolveCellClasses` runs
- THEN the result contains `cld-month__day--disabled` and `cld-month__day--selected`

#### Scenario: disabled today keeps its ring

- GIVEN today is disabled
- WHEN the grid renders
- THEN the cell carries `cld-month__day--today` and `cld-month__day--disabled`
- AND `aria-disabled="true"` coexists with the today visuals

#### Scenario: resolveCellClasses appends the disabled class for bounds

- GIVEN a cell before `minDate` and also selected
- WHEN `resolveCellClasses` runs
- THEN the result contains `cld-month__day--disabled` and `cld-month__day--selected`

#### Scenario: bounds-disabled today keeps its ring

- GIVEN today is before `minDate`
- WHEN the grid renders
- THEN the cell carries `cld-month__day--today` and `cld-month__day--disabled`
- AND `aria-disabled="true"` coexists with the today visuals

### Requirement: isDisabled template context flag

Templates MUST receive `isDisabled` reflecting the combined predicate OR bounds check so consumers
render their own disabled affordance.

(Previously: `isDisabled` reflected only the predicate.)

#### Scenario: custom template renders its own disabled mark

- GIVEN a `dayCell` marking days where `day.isDisabled` is true
- WHEN the grid renders
- THEN only the disabled cells show the mark

#### Scenario: custom template renders its own disabled mark for bounds

- GIVEN `minDate` is 2026-06-01 and a `dayCell` marking days where `day.isDisabled` is true
- WHEN the grid renders May 2026
- THEN all May cells show the mark

### Requirement: select() stays unconditional

`select(date)` MUST NOT consult the predicate or bounds: a disabled date (by predicate or bounds)
SHALL still set `value`. `goToToday` SHALL still work when today is disabled. Disabled state
MUST never reject or clear `value`.

(Previously: `select()` ignored only the predicate; now it also ignores bounds.)

#### Scenario: programmatic selection of a disabled date succeeds

- GIVEN the 15th is disabled
- WHEN `select()` is called with the 15th
- THEN `value` is the 15th and the cell shows disabled styling

#### Scenario: programmatic selection of a bounds-disabled date succeeds

- GIVEN `maxDate` is 2026-09-30
- WHEN `select(2026-10-15)` is called
- THEN `value` becomes 2026-10-15 (select is unconditional per disabled-days spec)

### Requirement: README documents the API and key-set recipe

README MUST document `isDayDisabled` in the API table, the stable-reference contract (stable
function reference; inline arrows re-fire per change detection), and the key-set recipe
`(d) => keys.has(dateKey(d))` over a `Set` of `dateKey` strings. README MUST ALSO document that
`minDate`/`maxDate` bounds are merged into the disabled logic (cells outside bounds are disabled
regardless of predicate).

(Previously: README documented only the predicate-based disabled logic.)

#### Scenario: README documents the key-set recipe

- GIVEN the README `isDayDisabled` section
- WHEN a consumer disables a fixed set of dates
- THEN it shows the `dateKey` `Set` closure and the stable-reference note

#### Scenario: README documents the bounds merge behavior

- GIVEN the README `isDayDisabled` and `minDate`/`maxDate` sections
- WHEN a consumer sets bounds
- THEN it shows that bounds-disabled cells combine with predicate-disabled via OR logic
