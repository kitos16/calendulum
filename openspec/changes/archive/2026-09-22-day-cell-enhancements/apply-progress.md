# Apply Progress — day-cell-enhancements

**Status**: success — all 16 tasks complete, full gate green (48 tests, both builds, prettier clean). Delivery: size:exception accepted (no chained PRs; direct commits to main).

## TDD Cycle Evidence

| Task    | Test File                       | Layer                   | Safety Net                                                                    | RED                 | GREEN                             | TRIANGULATE                    | REFACTOR                                     |
| ------- | ------------------------------- | ----------------------- | ----------------------------------------------------------------------------- | ------------------- | --------------------------------- | ------------------------------ | -------------------------------------------- |
| 1.1     | `date-utils.spec.ts`            | Unit                    | N/A (new)                                                                     | ✅ Written          | ✅ Passed                         | ✅ 4 cases                     | ➖ None needed                               |
| 1.2     | `date-utils.ts`                 | Unit                    | N/A (new)                                                                     | ✅ (1.1)            | ✅ Passed                         | ✅ (1.1)                       | ➖ None needed                               |
| 1.3     | `calendulum-month.spec.ts`      | Unit                    | N/A (new)                                                                     | ✅ Written          | ✅ Passed                         | ✅ 5 cases                     | ➖ None needed                               |
| 1.4     | `calendulum-month.ts`           | Unit                    | N/A (new)                                                                     | ✅ (1.3)            | ✅ Passed                         | ✅ (1.3)                       | ➖ None needed                               |
| 2.1     | `calendulum-month.spec.ts`      | Integration (TestBed)   | ✅ 41/41                                                                      | ✅ Written          | ✅ Passed                         | ✅ 2 points + outside + hidden | ➖ None needed                               |
| 2.2     | `calendulum-month.ts` + `.html` | Integration             | ✅ 41/41                                                                      | ✅ (2.1)            | ✅ Passed                         | ✅ (2.1)                       | ➖ None needed                               |
| 2.3     | `calendulum-month.spec.ts`      | Integration             | ✅ 41/41                                                                      | ✅ Written          | ✅ Passed                         | ✅ 3 flag cases                | ➖ None needed                               |
| 2.4     | `calendulum-month.ts`           | Integration             | ✅ 41/41                                                                      | ✅ (2.3)            | ✅ Passed                         | ✅ (2.3)                       | ➖ None needed                               |
| 2.5     | `calendulum-month.spec.ts`      | Integration             | ✅ 41/41                                                                      | ✅ Written          | ✅ Passed                         | ✅ 4 style cases               | ➖ None needed                               |
| 2.6     | `calendulum-month.ts` + `.html` | Integration             | ✅ 41/41                                                                      | ✅ (2.5)            | ✅ Passed                         | ✅ (2.5)                       | ➖ None needed                               |
| 3.1     | `calendulum-month.spec.ts`      | Integration             | ✅ 39/41 (2 harness failures fixed: signal-backed input + element-node proxy) | ✅ Written          | ✅ Passed                         | ✅ 5 slot cases                | ✅ Test-only refactor (plain field → signal) |
| 3.2     | `.html` + `.scss`               | Integration             | ✅ 41/41                                                                      | ✅ (3.1)            | ✅ Passed                         | ✅ (3.1)                       | ➖ None needed                               |
| 4.1     | `calendulum-month.spec.ts`      | Integration             | ✅ 41/41                                                                      | ✅ Written          | ✅ 4/4                            | ✅ 4 a11y cases                | ➖ None needed                               |
| 4.2     | `calendulum-month.ts` + `.html` | Integration             | ✅ 41/41                                                                      | ✅ (4.1)            | ✅ Passed                         | ✅ (4.1)                       | ➖ None needed                               |
| 5.1     | `app.{ts,html,scss}` (demo)     | Integration (demo spec) | ✅ 3/3                                                                        | N/A (demo, non-TDD) | ✅ 3/3                            | —                              | —                                            |
| 5.2     | `README.md`                     | Docs                    | N/A                                                                           | N/A                 | N/A (docs)                        | —                              | —                                            |
| 6.1–6.3 | full gate                       | —                       | —                                                                             | —                   | ✅ 48 tests + 2 builds + prettier | —                              | —                                            |

Phases 1–3 were implemented by the previous (stuck) apply run — tests existed and were RED-first; the retry verified GREEN, fixed two harness-defect tests, and completed 4–6.

## Work Unit Evidence

| Evidence                    | Value                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused test command        | `npx ng test calendulum --watch=false` → 45/45 pass (EXIT 0)                                                                                                                                       |
| Focused test command (demo) | `npx ng test demo --watch=false` → 3/3 pass (EXIT 0)                                                                                                                                               |
| Runtime harness             | N/A — no server runtime; TestBed integration covers interaction paths                                                                                                                              |
| Rollback boundary           | Library: revert `date-utils.ts(.spec)`, `calendulum-month.{ts,html,scss,spec.ts}`; demo: `projects/demo/src/app/{app.ts,app.html,app.scss}`; docs: `README.md`; formatting-only: repo config files |

## Test Summary

- Total tests: 48 (45 library + 3 demo), all passing
- Layers: Unit (pure helpers) + Integration (TestBed)
- Approval tests: none needed (no production refactor)
- Pure functions: `dateKey`, `resolveDayStyle`, `resolveCellClasses` + component helpers
- Fixes vs prior stuck run: 2 test-harness defects + leftover `debug-scratch.spec.ts` removed

## Deviations from Design

None — implementation matches design.md. Note: full gate build uses `npx ng build demo` (design's bare `npx ng build` fails: multi-project workspace has no defaultProject).

## Key Findings

- TestBed harness: plain-field mutation after first render does NOT propagate object-typed signal inputs and triggers NG0100 for primitives; signal-backed host bindings (canonical Angular 21) propagate correctly. Library code was correct.
- `npx prettier --check .` was red at HEAD on config files (angular.json, tsconfigs, README...); ran `prettier --write` repo-wide to make the gate green. Formatting-only changes.
- HTML/SCSS wrappers filter element nodes in slot-position assertions (Angular inserts comment markers for control flow).
