# day-styling Specification

## Purpose

Consumers style individual days through a `dayStyle` record keyed by local ISO date strings,
applied per cell via CSS custom properties, with documented precedence that keeps state
affordances winning.

## Requirements

### Requirement: dayStyle input keyed by local ISO date

The component SHALL expose `dayStyle` as a record keyed by local ISO date string
(`YYYY-MM-DD`). Each entry MAY set `border`, `color`, `background` (raw CSS strings) and
`class` (string or string array). Keys MUST be produced by the exported pure helper
`dateKey()`.

#### Scenario: styled day receives its entry

- GIVEN `dayStyle` maps `"2026-09-22"` to `{ background: 'pink' }`
- WHEN the grid renders 22 September 2026
- THEN that cell applies the entry's background (and border/color when set)
- AND cells without an entry are unaffected

#### Scenario: day absent from the record is unchanged

- GIVEN a `dayStyle` record that lacks a rendered day's key
- WHEN the grid renders
- THEN that cell shows default styling with no per-day custom properties applied

### Requirement: dateKey uses local calendar components

`dateKey(date)` MUST format from local `getFullYear`/`getMonth`/`getDate` with zero-padded
month and day, and MUST NOT use `toISOString()` or any UTC-based conversion.

#### Scenario: negative-offset timezone keeps the local day

- GIVEN a timezone west of UTC (e.g. UTC-5) and `new Date(2026, 8, 22, 23, 30)`
- WHEN `dateKey` is called
- THEN the result is `"2026-09-22"`, not the UTC-shifted `"2026-09-23"`

#### Scenario: single-digit month and day are padded

- GIVEN `dateKey(new Date(2026, 0, 5))` is called
- WHEN the helper runs
- THEN the result is `"2026-01-05"`

### Requirement: per-cell custom property application

`border`/`color`/`background` entries MUST be applied per cell through the custom properties
`--cld-day-border`, `--cld-day-color`, and `--cld-day-bg`, consumed by base cell rules — not
as inline declarations that outrank class rules.

#### Scenario: day background renders from the entry

- GIVEN `dayStyle` sets `background` for a rendered day
- WHEN the grid renders
- THEN the cell's computed background reflects the entry value

### Requirement: state class precedence

State classes (`--today`, `--selected`) MUST win over `dayStyle` for background and text color
on the same cell. A `dayStyle` border MUST still apply on today/selected cells (state rules do
not set border). README MUST document this precedence.

#### Scenario: selected day keeps the state background

- GIVEN a day is selected and `dayStyle` sets `background` for it
- WHEN the grid renders
- THEN the cell shows the selected-state background, not the entry background
- AND the entry border still applies when set

#### Scenario: README documents precedence

- GIVEN the README `dayStyle` section
- WHEN it is reviewed
- THEN state-vs-dayStyle precedence and the border exception are stated explicitly

### Requirement: external class merging

`DayStyle.class` entries MUST be merged with the component's state classes into the cell's
class list; consumer classes MUST NOT replace state classes.

#### Scenario: consumer class coexists with state classes

- GIVEN a selected day whose entry sets `class: 'hl'`
- WHEN the grid renders
- THEN the cell carries `hl` alongside the selected-state class
