# context-contract Specification

## Purpose

Implement the documented `dayCell` template context contract so README and demo references
(e.g. `day.isToday`) compile and behave as documented.

## Requirements

### Requirement: template context exposes date, inMonth, isToday, isSelected, isDisabled

Every day template outlet (`dayCell`, `dayCellTop`, `dayCellBottom`) MUST provide an implicit
context value exposing `date: Date`, `inMonth: boolean`, `isToday: boolean`,
`isSelected: boolean`, and `isDisabled: boolean`. The flags MUST reflect current component state
at render time. The exported `CalendulumDayCellContext` type MUST describe this shape.
(Previously: context exposed `date`, `inMonth`, `isToday`, and `isSelected` only.)

#### Scenario: demo `day.isToday` works

- GIVEN a custom `dayCell` template using `day.isToday` (as in the demo)
- WHEN the grid renders
- THEN `day.isToday` evaluates to a boolean and is true for today's cell only

#### Scenario: isSelected reflects the value model

- GIVEN `value` is set to a date rendered in the grid
- WHEN the grid renders
- THEN that cell's context has `isSelected: true` and all other cells `false`

#### Scenario: flags update on selection change

- GIVEN a rendered grid
- WHEN a different day is clicked
- THEN the previously selected cell's context reports `isSelected: false`
- AND the newly selected cell's context reports `isSelected: true`

#### Scenario: slot templates expose isDisabled

- GIVEN `dayCellBottom` renders a mark when `day.isDisabled` is true and the 15th is disabled
- WHEN the grid renders
- THEN only the disabled cells show the mark in the bottom slot

### Requirement: README documents the actual contract

README MUST document the context as `{ date, inMonth, isToday, isSelected, isDisabled }` —
naming `isSelected`, not `selected` — matching the exported type exactly.
(Previously: README documented `{ date, inMonth, isToday, isSelected }`.)

#### Scenario: README matches the exported type

- GIVEN the README's context documentation
- WHEN it is compared with `CalendulumDayCellContext`
- THEN field names and types match exactly

### Requirement: DayCell stays pure

`DayCell` in `date-utils` MUST NOT gain component state; today/selection flags live only in
the component's template context.

#### Scenario: DayCell shape is unchanged

- GIVEN the `DayCell` interface
- WHEN it is inspected
- THEN it contains only `date` and `inMonth`
