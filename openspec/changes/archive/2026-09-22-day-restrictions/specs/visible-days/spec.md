# Visible Days Specification

## Purpose

Consumers restrict the calendar to a working-week view by hiding whole weekday columns.
`visibleDays` filters whole columns — never individual dates — keeping every row complete and the
6-row geometry stable.

## Requirements

### Requirement: visibleDays union input

The component SHALL expose `visibleDays` accepting `'all' | 'mondayToFriday' |
'mondayToSaturday' | readonly Weekday[]` (`0`–`6`), defaulting to `'all'`; the exported
`CalendulumVisibleDays` SHALL describe the union. Presets SHALL expand to fixed sets —
`mondayToFriday` {1,2,3,4,5}, `mondayToSaturday` {1,2,3,4,5,6} — independent of `firstDayOfWeek`.

#### Scenario: the Mon–Fri preset renders five columns

- GIVEN `visibleDays` is `'mondayToFriday'`
- WHEN the grid renders
- THEN every rendered cell's `getDay()` is in {1,2,3,4,5}

#### Scenario: a weekday array is the escape hatch

- GIVEN `visibleDays` is `[6, 0]`
- WHEN the grid renders
- THEN two columns (12 cells) render, weekends only
- AND the input order does not affect the result

### Requirement: column projection preserves six stable rows

The `days` grid SHALL filter cells whose weekday is not in the resolved set — whole columns
removed, never individual cells. The projection MUST always render 6 rows: cell count SHALL
equal resolved-set size × 6 (`all` 42, `mondayToSaturday` 36, `mondayToFriday` 30); tests MUST
lock this row-completeness contract.

#### Scenario: mondayToSaturday renders 36 cells

- GIVEN `visibleDays` is `'mondayToSaturday'`
- WHEN the grid renders
- THEN 36 day buttons render (6 rows × 6 columns)

#### Scenario: mondayToFriday renders 30 cells

- GIVEN `visibleDays` is `'mondayToFriday'`
- WHEN the grid renders
- THEN 30 day buttons render (6 rows × 5 columns)

### Requirement: header labels follow the same set

The `weekdays` header SHALL filter the same resolved set so label count equals column count and
labels align with their columns. Label order SHALL follow `firstDayOfWeek` as today.

#### Scenario: header count equals column count

- GIVEN `visibleDays` is `'mondayToFriday'`
- WHEN the grid renders
- THEN exactly five `.cld-month__weekday` headers render

### Requirement: --cld-week-columns drives both track rules

The component SHALL bind the resolved column count as `--cld-week-columns` on the section.
`.cld-month__weekdays` and `.cld-month__grid` MUST consume it via
`repeat(var(--cld-week-columns), 1fr)`; default `all` renders `repeat(7, 1fr)`.

#### Scenario: the bound style value exposes the column count

- GIVEN `visibleDays` is `'mondayToFriday'`
- WHEN the grid renders
- THEN the section style carries `--cld-week-columns: 5` (jsdom proxy)

### Requirement: invalid values normalize to all

Values other than the three literals or a weekday array SHALL normalize to `'all'`. Arrays MUST
drop out-of-range numbers and duplicates; an empty resolved set SHALL fall back to `'all'` — the
grid MUST NEVER render zero columns.

#### Scenario: out-of-range and duplicate entries are cleaned

- GIVEN `visibleDays` is `[1, 1, 9, -2]`
- WHEN the grid renders
- THEN the resolved set is {1} and one column (6 cells) renders

#### Scenario: an unresolvable value falls back to all

- GIVEN `visibleDays` is `[]` or an unknown literal
- WHEN the grid renders
- THEN it behaves as `'all'` with 42 cells

### Requirement: value model and navigation stay independent

Navigation SHALL be unchanged by `visibleDays`. `value` MAY hold a date on a hidden weekday — the
model stays authoritative and the view shows no selected cell. README MUST document this, the
preset sets, and `mondayToSaturday` + `firstDayOfWeek=0` (Monday–Saturday columns, no Sunday
column).

#### Scenario: selection can land on a hidden weekday

- GIVEN `visibleDays` is `'mondayToFriday'` and `value` is a Saturday
- WHEN the grid renders
- THEN `value` stays the Saturday and no selected cell renders

#### Scenario: firstDayOfWeek=0 with mondayToSaturday omits Sunday

- GIVEN `firstDayOfWeek` is 0 and `visibleDays` is `'mondayToSaturday'`
- WHEN the grid renders
- THEN the first column is Monday and no Sunday column renders (36 cells)

#### Scenario: README documents the visibility contract

- GIVEN the README `visibleDays` section
- WHEN it is reviewed
- THEN it states the Sunday omission, the hidden-weekday `value` behavior, and the preset sets
