# Delta for context-contract

## ADDED Requirements

### Requirement: template context exposes weekNumber, isInRange, isRangeStart, isRangeEnd

Every day template outlet (`dayCell`, `dayCellTop`, `dayCellBottom`) MUST provide an implicit context value additionally exposing `weekNumber: number | null`, `isInRange: boolean`, `isRangeStart: boolean`, and `isRangeEnd: boolean`. The exported `CalendulumDayCellContext` type MUST describe this extended shape.

(Previously: context exposed `date`, `inMonth`, `isToday`, `isSelected`, and `isDisabled` only.)

#### Scenario: weekNumber is set for week number column cells

- GIVEN `weekNumbers=true` and the grid renders
- WHEN a week number column cell renders
- THEN its context has `weekNumber: <iso-week>` (e.g., 23)
- AND regular day cells have `weekNumber: null`

#### Scenario: isInRange marks cells inside a selection range

- GIVEN `selectionMode='range'` with `value={start: 2026-06-15, end: 2026-06-20}`
- WHEN the grid renders
- THEN cells from 2026-06-15 to 2026-06-20 have `isInRange: true`
- AND cells outside the range have `isInRange: false`

#### Scenario: isRangeStart marks the range start cell

- GIVEN `selectionMode='range'` with `value={start: 2026-06-15, end: 2026-06-20}`
- WHEN the grid renders
- THEN the 2026-06-15 cell has `isRangeStart: true`
- AND all other cells have `isRangeStart: false`

#### Scenario: isRangeEnd marks the range end cell

- GIVEN `selectionMode='range'` with `value={start: 2026-06-15, end: 2026-06-20}`
- WHEN the grid renders
- THEN the 2026-06-20 cell has `isRangeEnd: true`
- AND all other cells have `isRangeEnd: false`

#### Scenario: single mode cells have range flags false

- GIVEN `selectionMode='single'` with `value=2026-06-15`
- WHEN the grid renders
- THEN all cells have `isInRange: false`, `isRangeStart: false`, `isRangeEnd: false`

#### Scenario: multiple mode cells have range flags false

- GIVEN `selectionMode='multiple'` with `value=[2026-06-15, 2026-06-20]`
- WHEN the grid renders
- THEN all cells have `isInRange: false`, `isRangeStart: false`, `isRangeEnd: false`

#### Scenario: range flags update on selection change

- GIVEN `selectionMode='range'` with `value={start: 2026-06-15, end: 2026-06-20}`
- WHEN a new range is selected (e.g., 2026-07-01 to 2026-07-05)
- THEN the old range cells' flags become false
- AND the new range cells' flags become true accordingly

### Requirement: README documents the extended contract

README MUST document the context as `{ date, inMonth, isToday, isSelected, isDisabled, weekNumber, isInRange, isRangeStart, isRangeEnd }` — matching the exported type exactly.

#### Scenario: README matches the extended exported type

- GIVEN the README's context documentation
- WHEN it is compared with `CalendulumDayCellContext`
- THEN all 9 field names and types match exactly
