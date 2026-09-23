## Purpose

The component exposes a discrete `fontSize` input that scales all text through the `--cld-font-size` CSS custom property multiplier, enabling consumers to choose a global size tier without custom CSS.

## Requirements

### Requirement: fontSize input with discrete tiers

The component SHALL expose a `fontSize` input accepting `'sm' | 'md' | 'lg'`, defaulting to `'md'`. Each tier MUST map to a `--cld-font-size` multiplier: `'sm'` = `0.875`, `'md'` = `1`, `'lg'` = `1.125`.

#### Scenario: sm tier applies smaller text

- GIVEN `fontSize` is `'sm'`
- WHEN the grid renders
- THEN the section style carries `--cld-font-size: 0.875`

#### Scenario: md tier applies baseline text

- GIVEN `fontSize` is `'md'` (default)
- WHEN the grid renders
- THEN the section style carries `--cld-font-size: 1`

#### Scenario: lg tier applies larger text

- GIVEN `fontSize` is `'lg'`
- WHEN the grid renders
- THEN the section style carries `--cld-font-size: 1.125`

#### Scenario: invalid value falls back to md

- GIVEN `fontSize` is `'xl'` or `undefined`
- WHEN the grid renders
- THEN the section style carries `--cld-font-size: 1`

### Requirement: multiplier affects all component text uniformly

The `--cld-font-size` multiplier MUST apply to the header, weekday labels, day numbers, and slot content through a single root font-size rule. No individual element SHALL hardcode a font-size that bypasses the multiplier.

#### Scenario: header and day numbers scale together

- GIVEN `fontSize` is `'lg'`
- WHEN the grid renders
- THEN both the month header and day numbers render at the scaled size

#### Scenario: slot content scales with the multiplier

- GIVEN `fontSize` is `'sm'` and `dayCellTop` renders text
- WHEN the grid renders
- THEN the slot content renders at the scaled size

### Requirement: fontSize change triggers re-render with new multiplier

Changing the `fontSize` input at runtime MUST update `--cld-font-size` immediately without requiring component re-initialization.

#### Scenario: runtime fontSize change updates multiplier

- GIVEN a rendered grid with `fontSize: 'md'`
- WHEN `fontSize` is set to `'sm'`
- THEN the section style updates to `--cld-font-size: 0.875`
