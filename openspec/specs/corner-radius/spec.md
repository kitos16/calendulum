## Purpose

The component exposes a discrete `cornerRadius` input that overrides the global `--cld-radius` CSS custom property, enabling consumers to choose a border-radius tier without custom CSS.

## Requirements

### Requirement: cornerRadius input with discrete tiers

The component SHALL expose a `cornerRadius` input accepting `'sm' | 'md' | 'lg' | 'full'`, defaulting to `'md'`. Each tier MUST map to a `--cld-radius` value: `'sm'` = `0.25rem`, `'md'` = `0.5rem`, `'lg'` = `0.75rem`, `'full'` = `9999px`.

#### Scenario: sm tier applies small radius

- GIVEN `cornerRadius` is `'sm'`
- WHEN the grid renders
- THEN the section style carries `--cld-radius: 0.25rem`

#### Scenario: md tier applies baseline radius

- GIVEN `cornerRadius` is `'md'` (default)
- WHEN the grid renders
- THEN the section style carries `--cld-radius: 0.5rem`

#### Scenario: lg tier applies large radius

- GIVEN `cornerRadius` is `'lg'`
- WHEN the grid renders
- THEN the section style carries `--cld-radius: 0.75rem`

#### Scenario: full tier applies pill radius

- GIVEN `cornerRadius` is `'full'`
- WHEN the grid renders
- THEN the section style carries `--cld-radius: 9999px`

#### Scenario: invalid value falls back to md

- GIVEN `cornerRadius` is `'xl'` or `undefined`
- WHEN the grid renders
- THEN the section style carries `--cld-radius: 0.5rem`

### Requirement: radius applies to day cells, header, and month selector

The `--cld-radius` value MUST be consumed by:

- Day cell border-radius (default and hover/focus states)
- Month header container border-radius
- Month selector dropdown border-radius (when `monthSelector='dropdown'`)

No individual element SHALL hardcode a border-radius that bypasses `--cld-radius`.

#### Scenario: day cells use the radius

- GIVEN `cornerRadius` is `'lg'`
- WHEN the grid renders
- THEN day cells have `border-radius: var(--cld-radius)`

#### Scenario: header uses the radius

- GIVEN `cornerRadius` is `'sm'`
- WHEN the grid renders
- THEN the month header container has `border-radius: var(--cld-radius)`

#### Scenario: month selector dropdown uses the radius

- GIVEN `cornerRadius` is `'full'` and `monthSelector='dropdown'`
- WHEN the dropdown renders
- THEN the select element has `border-radius: var(--cld-radius)`

### Requirement: cornerRadius change triggers re-render with new radius

Changing the `cornerRadius` input at runtime MUST update `--cld-radius` immediately without requiring component re-initialization.

#### Scenario: runtime cornerRadius change updates radius

- GIVEN a rendered grid with `cornerRadius: 'md'`
- WHEN `cornerRadius` is set to `'full'`
- THEN the section style updates to `--cld-radius: 9999px`
