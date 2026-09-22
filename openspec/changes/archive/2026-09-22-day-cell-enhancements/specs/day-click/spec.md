# day-click Specification

## Purpose

Day cells emit a typed `dayClick` event carrying viewport coordinates for popover/anchoring
consumers, additive to existing selection. Custom `dayCell` templates gain the same
interaction with accessibility parity.

## Requirements

### Requirement: dayClick output with viewport coordinates

The component SHALL expose an output `dayClick` emitting `{ date: Date; x: number; y: number }`.
`x` and `y` MUST be viewport-relative (the click's `clientX`/`clientY`). The payload `date`
MUST be the clicked cell's calendar date.

#### Scenario: click on an in-month day emits payload and selects

- GIVEN a rendered month grid
- WHEN the default button for day D is clicked at viewport point (120, 340)
- THEN `dayClick` emits `{ date: D, x: 120, y: 340 }`
- AND `value` updates to D via the existing `select()` behavior

#### Scenario: two clicks at different points produce distinct coordinates

- GIVEN a rendered month grid
- WHEN two different days are clicked at different viewport points
- THEN each emitted payload's `x`/`y` equal the respective event's `clientX`/`clientY`

### Requirement: dayClick is additive to selection

`dayClick` MUST NOT alter selection semantics: clicking still selects through the `value`
model, and clicking an outside day selects it without changing the view month or emitting
`monthChange`.

#### Scenario: outside day click emits and selects without navigation

- GIVEN `showOutsideDays` is true
- WHEN an outside (neighbor-month) day is clicked
- THEN `dayClick` emits with that date
- AND `value` becomes that date
- AND the view month is unchanged and `monthChange` does not emit

#### Scenario: hidden outside cells do not emit

- GIVEN `showOutsideDays` is false
- WHEN the grid renders an empty decorative cell for a hidden outside day
- THEN no `dayClick` is emitted for that cell

### Requirement: custom dayCell interaction parity

When `dayCell` is provided, the custom cell wrapper MUST emit `dayClick` and select on
activation, and MUST expose button semantics: `role="button"`, `tabindex="0"`, and activation
on Enter and Space.

#### Scenario: click on custom cell emits and selects

- GIVEN a custom `dayCell` template is provided
- WHEN the custom cell wrapper is clicked
- THEN `dayClick` emits with the cell's date
- AND `value` updates to that date

#### Scenario: custom cell wrapper has button semantics

- GIVEN a custom `dayCell` template is provided
- WHEN the grid renders
- THEN the cell wrapper has `role="button"` and `tabindex="0"`

#### Scenario: Enter and Space activate a focused custom cell

- GIVEN a custom cell wrapper has keyboard focus
- WHEN Enter is pressed, and separately when Space is pressed
- THEN `dayClick` emits with the cell's date each time
- AND `value` updates to that date
