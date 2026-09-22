```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:fd9c6b7c512fb3eb6af1a91efe0eb2a1f75ab473ca97c147b81fca7798730595
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 16/16
scenarios: 26/26
test_command: npx ng test --watch=false
test_exit_code: 0
test_output_hash: sha256:f3439a0d1f24730e999deab80a14777787595dca08189b03ed0cc27463971eed
build_command: npx ng build calendulum && npx ng build demo
build_exit_code: 0
build_output_hash: sha256:d8a4c574ef0965b4650cbc3632e4f4a67ef3d89e40bb46718b827f1144d613e3
```

## Verification Report

**Change**: day-cell-enhancements
**Version**: N/A (4 delta specs, no version field)
**Mode**: Strict TDD

### Completeness

| Metric           | Value |
| ---------------- | ----- |
| Tasks total      | 16    |
| Tasks complete   | 16    |
| Tasks incomplete | 0     |

### Build & Tests Execution

**Build**: ✅ Passed

```text
npx ng build calendulum -> EXIT 0 (Built calendulum, ng-packagr FESM+DTS)
npx ng build demo -> EXIT 0 (Initial total 237.87 kB; anyComponentStyle budget no warning)
build_output_hash: sha256:d8a4c574ef0965b4650cbc3632e4f4a67ef3d89e40bb46718b827f1144d613e3
```

**Tests**: ✅ 48 passed / ❌ 0 failed / ⚠️ 0 skipped

```text
npx ng test --watch=false -> EXIT 0
Test Files 1 passed (1) | Tests 3 passed (3)   [demo]
Test Files 2 passed (2) | Tests 45 passed (45) [lib]
Total: 48 passed (45 library + 3 demo)
test_output_hash: sha256:f3439a0d1f24730e999deab80a14777787595dca08189b03ed0cc27463971eed
```

**Coverage**: ➖ Not available (config.yaml `coverage: false`; no coverage tool detected — not a failure)

**Formatter**: `npx prettier --check .` → EXIT 0, "All matched files use Prettier code style!"

**Component style budget**: calendulum-month compiled SCSS ≈ 2.9 kB (< 4 kB `anyComponentStyle` warning threshold; no build warning emitted). Task 6.2's "3,092 B" figure is context-dependent but the budget constraint holds.

### Spec Compliance Matrix

Spec counts: **16 requirements / 26 scenarios** (day-click 3/7, day-styling 5/8, day-cell-content 5/6, context-contract 3/5).

| Requirement                                                                   | Scenario                                                    | Test                                                                                                                                                                                                                                      | Result                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| day-click: dayClick output with viewport coordinates                          | click on an in-month day emits payload and selects          | `calendulum-month.spec.ts > dayClick > emits the date and viewport coordinates, then selects the day` (MouseEvent clientX:120, clientY:340)                                                                                               | ✅ COMPLIANT                                      |
| day-click: dayClick output with viewport coordinates                          | two clicks at different points produce distinct coordinates | `calendulum-month.spec.ts > emits distinct coordinates for clicks at different viewport points` (10,20 vs 300,500)                                                                                                                        | ✅ COMPLIANT                                      |
| day-click: dayClick is additive to selection                                  | outside day click emits and selects without navigation      | `calendulum-month.spec.ts > selects an outside day without navigating or emitting monthChange` (monthChange remains empty)                                                                                                                | ✅ COMPLIANT                                      |
| day-click: dayClick is additive to selection                                  | hidden outside cells do not emit                            | `calendulum-month.spec.ts > does not emit for hidden decorative cells when outside days are hidden`                                                                                                                                       | ✅ COMPLIANT                                      |
| day-click: custom dayCell interaction parity                                  | click on custom cell emits and selects                      | `calendulum-month.spec.ts > emits dayClick with viewport coordinates and selects on click` (custom wrapper, clientX:55, clientY:99)                                                                                                       | ✅ COMPLIANT                                      |
| day-click: custom dayCell interaction parity                                  | custom cell wrapper has button semantics                    | `calendulum-month.spec.ts > exposes button semantics on the cell wrapper` (role=button, tabindex=0)                                                                                                                                       | ✅ COMPLIANT                                      |
| day-click: custom dayCell interaction parity                                  | Enter and Space activate a focused custom cell              | `calendulum-month.spec.ts > emits {date, x: 0, y: 0} and selects on Enter` + `... on Space`                                                                                                                                               | ✅ COMPLIANT                                      |
| day-styling: dayStyle input keyed by local ISO date                           | styled day receives its entry                               | `calendulum-month.spec.ts > applies the entry via --cld-day-* custom properties to that day only`; `resolveDayStyle > maps an entry to --cld-day-*`                                                                                       | ✅ COMPLIANT                                      |
| day-styling: dayStyle input keyed by local ISO date                           | day absent from the record is unchanged                     | `leaves days absent from the record unmodified` + `resolveDayStyle > returns an empty record for a day absent`                                                                                                                            | ✅ COMPLIANT                                      |
| day-styling: dateKey uses local calendar components                           | negative-offset timezone keeps the local day                | `date-utils.spec.ts > keeps the local calendar day at 23:30 local time` + `never follows toISOString into the UTC-shifted day`                                                                                                            | ✅ COMPLIANT                                      |
| day-styling: dateKey uses local calendar components                           | single-digit month and day are padded                       | `date-utils.spec.ts > zero-pads single-digit month and day` ('2026-01-05')                                                                                                                                                                | ✅ COMPLIANT                                      |
| day-styling: per-cell custom property application                             | day background renders from the entry                       | `applies the entry via --cld-day-*` asserts `--cld-day-bg: pink` inline + SCSS `background: var(--cld-day-bg, transparent)` static; jsdom cannot resolve var() — the design-documented proxy is this scenario's mandated integration test | ✅ COMPLIANT (mechanism proxy — see SUGGESTION 4) |
| day-styling: state class precedence                                           | selected day keeps the state background                     | `keeps the selected state background while the entry border still applies` (style.background === '' — no inline override; selected class + border prop asserted; cascade order static)                                                    | ✅ COMPLIANT                                      |
| day-styling: state class precedence                                           | README documents precedence                                 | README.md §Per-day styling — state wins background/color, border always applies, consumer class merged, outside-day color caveat                                                                                                          | ✅ COMPLIANT (static review scenario)             |
| day-styling: external class merging                                           | consumer class coexists with state classes                  | `merges the consumer class with the state classes` + `resolveCellClasses > appends the consumer class without replacing state classes`                                                                                                    | ✅ COMPLIANT                                      |
| day-cell-content: top and bottom slot rendering                               | slot content renders above the number                       | `renders slot wrappers in every day cell, top above the number and bottom below` (84 wrappers; structural order proxy + absolute positioning static)                                                                                      | ✅ COMPLIANT                                      |
| day-cell-content: top and bottom slot rendering                               | absent slots render nothing                                 | `renders no slot wrappers when neither slot input is provided`                                                                                                                                                                            | ✅ COMPLIANT                                      |
| day-cell-content: slots receive the full day context                          | slot template reads context flags                           | `passes the flat context flags to slot templates` (only today's bottom-slot shows 'T')                                                                                                                                                    | ✅ COMPLIANT                                      |
| day-cell-content: slot content never intercepts pointer events                | click on slot content still activates the day               | `activates the day when slot content is clicked (click bubbles to the button)` (emits + selects)                                                                                                                                          | ✅ COMPLIANT                                      |
| day-cell-content: dayCell takes precedence over slots                         | dayCell and slots provided together                         | `renders only the custom dayCell content when dayCell is provided with slots` (no buttons, no slot wrappers)                                                                                                                              | ✅ COMPLIANT                                      |
| day-cell-content: cooperation with dayStyle and state classes                 | styled cell with slot content                               | `keeps dayStyle entries on cells that render slot content`                                                                                                                                                                                | ✅ COMPLIANT                                      |
| context-contract: template context exposes date, inMonth, isToday, isSelected | demo `day.isToday` works                                    | `reports day.isToday true for today only` (flag marker template) + demo `app.html` uses `day.isToday` and demo suite renders it                                                                                                           | ✅ COMPLIANT                                      |
| context-contract: template context exposes date, inMonth, isToday, isSelected | isSelected reflects the value model                         | `reports day.isSelected only for the value-model day`                                                                                                                                                                                     | ✅ COMPLIANT                                      |
| context-contract: template context exposes date, inMonth, isToday, isSelected | flags update on selection change                            | `flips isSelected flags when the selection changes` (15 → 20)                                                                                                                                                                             | ✅ COMPLIANT                                      |
| context-contract: README documents the actual contract                        | README matches the exported type                            | README.md `{ date, inMonth, isToday, isSelected }` vs `CalendulumDayCellContext` fields/types — exact match; names `isSelected`, not `selected`                                                                                           | ✅ COMPLIANT (static review scenario)             |
| context-contract: DayCell stays pure                                          | DayCell shape is unchanged                                  | `date-utils.ts` `DayCell` = `{ date, inMonth }` only; the demo's `day.isToday` etc. live on the template context, not on `DayCell`                                                                                                        | ✅ COMPLIANT (static inspection)                  |

**Compliance summary**: 26/26 scenarios compliant. One scenario ("day background renders from the entry") is verified through the design-mandated jsdom proxy — the runtime test proves the `--cld-day-bg` custom property lands on the cell and SCSS consumes it via `var()`; the actual computed style is not resolvable in jsdom (see SUGGESTION 4).

### Correctness (Static Evidence)

| Requirement                                                            | Status         | Notes                                                                                                             |
| ---------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| dayClick emits `{date, x, y}` with clientX/clientY, additive to select | ✅ Implemented | `onDayClick` emits then `select(date)`; outside days emit + select without `setView` (view unchanged)             |
| Hidden decorative cells never emit                                     | ✅ Implemented | Template renders `<span class="cld-month__cell" aria-hidden>` without handlers                                    |
| Custom dayCell wrapper: click + role/tabindex + Enter/Space            | ✅ Implemented | Wrapper div has handlers; `onDayKeydown` emits `{x:0, y:0}` convention                                            |
| dayStyle record keyed by local ISO dateKey                             | ✅ Implemented | `dayStyle = input({})`; `cellStyle` via `resolveDayStyle` → `--cld-day-*`                                         |
| dateKey local, padded, no toISOString                                  | ✅ Implemented | `date-utils.ts` local getters + padStart                                                                          |
| State classes win bg/color; border always applies                      | ✅ Implemented | SCSS: state rules later at equal specificity, no border in state rules                                            |
| Consumer class merged, never replaces state classes                    | ✅ Implemented | `resolveCellClasses` appends entry class after state classes                                                      |
| Top/bottom slots: absolute overlays, pointer-events none, dayCell wins | ✅ Implemented | SCSS `.cld-month__day-top/bottom` absolute + `pointer-events: none`; template slots only in default-button branch |
| Context `{date, inMonth, isToday, isSelected}` on $implicit            | ✅ Implemented | `cellContext()` factory; inputs typed `TemplateRef<{ $implicit: CalendulumDayCellContext }>`                      |

### Coherence (Design)

| Decision                                                                                                    | Followed? | Notes                                                               |
| ----------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
| Per-cell styling via object-form `[style]` + `--cld-day-*` custom properties                                | ✅ Yes    | `[style]="cellStyle(cell)"`; SCSS `var()` consumption; spike-proven |
| dayClick coordinate capture `(click)="onDayClick(cell.date, $event)"` both cells; keyboard `{x:0,y:0}`      | ✅ Yes    | Default button and custom wrapper wired identically                 |
| Context contract flat value via `cellContext(cell)`; typed TemplateRef inputs                               | ✅ Yes    | Matches design interface block                                      |
| Type/helper homes: dateKey in date-utils; DayStyle/ClickEvent/Context + pure helpers in calendulum-month.ts | ✅ Yes    | public-api.ts untouched, `export *` covers both                     |
| Slot layout: only default-button branch, absolute spans, dayCell fully replaces cell                        | ✅ Yes    | Template `@if (dayCell()) ... @else if (...) @else decorative`      |
| SCSS budget under 4 kB                                                                                      | ✅ Yes    | Measured ≈2.9 kB compiled; no anyComponentStyle warning             |

### TDD Compliance (apply-progress from Engram #70, cross-checked against reality)

| Check                         | Result | Details                                                                                                                                                       |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TDD Evidence reported         | ✅     | Full TDD Cycle Evidence table in `sdd/day-cell-enhancements/apply-progress` (Engram #70); all 16 task rows carry RED/GREEN/TRIANGULATE/SAFETY-NET             |
| All tasks have tests          | ✅     | 16/16 — docs/README and full-gate rows marked N/A appropriately; every code task maps to a real spec file                                                     |
| RED confirmed (tests exist)   | ✅     | `date-utils.spec.ts` (4), `calendulum-month.spec.ts` (41), `app.spec.ts` (3) all exist                                                                        |
| GREEN confirmed (tests pass)  | ✅     | 48/48 pass on execution (45 lib + 3 demo, EXIT 0)                                                                                                             |
| Triangulation adequate        | ✅     | dateKey 4 cases, resolveCellClasses 5, dayClick 4 (2 coords + outside + hidden), flags 3, styles 4, slots 5, a11y 4, demo 3 — all match apply-progress claims |
| Safety Net for modified files | ✅     | 41/41 lib spec (2 harness-defect fixes documented), 3/3 demo                                                                                                  |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution

| Layer       | Tests  | Files                                                                             | Tools                        |
| ----------- | ------ | --------------------------------------------------------------------------------- | ---------------------------- |
| Unit        | 13     | 2 (`date-utils.spec.ts` 4, pure-helper describes in `calendulum-month.spec.ts` 9) | vitest 4 + jsdom 28          |
| Integration | 35     | 2 (`calendulum-month.spec.ts` 32 TestBed, `app.spec.ts` 3)                        | TestBed (no testing-library) |
| E2E         | 0      | 0                                                                                 | not installed                |
| **Total**   | **48** | **4**                                                                             |                              |

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected (config.yaml `coverage: false`; informational, not blocking).

### Assertion Quality

✅ All assertions verify real behavior. No tautologies, no ghost loops (flag/slot filters assert non-empty collections first), no type-only-only assertions. Styling assertions use documented custom-property proxies (jsdom cannot resolve `var()`); class assertions verify spec'd state-class preservation, which the design defines as the observable behavior at this layer.

### Quality Metrics

**Linter**: ➖ Not available (no ESLint configured)
**Type Checker**: ✅ No errors (strict TS + strictTemplates flow through both `ng build` runs — library FESM/DTS + demo app both EXIT 0)
**Formatter**: ✅ `npx prettier --check .` clean (EXIT 0)

### Issues Found

**CRITICAL**: None

**WARNING**:

1. **Apply-progress file absent from openspec store** — the session's artifact store is `openspec`, but `openspec/changes/day-cell-enhancements/apply-progress.md` does not exist; the apply-progress artifact (with the full TDD Cycle Evidence table) lives only in Engram (#70). No substance is lost — the table was read and cross-verified against the actual test files and execution — but the file-store copy is missing (process-form deviation).

**SUGGESTION**:

1. `projects/demo/src/app/app.spec.ts` `creates the app` is a smoke assertion (`toBeTruthy()`); its two sibling tests already assert rendered content — could assert a concrete element instead.
2. `passes the DayCell as the implicit context` (custom dayCell describe) asserts only that the rendered day number is in 1..31 — asserting the exact date of the first grid cell would be stronger.
3. `openspec/config.yaml` `verify.build_command` still reads `npx ng build calendulum && npx ng build` — the bare `ng build` fails in this multi-project workspace (no defaultProject); the working command is `npx ng build calendulum && npx ng build demo`. Config drift worth correcting.
4. Computed-style residual: `day-styling` "day background renders from the entry" is covered by the design-documented jsdom proxy (inline `--cld-day-*` + SCSS `var()` chain, spike-proven on Angular 21). If browser-level proof of the computed background is ever required, a Playwright/`ng e2e` smoke would close the residual gap; no code defect exists.

### Verdict

PASS WITH WARNINGS — all 16 tasks complete; 48/48 tests pass (EXIT 0); both library and demo builds green; prettier clean; 26/26 spec scenarios compliant (one via the design-mandated jsdom proxy); TDD evidence fully verified against reality; no CRITICAL findings.
