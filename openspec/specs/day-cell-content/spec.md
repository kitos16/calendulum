# day-cell-content Specification

## Purpose

`dayCellTop` / `dayCellBottom` template slots render consumer content above/below the
centered day number without disturbing layout, cooperating with `dayStyle` and state classes.

## Requirements

### Requirement: top and bottom slot rendering

The component SHALL expose `dayCellTop` and `dayCellBottom` template inputs. Each MUST render
only when provided, positioned above/below the day number, and MUST NOT shift the day number
away from its centered position when content appears or disappears (overlay layout that does
not participate in the cell's flex flow).

#### Scenario: slot content renders above the number

- GIVEN `dayCellTop` is provided with content
- WHEN the grid renders
- THEN every rendered day cell shows the slot content above its number
- AND the day number remains centered

#### Scenario: absent slots render nothing

- GIVEN neither slot input is provided
- WHEN the grid renders
- THEN no slot wrappers exist in any cell

### Requirement: slots receive the full day context

Slot templates MUST receive the same context as `dayCell`: `day.date`, `day.inMonth`,
`day.isToday`, `day.isSelected`.

#### Scenario: slot template reads context flags

- GIVEN `dayCellBottom` renders `{{ day.isToday ? 'T' : '' }}`
- WHEN the grid renders today
- THEN only today's cell shows "T"

### Requirement: slot content never intercepts pointer events

Slot wrappers MUST NOT capture pointer events; a click landing on slot content MUST still
reach the cell so selection and `dayClick` behave as if the number were clicked.

#### Scenario: click on slot content still activates the day

- GIVEN a top slot renders content inside a cell
- WHEN a click is dispatched on that content
- THEN `dayClick` emits for that cell's date
- AND `value` updates to that date

### Requirement: dayCell takes precedence over slots

When `dayCell` is provided it MUST fully replace the default cell, and `dayCellTop` and
`dayCellBottom` MUST NOT render.

#### Scenario: dayCell and slots provided together

- GIVEN `dayCell`, `dayCellTop`, and `dayCellBottom` are all provided
- WHEN the grid renders
- THEN only the custom cell template content appears in each cell

### Requirement: cooperation with dayStyle and state classes

Slot content renders inside the styled cell: `dayStyle` entries and state classes MUST still
apply to cells that render slots.

#### Scenario: styled cell with slot content

- GIVEN a day has both a `dayStyle` entry and rendered slot content
- WHEN the grid renders
- THEN the cell shows the entry's styling and its state classes unchanged
