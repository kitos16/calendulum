## Purpose

The component supports three selection modes — single, multiple, and range — with a discriminated union `value` type and an optional ISO week number column. The default `'single'` mode preserves backward compatibility with `Date | null`.

## Requirements

### Requirement: selectionMode input with three modes

The component SHALL expose a `selectionMode` input accepting `'single' | 'multiple' | 'range'`, defaulting to `'single'`. The mode determines the `value` type and selection behavior.

#### Scenario: single mode accepts Date or null

- GIVEN `selectionMode` is `'single'` (default)
- WHEN `value` is set to a `Date` or `null`
- THEN the value is accepted and stored

#### Scenario: multiple mode accepts Date array

- GIVEN `selectionMode` is `'multiple'`
- WHEN `value` is set to `Date[]`
- THEN the value is accepted and stored

#### Scenario: range mode accepts start/end object

- GIVEN `selectionMode` is `'range'`
- WHEN `value` is set to `{ start: Date | null; end: Date | null }`
- THEN the value is accepted and stored

#### Scenario: invalid value for mode normalizes safely

- GIVEN `selectionMode='multiple'` and `value` is set to a single `Date`
- WHEN the model normalizes
- THEN `value` becomes `[date]` (wrapped in array)

### Requirement: value type is a discriminated union

The exported `CalendulumValue` type SHALL be a union of the three mode-specific shapes, with `selectionMode` as the discriminant for type narrowing. Default `'single'` mode SHALL accept `Date | null` without requiring an explicit `selectionMode` input (backward compatibility).

#### Scenario: single mode type narrows to Date | null

- GIVEN `selectionMode: 'single'` and `value: Date | null`
- WHEN consumer reads `value`
- THEN TypeScript narrows to `Date | null`

#### Scenario: multiple mode type narrows to Date[]

- GIVEN `selectionMode: 'multiple'` and `value: Date[]`
- WHEN consumer reads `value`
- THEN TypeScript narrows to `Date[]`

#### Scenario: range mode type narrows to start/end object

- GIVEN `selectionMode: 'range'` and `value: { start: Date | null; end: Date | null }`
- WHEN consumer reads `value`
- THEN TypeScript narrows to the range object

### Requirement: single mode selection behavior

In `'single'` mode, clicking a day sets `value` to that date (replacing previous). Clicking the selected day again sets `value` to `null`. `isSelected` is true only for the single selected date.

#### Scenario: click selects a day

- GIVEN `selectionMode='single'`, `value=null`
- WHEN day 2026-06-15 is clicked
- THEN `value` becomes 2026-06-15
- AND that cell has `isSelected: true`

#### Scenario: click on selected day clears selection

- GIVEN `selectionMode='single'`, `value=2026-06-15`
- WHEN day 2026-06-15 is clicked again
- THEN `value` becomes `null`
- AND no cell has `isSelected: true`

### Requirement: multiple mode selection behavior

In `'multiple'` mode, clicking a day toggles its presence in the `value` array. Order in the array SHOULD reflect selection order (most recent last). `isSelected` is true for all dates in the array.

#### Scenario: click adds day to selection

- GIVEN `selectionMode='multiple'`, `value=[]`
- WHEN day 2026-06-15 is clicked
- THEN `value` becomes `[2026-06-15]`
- AND that cell has `isSelected: true`

#### Scenario: click removes day from selection

- GIVEN `selectionMode='multiple'`, `value=[2026-06-15, 2026-06-20]`
- WHEN day 2026-06-15 is clicked
- THEN `value` becomes `[2026-06-20]`
- AND 2026-06-15 cell has `isSelected: false`

#### Scenario: multiple selections render all selected

- GIVEN `selectionMode='multiple'`, `value=[2026-06-15, 2026-06-20]`
- WHEN the grid renders
- THEN both cells have `isSelected: true`

### Requirement: range mode selection behavior

In `'range'` mode, the first click sets `start`, the second click sets `end` (if after start) or replaces `start` (if before start). Clicking a third time resets to a new `start`. `isSelected`, `isInRange`, `isRangeStart`, `isRangeEnd` flags reflect the range state.

#### Scenario: first click sets range start

- GIVEN `selectionMode='range'`, `value={start: null, end: null}`
- WHEN day 2026-06-15 is clicked
- THEN `value` becomes `{ start: 2026-06-15, end: null }`
- AND that cell has `isRangeStart: true`, `isSelected: true`

#### Scenario: second click after start sets range end

- GIVEN `selectionMode='range'`, `value={start: 2026-06-15, end: null}`
- WHEN day 2026-06-20 is clicked
- THEN `value` becomes `{ start: 2026-06-15, end: 2026-06-20 }`
- AND start cell has `isRangeStart: true`, end cell has `isRangeEnd: true`
- AND cells between have `isInRange: true`, `isSelected: true`

#### Scenario: second click before start replaces start

- GIVEN `selectionMode='range'`, `value={start: 2026-06-20, end: null}`
- WHEN day 2026-06-15 is clicked
- THEN `value` becomes `{ start: 2026-06-15, end: 2026-06-20 }` (auto-reordered)

#### Scenario: third click resets to new start

- GIVEN `selectionMode='range'`, `value={start: 2026-06-15, end: 2026-06-20}`
- WHEN day 2026-07-01 is clicked
- THEN `value` becomes `{ start: 2026-07-01, end: null }`
- AND only the new start cell has `isRangeStart: true`

#### Scenario: range with disabled bounds clamps correctly

- GIVEN `selectionMode='range'`, `maxDate=2026-06-30`, `value={start: 2026-06-15, end: null}`
- WHEN day 2026-07-10 is clicked
- THEN `end` clamps to 2026-06-30 (maxDate bound)

### Requirement: weekNumbers boolean adds ISO week column

The component SHALL expose a `weekNumbers` boolean input, defaulting to `false`. When `true`, an ISO week number column (1–53) is prepended to the grid. The `--cld-week-columns` CSS variable increments by 1 (7→8 for `all`, 5→6 for `mondayToFriday`, etc.). The column header shows "Wk".

#### Scenario: weekNumbers adds column when true

- GIVEN `weekNumbers=true`, `visibleDays='all'`
- WHEN the grid renders
- THEN 8 columns render (7 weekdays + 1 week number)
- AND `--cld-week-columns: 8`

#### Scenario: weekNumbers column shows ISO week numbers

- GIVEN `weekNumbers=true`, view is June 2026
- WHEN the grid renders
- THEN the first column shows ISO week numbers (23, 24, 25, 26, 27)

#### Scenario: weekNumbers header shows Wk label

- GIVEN `weekNumbers=true`
- WHEN the grid renders
- THEN the first header cell shows "Wk"

#### Scenario: weekNumbers works with visibleDays

- GIVEN `weekNumbers=true`, `visibleDays='mondayToFriday'`
- WHEN the grid renders
- THEN 6 columns render (5 weekdays + 1 week number)
- AND `--cld-week-columns: 6`

#### Scenario: weekNumbers=false hides week column

- GIVEN `weekNumbers=false` (default)
- WHEN the grid renders
- THEN no week number column renders
- AND `--cld-week-columns` equals weekday column count

### Requirement: week number context flag for templates

When `weekNumbers=true`, the day cell context for the week number column MUST include `weekNumber: number`. Regular day cells have `weekNumber: null`.

#### Scenario: week number cells expose weekNumber

- GIVEN `weekNumbers=true`
- WHEN the grid renders
- THEN week number column cells have `weekNumber: <iso-week>`
- AND regular day cells have `weekNumber: null`

### Requirement: selection mode and weekNumbers work with bounds

All selection modes and `weekNumbers` MUST correctly respect `minDate`/`maxDate` bounds (clamping, disabled cells, navigation limits).

#### Scenario: range selection clamps to maxDate

- GIVEN `selectionMode='range'`, `maxDate=2026-06-30`, `value={start: 2026-06-15, end: null}`
- WHEN day 2026-07-05 is clicked
- THEN `value` becomes `{ start: 2026-06-15, end: 2026-06-30 }`

#### Scenario: multiple selection ignores out-of-bounds clicks

- GIVEN `selectionMode='multiple'`, `minDate=2026-06-01`, `value=[]`
- WHEN day 2026-05-15 is clicked
- THEN `value` remains `[]` (click blocked by disabled logic)

### Requirement: backward compatibility with Date | null

When `selectionMode` is not provided (default `'single'`), the component MUST accept `value` as `Date | null` and behave identically to the pre-selection-modes behavior. No migration SHALL be required for existing consumers.

#### Scenario: existing consumer without selectionMode works

- GIVEN a consumer using `[(value)]="selectedDate"` with `Date | null`
- WHEN the component loads
- THEN it works without any `selectionMode` input
