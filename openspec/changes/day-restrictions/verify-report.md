```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:41d9c16d79c395812bba0f28bef982c54d3148df8485e60d81fdfd6418e2d660
verdict: pass
blockers: 0
critical_findings: 0
requirements: 15/15
scenarios: 27/27
test_command: npx ng test --watch=false
test_exit_code: 0
test_output_hash: sha256:001cd3a15c407c8e0ab23d804376c2c8ff79d2c09d642d03dd8c1b7bd8a04057
build_command: npx ng build calendulum && npx ng build demo
build_exit_code: 0
build_output_hash: sha256:74268afee555dc81999511112c154a45b7dc106b65d16a01453940a2f537d525
```

## Verification Report

**Change**: day-restrictions
**Version**: N/A (openspec delta specs)
**Mode**: Strict TDD

### Completeness

| Metric           | Value |
| ---------------- | ----- |
| Tasks total      | 18    |
| Tasks complete   | 18    |
| Tasks incomplete | 0     |

### Build & Tests Execution

**Build**: ✅ Passed — both declarative builds exit 0

```text
npx ng build calendulum && npx ng build demo
EXIT 0 — calendulum lib built to dist/calendulum; demo app built to dist/demo
build_output_hash: sha256:74268afee555dc81999511112c154a45b7dc106b65d16a01453940a2f537d525
```

**Tests**: ✅ 84 passed / 0 failed / 0 skipped (81 library [2 files] + 3 demo [1 file])

```text
npx ng test --watch=false
EXIT 0 — Test Files 1 passed (1); Tests 3 passed (3)  [demo: app.spec.ts]
          Test Files 2 passed (2); Tests 81 passed (81)  [library: date-utils.spec.ts (11) + calendulum-month.spec.ts (70)]
test_output_hash: sha256:001cd3a15c407c8e0ab23d804376c2c8ff79d2c09d642d03dd8c1b7bd8a04057
```

**Coverage**: ➖ Not available — no coverage tooling configured in `angular.json` (unit-test builder has no coverage options).

**Formatter**: ✅ Passed — `npx prettier --check .` EXIT 0 ("All matched files use Prettier code style!").

**Style budget**: ✅ 3582 B < 4096 B warning threshold (`anyComponentStyle`).

### Spec Compliance Matrix

| Req                                           | Scenario                                               | Test                                                                                                                                                                                             | Result       |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| disabled-days: predicate input                | predicate disables a single date                       | `calendulum-month.spec.ts > disabled days > resolves the disabled state only for dates the predicate rejects`                                                                                    | ✅ COMPLIANT |
| disabled-days: predicate input                | default keeps every cell enabled                       | `calendulum-month.spec.ts > disabled days > keeps every cell enabled when the predicate is unset`                                                                                                | ✅ COMPLIANT |
| disabled-days: UI activation blocked          | clicking a disabled default button is inert            | `calendulum-month.spec.ts > disabled days > blocks dayClick and selection on the disabled day`                                                                                                   | ✅ COMPLIANT |
| disabled-days: UI activation blocked          | keyboard activation of a disabled custom cell is inert | `calendulum-month.spec.ts > disabled custom dayCell > blocks Enter and Space on the disabled wrapper`                                                                                            | ✅ COMPLIANT |
| disabled-days: focus + aria-disabled          | disabled default button stays focusable                | `calendulum-month.spec.ts > disabled days > marks only the disabled button aria-disabled, without native disabled`                                                                               | ✅ COMPLIANT |
| disabled-days: focus + aria-disabled          | disabled custom wrapper is marked and focusable        | `calendulum-month.spec.ts > disabled custom dayCell > marks the disabled wrapper aria-disabled and keeps it focusable`                                                                           | ✅ COMPLIANT |
| disabled-days: --disabled class + neutralizer | resolveCellClasses appends the disabled class          | `calendulum-month.spec.ts > resolveCellClasses > appends the disabled state class … / combines disabled with today and selected …`                                                               | ✅ COMPLIANT |
| disabled-days: --disabled class + neutralizer | disabled today keeps its ring                          | `calendulum-month.spec.ts > disabled days > keeps the today visuals on a disabled today cell`                                                                                                    | ✅ COMPLIANT |
| disabled-days: isDisabled context flag        | custom template renders its own disabled mark          | `calendulum-month.spec.ts > disabled custom dayCell > exposes isDisabled in the context only for the rejected date`                                                                              | ✅ COMPLIANT |
| disabled-days: select() unconditional         | programmatic selection of a disabled date succeeds     | `calendulum-month.spec.ts > disabled days > select() sets value on a disabled date … / goToToday still selects today when today is disabled`                                                     | ✅ COMPLIANT |
| disabled-days: README API + key-set recipe    | README documents the key-set recipe                    | README § "Disabled days (`isDayDisabled`)" — predicate, key-set closure over `Set` of `dateKey`, stable-reference note (static inspection, lines 174–186)                                        | ✅ COMPLIANT |
| visible-days: union input                     | Mon–Fri preset renders five columns                    | `calendulum-month.spec.ts > visible days > renders 30 Mon–Fri cells for mondayToFriday` (every getDay in 1..5)                                                                                   | ✅ COMPLIANT |
| visible-days: union input                     | weekday array is the escape hatch                      | `calendulum-month.spec.ts > visible days > renders weekends only for [6, 0] and [0, 6] alike` (12 cells, order-insensitive)                                                                      | ✅ COMPLIANT |
| visible-days: stable 6-row projection         | mondayToSaturday renders 36 cells                      | `calendulum-month.spec.ts > visible days > renders 36 cells for mondayToSaturday`                                                                                                                | ✅ COMPLIANT |
| visible-days: stable 6-row projection         | mondayToFriday renders 30 cells                        | `calendulum-month.spec.ts > visible days > renders 30 Mon–Fri cells for mondayToFriday` (Mon column × 6 rows)                                                                                    | ✅ COMPLIANT |
| visible-days: header follows set              | header count equals column count                       | `calendulum-month.spec.ts > visible days > filters headers to the same set with matching order` (5 headers)                                                                                      | ✅ COMPLIANT |
| visible-days: --cld-week-columns              | bound style value exposes the column count             | `calendulum-month.spec.ts > visible days > binds the resolved column count as --cld-week-columns` (5/6/7)                                                                                        | ✅ COMPLIANT |
| visible-days: invalid → all                   | out-of-range and duplicate entries are cleaned         | `calendulum-month.spec.ts > visible days > cleans out-of-range and duplicate entries down to one column` + `date-utils.spec.ts > drops duplicates and out-of-range numbers`                      | ✅ COMPLIANT |
| visible-days: invalid → all                   | unresolvable value falls back to all                   | `calendulum-month.spec.ts > visible days > falls back to all for an empty array` + `date-utils.spec.ts > falls back to all …` (empty + unknown literal)                                          | ✅ COMPLIANT |
| visible-days: model/navigation independent    | selection can land on a hidden weekday                 | `calendulum-month.spec.ts > visible days > keeps value on a hidden weekday without rendering a selected cell`                                                                                    | ✅ COMPLIANT |
| visible-days: model/navigation independent    | firstDayOfWeek=0 + mondayToSaturday omits Sunday       | `calendulum-month.spec.ts > visible days > firstDayOfWeek=0 with mondayToSaturday omits Sunday` (36 cells, Monday first, no Sunday)                                                              | ✅ COMPLIANT |
| visible-days: model/navigation independent    | README documents the visibility contract               | README § "Visible days (`visibleDays`)" — Sunday omission, hidden-weekday value, preset sets (static inspection)                                                                                 | ✅ COMPLIANT |
| context-contract: context shape               | demo `day.isToday` works                               | `calendulum-month.spec.ts > day context flags > reports day.isToday true for today only`                                                                                                         | ✅ COMPLIANT |
| context-contract: context shape               | isSelected reflects the value model                    | `calendulum-month.spec.ts > day context flags > reports day.isSelected only for the value-model day`                                                                                             | ✅ COMPLIANT |
| context-contract: context shape               | flags update on selection change                       | `calendulum-month.spec.ts > day context flags > flips isSelected flags when the selection changes`                                                                                               | ✅ COMPLIANT |
| context-contract: context shape               | slot templates expose isDisabled                       | `calendulum-month.spec.ts > CalendulumMonth dayCellBottom slot exposes isDisabled > renders the disabled mark in the bottom slot only for the disabled day` (42 slots, exactly 1 marked, day 15) | ✅ COMPLIANT |
| context-contract: README contract             | README matches the exported type                       | README context docs `{ date, inMonth, isToday, isSelected, isDisabled }` vs `CalendulumDayCellContext` — field-for-field match (static inspection, line 69)                                      | ✅ COMPLIANT |

**Compliance summary**: 27/27 scenarios compliant (0 partial, 0 untested, 0 failing)

### Correctness (Static Evidence)

| Requirement                                     | Status         | Notes                                                                                                                                                                 |
| ----------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isDayDisabled predicate input, default false    | ✅ Implemented | `input<(date: Date) => boolean>(() => false)`; per-date resolution in `isDisabled()`                                                                                  |
| UI guards `onDayClick`/`onDayKeydown`           | ✅ Implemented | Early return on disabled — no emit, no select; `select()`/`goToToday()` unconditional                                                                                 |
| Focusable `aria-disabled`, no native `disabled` | ✅ Implemented | Both branches; `'true'`/null binding; wrapper keeps `tabindex="0"`                                                                                                    |
| `resolveCellClasses` + `--disabled` class       | ✅ Implemented | Inserted 4th positional `disabled` param; appended after state classes, before consumer classes                                                                       |
| `isDisabled` context flag                       | ✅ Implemented | `CalendulumDayCellContext` documented + README matched                                                                                                                |
| visibleDays union + `CalendulumVisibleDays`     | ✅ Implemented | Exported; `resolveVisibleWeekdays` normalizes presets/arrays → sorted Set, empty/OOR/unknown → all                                                                    |
| Whole-column projection, 6 stable rows          | ✅ Implemented | `days` filtered by weekday membership; counts = set.size × 6                                                                                                          |
| Header filtering + `--cld-week-columns`         | ✅ Implemented | `weekdays` filtered by same set; binding on section; SCSS `repeat(var(--cld-week-columns, 7), 1fr)`                                                                   |
| Demo cards + README                             | ✅ Implemented | Disabled-days card (key-set recipe, `day.isDisabled` mark) + visible-days card (all/Mon–Fri/Mon–Sat filters); README API rows, precedence ladder, visibility contract |

### Coherence (Design)

| Decision                                                                | Followed? | Notes                                                                                               |
| ----------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Type/helper placement in `date-utils.ts`                                | ✅ Yes    | `Weekday`, `CalendulumVisibleDays`, `resolveVisibleWeekdays`                                        |
| resolveVisibleWeekdays normalization                                    | ✅ Yes    | Presets fixed sets; dedupe/sort; empty/unknown → all                                                |
| Column projection & row stability                                       | ✅ Yes    | Whole-column filter; counts derived from set size × 6                                               |
| `--cld-week-columns` binding + SCSS tracks                              | ✅ Yes    | Implementation adds `, 7` fallback in SCSS — benign enhancement, default binding renders 7          |
| Disabled interaction/a11y (guards, aria-disabled, unconditional select) | ✅ Yes    | Matches design data flow                                                                            |
| resolveCellClasses signature extension                                  | ✅ Yes    | `(cell, today, selected, disabled, style)`                                                          |
| Context contract `isDisabled` + README                                  | ✅ Yes    | Type and docs agree field-for-field                                                                 |
| SCSS disabled rules + hover neutralizer                                 | ✅ Yes    | `.cld-month__day--disabled:hover` before `--selected:hover` keeps disabled+selected accent on hover |

### TDD Compliance

| Check                         | Result | Details                                                                                                                                                                                                                   |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TDD Evidence reported         | ✅     | `apply-progress.md` contains the full "TDD Cycle Evidence" table (RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR) covering tasks 1.1–5.4                                                                                       |
| All tasks have tests          | ✅     | 10/10 RED-marked tasks name test files that exist (`date-utils.spec.ts`, `calendulum-month.spec.ts`)                                                                                                                      |
| RED confirmed (tests exist)   | ✅     | 2 changed spec files verified present in working tree                                                                                                                                                                     |
| GREEN confirmed (tests pass)  | ✅     | 81/81 changed-file tests pass on fresh execution (EXIT 0); 3 demo tests pass too                                                                                                                                          |
| Triangulation adequate        | ✅     | Distinct expected values per behavior (42/36/30/12/6 counts, enabled/disabled pairs, fDoW=0 Sunday omission, hidden-value, navigation, 1-of-42 slot mark)                                                                 |
| Safety Net for modified files | ✅     | `date-utils.spec.ts` row now reads "✅ 4/4" — verified against HEAD (4 pre-existing `dateKey` tests, +35/−1); component row "✅ 62/62" is the apply-time narrative (not independently reconstructable — see SUGGESTION 5) |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution

| Layer                     | Tests  | Files                          | Tools                                                      |
| ------------------------- | ------ | ------------------------------ | ---------------------------------------------------------- |
| Unit                      | 11     | 1 (`date-utils.spec.ts`)       | vitest 4.1.11 (via `@angular/build:unit-test`), no TestBed |
| Integration               | 70     | 1 (`calendulum-month.spec.ts`) | TestBed, DOM queries, synthetic MouseEvent/KeyboardEvent   |
| E2E                       | 0      | 0                              | not installed                                              |
| **Total (changed files)** | **81** | **2**                          |                                                            |

(Pre-existing, out of change scope: `projects/demo/src/app/app.spec.ts` — 3 tests.)

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected (`angular.json` unit-test builder exposes no coverage options).

### Assertion Quality

| File | Line | Assertion | Issue                                                                                                                                                                                                       | Severity |
| ---- | ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| —    | —    | —         | No tautologies, no mocks (0 `vi.mock` vs 200+ `expect`), no ghost loops (length guards precede all `forEach` assertion loops; oracle length ≥ 6), no smoke-only renders, no standalone type-only assertions | —        |

**Assertion quality**: ✅ All assertions verify real behavior.
The new bottom-slot regression test (round 3) asserts 42 rendered slots, exactly 1 marked `D`, and that the mark sits on day 15 — behavioral, non-trivial, directly closes the former PARTIAL scenario.
(Note: precondition guards like `expect(match).toBeDefined()` inside `dayButton()` helpers are always paired with value assertions in the calling tests; CSS-class and `aria-*` assertions target spec-mandated public contract, not incidental implementation.)

### Quality Metrics

**Formatter**: ✅ `npx prettier --check .` EXIT 0 — all matched files use Prettier code style (previously-CRITICAL resolved, re-verified fresh)
**Type Checker**: ✅ No errors — both builds compile cleanly
**SCSS Budget**: ✅ 3582 B < 4096 B warning threshold (baseline was 3092 B; +490 B)

### Issues Found

**CRITICAL**: None — all previously-CRITICAL items resolved and re-verified:

1. ~~Formatter gate fails~~ → RESOLVED: `npx prettier --check .` exits 0 on fresh run.
2. ~~Strict-TDD evidence table missing~~ → RESOLVED: `apply-progress.md` contains the full TDD Cycle Evidence table (rows 1.1–5.4) + Work Unit Evidence.

**WARNING**: None — both round-2 WARNINGs resolved:

1. ~~context-contract "slot templates expose isDisabled" is PARTIAL~~ → RESOLVED: `calendulum-month.spec.ts` gained `CalendulumMonth dayCellBottom slot exposes isDisabled`, which renders 42 bottom slots and asserts exactly 1 shows the disabled mark, on day 15. Scenario now directly covered.
2. ~~Safety-net label "N/A (new)" on `date-utils.spec.ts`~~ → RESOLVED: `apply-progress.md` row 1.1–1.2 reads "✅ 4/4", verified against HEAD (file pre-existed with 4 `dateKey` tests).

**SUGGESTION**:

1. Materialize/format OpenSpec artifacts through prettier at write time (the phase that wrote `apply-progress.md` produced unformatted markdown that broke the declared formatter gate — already remediated).
2. SCSS growth (+490 B: 3092 → 3582 B) exceeded the design's ~+150 B estimate — still 514 B under the 4 kB warning; record for future estimates.
3. No direct test locks "including outside-month cells" for the disabled guard (DD-2). The guard is handler-level so it applies, but a test targeting a disabled outside-month cell would pin the clause.
4. Weekend-array header order for `[6,0]` is only asserted through the shared-fate oracle formula (`(i + first) % 7` in both component and test oracle); hard anchors exist only for Mon–Fri and fDoW=0+Mon–Sat. A hard-coded header assertion for `[6,0]` would remove the shared-fate coupling.
5. The full-gate TDD row (5.1–5.4) and the component-spec safety-net row quote apply-time narrative counts ("80 tests", "62/62"); the pre-change count at HEAD is verifiable (46 = 42 component + 4 date-utils) but the exact running count during apply is not independently reconstructable — keep the safety-net column to verifiable numbers.
6. Delivery state: the whole change (library + demo + docs + openspec artifacts) is uncommitted in the working tree, while `apply-progress.md` states "direct commits to main". The rollback plan presumes revert commits; commit (or explicitly defer) before delivery so the rollback boundary exists.

### Verdict

PASS — full gate green on fresh execution with 27/27 scenarios compliant. `npx ng test --watch=false` EXIT 0 (81 library + 3 demo = 84), both builds EXIT 0, `npx prettier --check .` EXIT 0, SCSS 3582 B < 4096 B. Both CRITICALs (formatter, TDD table) and both WARNINGs (PARTIAL context-contract scenario, safety-net label) are resolved and re-verified; only non-blocking SUGGESTIONs remain. Archive-ready.
