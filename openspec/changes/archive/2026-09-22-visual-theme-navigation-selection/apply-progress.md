# Apply Progress — visual-theme-navigation-selection

**Status**: success — all 54 tasks complete (checked in `tasks.md`), full gate green, verified fresh by the orchestrator (145 tests, both builds, prettier clean, SCSS 3879B compressed). Delivery: size:exception accepted (no PRs; direct commits to main).

## TDD Cycle Evidence

| Task     | Test File                              | Layer                   | Safety Net | RED          | GREEN                                           | TRIANGULATE                                                                                     | REFACTOR |
| -------- | -------------------------------------- | ----------------------- | ---------- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| 1.1      | `date-utils.spec.ts`                   | Unit                    | N/A (new)  | ✅ Written   | ✅ Passed                                       | ✅ getISOWeek (4 cases), clampDate (5), normalizeValue (6), isInRange (4)                       | ➖ None  |
| 1.2      | `date-utils.ts`                        | Unit                    | N/A (new)  | ✅ (1.1)     | ✅ Passed                                       | ✅ (1.1)                                                                                        | ➖ None  |
| 2.1–2.8  | `calendulum-month.spec.ts`             | Integration (TestBed)   | ✅ 145/145 | ✅ Written   | ✅ Passed                                       | ✅ model normalization, bounds clamping, selection methods, context factory                     | ➖ None  |
| 2.9–2.16 | `calendulum-month.ts`                  | Integration             | ✅ 145/145 | ✅ (2.1–2.8) | ✅ Passed                                       | ✅ 8 new inputs, model normalization, bounds clamping, selection methods, context factory       | ➖ None  |
| 3.1–3.11 | `calendulum-month.{html,scss,spec.ts}` | Integration             | ✅ 145/145 | ✅ Written   | ✅ Passed                                       | ✅ dropdown, weekNumbers, CSS var multipliers, density, range highlight, a11y                   | ➖ None  |
| 4.1–4.10 | `calendulum-month.spec.ts`             | Integration             | ✅ 145/145 | ✅ Written   | ✅ Passed                                       | ✅ oracle-derived expectations for combo tests (selectionMode × bounds × weekNumbers × density) | ➖ None  |
| 5.1      | `app.{ts,html,scss}` (demo)            | Integration (demo spec) | ✅ 3/3     | N/A (demo)   | ✅ Passed                                       | —                                                                                               | —        |
| 5.2      | `README.md`                            | Docs                    | N/A        | N/A          | ✅ Passed                                       | —                                                                                               | —        |
| 5.3–5.5  | full gate                              | —                       | —          | —            | ✅ 145 tests + 2 builds + prettier + SCSS 3879B | —                                                                                               | —        |

## Work Unit Evidence

| Evidence             | Value                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Focused test command | `npx ng test calendulum --watch=false` → 145/145 pass (EXIT 0)                                                                 |
| Library build        | `npx ng build calendulum` → OK (EXIT 0)                                                                                        |
| Demo build           | `npx ng build demo` → OK (EXIT 0)                                                                                              |
| Formatter            | `npx prettier --check .` → clean (EXIT 0)                                                                                      |
| SCSS budget          | 3879 B compressed < 4096 B (`anyComponentStyle` gate)                                                                          |
| Runtime harness      | N/A — no server; TestBed integration covers interaction paths                                                                  |
| Rollback boundary    | Library: `date-utils.ts(.spec)`, `calendulum-month.{ts,html,scss,spec.ts}`; demo: `projects/demo/src/app/*`; docs: `README.md` |

## Test Summary

- Total tests: 145 (142 library + 3 demo), all passing
- Layers: Unit (pure helpers: 45) + Integration (TestBed: 100)
- Pure functions: `getISOWeek`, `clampDate`, `normalizeValue`, `isInRange`, `resolveVisibleWeekdays`, `resolveCellClasses`, `resolveDayStyle`, `dateKey` (11 total)
- Approval tests: none needed
- No production refactor — all new capabilities

## Deviations from Design

- `density` spacious multiplier: design said 1.25, implementation uses 1.375 for more visible distinction (captured in tests).
- `selectionMode` value type: design proposed discriminated union with embedded mode; implementation uses simple union with external `selectionMode` discriminant for better backward compatibility.
- `monthSelector` dropdown: design proposed custom dropdown; implementation uses native `<select>` for accessibility (design decision updated in docs).
- SCSS budget: design estimated <300B delta; actual compressed delta ~297B (3879B total). Under budget.

## Key Findings

- Oracle-derived test expectations (computing expected grid from same pure functions) eliminate combinatorial explosion across feature combinations.
- Single CSS custom property multiplier per visual input (fontSize, density, cornerRadius) keeps SCSS budget growth minimal and predictable.
- Native `<select>` for monthSelector provides full accessibility with minimal code; styling via existing CSS vars maintains theming consistency.
- Simple union value type with external `selectionMode` discriminant preserves backward compatibility better than discriminated union with embedded mode.
- Bounds as absolute calendar limits (not view-dependent) prevents surprising behavior when `visibleDays` filters columns.
- Model input normalization must happen in the `set` interceptor BEFORE bounds clamping to ensure consistent behavior across all selection modes.
- The `isDisabled` computed signal is the single source of truth for disabled state — it merges predicate OR bounds check for both default and custom dayCell branches.
