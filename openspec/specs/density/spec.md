## Purpose

The component exposes a discrete `density` input that scales spacing (cell padding, grid gaps, header height) through the `--cld-density` CSS custom property multiplier, enabling compact, cozy, and spacious layouts without custom CSS.

## Requirements

### Requirement: density input with discrete tiers

The component SHALL expose a `density` input accepting `'compact' | 'cozy' | 'spacious'`, defaulting to `'cozy'`. Each tier MUST map to a `--cld-density` multiplier: `'compact'` = `0.75`, `'cozy'` = `1`, `'spacious'` = `1.375`.

#### Scenario: compact tier applies tighter spacing

- GIVEN `density` is `'compact'`
- WHEN the grid renders
- THEN the section style carries `--cld-density: 0.75`

#### Scenario: cozy tier applies baseline spacing

- GIVEN `density` is `'cozy'` (default)
- WHEN the grid renders
- THEN the section style carries `--cld-density: 1`

#### Scenario: spacious tier applies relaxed spacing

- GIVEN `density` is `'spacious'`
- WHEN the grid renders
- THEN the section style carries `--cld-density: 1.375`

#### Scenario: invalid value falls back to cozy

- GIVEN `density` is `'tight'` or `undefined`
- WHEN the grid renders
- THEN the section style carries `--cld-density: 1`

### Requirement: multiplier affects cell padding, grid gap, and header height

The `--cld-density` multiplier MUST scale:

- Day cell padding (vertical and horizontal)
- Grid column and row gaps
- Month header height
- Weekday header height

All through CSS `calc(var(--cld-density) * <base-value>)`. No individual spacing rule SHALL hardcode a value that bypasses the multiplier.

#### Scenario: cell padding scales with density

- GIVEN `density` is `'compact'`
- WHEN the grid renders
- THEN day cell padding is `calc(0.75 * <base-padding>)`

#### Scenario: grid gap scales with density

- GIVEN `density` is `'spacious'`
- WHEN the grid renders
- THEN grid column/row gaps are `calc(1.375 * <base-gap>)`

#### Scenario: header height scales with density

- GIVEN `density` is `'compact'`
- WHEN the grid renders
- THEN month and weekday header heights are `calc(0.75 * <base-height>)`

### Requirement: density change triggers re-render with new multiplier

Changing the `density` input at runtime MUST update `--cld-density` immediately without requiring component re-initialization.

#### Scenario: runtime density change updates multiplier

- GIVEN a rendered grid with `density: 'cozy'`
- WHEN `density` is set to `'compact'`
- THEN the section style updates to `--cld-density: 0.75`
