# Disabled Days Specification

## Purpose

Consumers mark dates that must not be activatable (booked, holidays, past). Disabled days block
only UI activation — no `dayClick`, no selection — while `value` and `select()` stay
unconditional: the view is a projection, never a gatekeeper.

## Requirements

### Requirement: isDayDisabled predicate input

The component SHALL expose `isDayDisabled` as `(date: Date) => boolean`, defaulting to false for
every date. Disabled status SHALL derive per date from the predicate, which MAY capture consumer
state (sets, ranges, holidays).

#### Scenario: predicate disables a single date

- GIVEN `isDayDisabled` is true only for the 15th
- WHEN the grid renders
- THEN only the 15th cell resolves disabled

#### Scenario: default keeps every cell enabled

- GIVEN `isDayDisabled` is unset
- WHEN the grid renders
- THEN every cell resolves enabled and activation works as today

### Requirement: UI activation is blocked for disabled dates

`onDayClick` and `onDayKeydown` MUST short-circuit disabled dates: no `dayClick` emission and no
`value` change, on the default button and the custom `dayCell` wrapper alike, including
outside-month cells.

#### Scenario: clicking a disabled default button is inert

- GIVEN the 15th is disabled
- WHEN the 15th button is clicked
- THEN `dayClick` does not emit and `value` stays null

#### Scenario: keyboard activation of a disabled custom cell is inert

- GIVEN a custom `dayCell` with the 15th disabled
- WHEN Enter and Space are pressed on that wrapper
- THEN no `dayClick` emits each time and `value` stays unchanged

### Requirement: disabled cells keep focus and expose aria-disabled

Neither branch MUST use native `disabled` (it drops the date from tab order); disabled cells MUST
carry `aria-disabled="true"`, enabled MUST NOT.

#### Scenario: disabled default button stays focusable

- GIVEN a disabled day on the default branch
- WHEN the grid renders
- THEN the button has `aria-disabled="true"` and no `disabled` attribute

#### Scenario: disabled custom wrapper is marked and focusable

- GIVEN a custom `dayCell` with a disabled date
- WHEN the grid renders
- THEN the wrapper has `aria-disabled="true"` and `tabindex="0"`
- AND enabled wrappers omit `aria-disabled`

### Requirement: --disabled state class with interaction neutralizer

Cells resolved disabled MUST carry `cld-month__day--disabled`, appended by the exported
`resolveCellClasses` helper. The stylesheet MUST suppress cursor and hover background for the
disabled class while today/selected visuals still apply. Disabled MAY combine with
today/selected/outside classes.

#### Scenario: resolveCellClasses appends the disabled class

- GIVEN a cell resolved disabled and selected
- WHEN `resolveCellClasses` runs
- THEN the result contains `cld-month__day--disabled` and `cld-month__day--selected`

#### Scenario: disabled today keeps its ring

- GIVEN today is disabled
- WHEN the grid renders
- THEN the cell carries `cld-month__day--today` and `cld-month__day--disabled`
- AND `aria-disabled="true"` coexists with the today visuals

### Requirement: isDisabled template context flag

Templates MUST receive `isDisabled` reflecting the predicate so consumers render their own
disabled affordance.

#### Scenario: custom template renders its own disabled mark

- GIVEN a `dayCell` marking days where `day.isDisabled` is true
- WHEN the grid renders
- THEN only the disabled cells show the mark

### Requirement: select() stays unconditional

`select(date)` MUST NOT consult the predicate: a disabled date SHALL still set `value`.
`goToToday` SHALL still work when today is disabled. Disabled state MUST never reject or clear
`value`.

#### Scenario: programmatic selection of a disabled date succeeds

- GIVEN the 15th is disabled
- WHEN `select()` is called with the 15th
- THEN `value` is the 15th and the cell shows disabled styling

### Requirement: README documents the API and key-set recipe

README MUST document `isDayDisabled` in the API table, the stable-reference contract (stable
function reference; inline arrows re-fire per change detection), and the key-set recipe
`(d) => keys.has(dateKey(d))` over a `Set` of `dateKey` strings.

#### Scenario: README documents the key-set recipe

- GIVEN the README `isDayDisabled` section
- WHEN a consumer disables a fixed set of dates
- THEN it shows the `dateKey` `Set` closure and the stable-reference note
