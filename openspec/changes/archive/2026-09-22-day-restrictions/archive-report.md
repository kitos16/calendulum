# Archive Report — day-restrictions

**Archived**: 2026-09-22
**From**: `openspec/changes/day-restrictions/` (active)
**To**: `openspec/changes/archive/2026-09-22-day-restrictions/`
**Artifact store**: openspec
**Status at close**: SUCCESS — full cycle complete; implementation committed to `main`; push to
remote pending with the orchestrator (see Delivery State).

## Final State (at close)

Facts below are the state of the change AT CLOSE, ranked per the Final-State Authority
hierarchy (native status > persisted tasks artifact > orchestrator launch-prompt final-state
facts > intermediate snapshots).

- **Tasks**: all tasks in the persisted `tasks.md` are checked `[x]`; 18/18 complete, 0
  unchecked (Task Completion Gate passed before any spec sync or archive move).
- **Tests**: 84 passed / 0 failed / 0 skipped — 81 library (2 files) + 3 demo (1 file), EXIT 0
  (`test_output_hash sha256:001cd3a15c407c8e0ab23d804376c2c8ff79d2c09d642d03dd8c1b7bd8a04057`,
  per round-3 `verify-report.md` at verification time; no later work changed these counts).
  NOTE ON COUNT: `apply-progress.md` (apply-time snapshot) says "80 tests";
  the authoritative round-3 execution reports 84. Both sources agree on green; 84 is final.
- **Builds**: both green — `npx ng build calendulum` (library, ng-packagr FESM+DTS) and
  `npx ng build demo` (app), EXIT 0
  (`build_output_hash sha256:74268afee555dc81999511112c154a45b7dc106b65d16a01453940a2f537d525`).
- **Formatter**: `npx prettier --check .` clean (EXIT 0).
- **Style budget**: 3582 B < 4096 B warning threshold (`anyComponentStyle`).
- **Spec compliance**: 15/15 requirements, 27/27 scenarios compliant
  (context-contract 2/2, disabled-days 7/7, visible-days 6/6) — per round-3
  `verify-report.md` at verification time; no later work changed these counts.
- **Verification verdict**: PASS — round 3 is the authoritative report (`verify-report.md` in
  the archive). Both round-2 WARNINGs were resolved before round 3 (see table below). Zero
  CRITICAL findings at any point; no CRITICAL ever blocked archive.
- **Review gate**: `reviewGate` structurally ABSENT — no review was ever discovered for this
  candidate. `gentle-ai sdd-status` returned empty review artifact lists (policy, ledger,
  receipt, bundle, context, state) and no review files exist anywhere in the repository;
  archive proceeds under ordinary repository policy. No `reviewOffer` follow-up was pursued
  (declined by proceeding to archive — the contract defines it as an invitation, never a gate).

### Resolution of verification-time WARNINGs / SUGGESTIONs

| #       | Item (verify-report)                                                                                    | Final-state resolution                                                                                                                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1 (r2) | context-contract "slot templates expose isDisabled" was PARTIAL (no direct coverage test)               | **Resolved before round 3** — `calendulum-month.spec.ts` gained `CalendulumMonth dayCellBottom slot exposes isDisabled`: renders 42 bottom slots, asserts exactly 1 shows the disabled mark, on day 15. Round-3 matrix row reports "slot templates expose isDisabled" ✅ COMPLIANT. |
| W2 (r2) | Safety-net label on `date-utils.spec.ts` read "N/A (new)" while the file pre-existed                    | **Resolved before round 3** — `apply-progress.md` row 1.1–1.2 now reads "✅ 4/4", verified against HEAD (4 pre-existing `dateKey` tests, +35/−1).                                                                                                                                   |
| S1      | Materialize/format OpenSpec artifacts through prettier at write time                                    | **Carried forward** — non-blocking process note; acknowledged by this phase (all files prettier-formatted at write).                                                                                                                                                                |
| S2      | SCSS growth (+490 B: 3092 → 3582 B) exceeded the design's ~+150 B estimate; still 514 B under threshold | **Carried forward** — record for future estimates; no defect.                                                                                                                                                                                                                       |
| S3      | No direct test locks "including outside-month cells" for the disabled guard (DD-2)                      | **Carried forward** — guard is handler-level so it applies by construction; a dedicated test would pin the clause.                                                                                                                                                                  |
| S4      | Weekend-array header order for `[6,0]` only asserted via the shared-fate oracle formula                 | **Carried forward** — hard anchors exist for Mon–Fri and fDoW=0+Mon–Sat; a hard-coded `[6,0]` header assertion would remove the shared-fate coupling.                                                                                                                               |
| S5      | Full-gate TDD row and component safety-net row quote apply-time narrative counts ("80 tests", "62/62")  | **Carried forward** — keep the safety-net column to verifiable numbers (HEAD count 46 = 42 component + 4 date-utils is verifiable).                                                                                                                                                 |
| S6      | "Delivery state: uncommitted in the working tree … commit (or explicitly defer) before delivery"        | **Resolved** — implementation was committed to `main` in `f9d96db` (feat) + `a97962f` (docs) after round 3; the rollback boundary now exists. Push to remote remains pending with the orchestrator.                                                                                 |

## Specs Synced

Main spec store (`openspec/specs/`) per the `config.yaml` archive rule ("Warn before merging
destructive deltas"): **no destructive merge occurred** — the `context-contract` delta contains
only MODIFIED blocks (no REMOVED requirements, no removed scenarios), so no warning was
required. The MODIFIED blocks were applied verbatim from the delta (full replacement text,
including the "(Previously: …)" provenance notes); all requirements and scenarios NOT in the
delta were preserved byte-for-byte (`DayCell stays pure` requirement + its scenario, the
Purpose section, and the three unchanged context scenarios). The two new domain specs were
copied mechanically via the temp-file pattern with byte-identity `diff -r` readback (empty).

**Verbatim `diff -r` readback — new spec copies (source vs. temp, empty = passing):**

```text
--- diff -r readback: disabled-days (source vs temp) ---
(empty diff above = byte-identical)
--- diff -r readback: visible-days (source vs temp) ---
(empty diff above = byte-identical)
```

| Domain             | Action  | Details                                                                                                                                                                                                                                                   |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context-contract` | Updated | 2 MODIFIED requirements (context shape, README contract) — `isDisabled` added to both; 1 new scenario ("slot templates expose isDisabled"); 3 scenarios preserved; `DayCell stays pure` + Purpose untouched. Final main spec: 3 requirements, 6 scenarios |
| `disabled-days`    | Created | 7 requirements, 11 scenarios — `isDayDisabled` predicate, UI activation guards, focusable `aria-disabled`, `--disabled` class + hover neutralizer, `isDisabled` context flag, unconditional `select()`, README key-set recipe                             |
| `visible-days`     | Created | 6 requirements, 11 scenarios — `visibleDays` union input, stable 6-row column projection, header alignment, `--cld-week-columns` binding, invalid → `all` normalization, model/navigation independence, README visibility contract                        |

## Archive Contents

Moved mechanically with `git mv` (`openspec/changes/day-restrictions/` is tracked — committed
in `a97962f`), verified byte-identical against a pre-move recursive snapshot via `diff -r`
(empty output):

```text
--- diff -r readback: pre-move snapshot vs archived folder ---
(empty diff above = byte-identical)
```

- `exploration.md` ✅
- `proposal.md` ✅
- `specs/{context-contract,disabled-days,visible-days}/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (18/18 tasks complete, 0 unchecked)
- `apply-progress.md` ✅
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file — additive, excluded from byte-identity comparison)

Active changes directory (`openspec/changes/`) no longer contains the change.

## Artifacts Read (traceability)

All artifacts were read from the openspec file store (not Engram):

- `openspec/changes/day-restrictions/proposal.md`
- `openspec/changes/day-restrictions/design.md`
- `openspec/changes/day-restrictions/exploration.md`
- `openspec/changes/day-restrictions/tasks.md`
- `openspec/changes/day-restrictions/apply-progress.md`
- `openspec/changes/day-restrictions/verify-report.md`
- `openspec/changes/day-restrictions/specs/{context-contract,disabled-days,visible-days}/spec.md`
- `openspec/specs/context-contract/spec.md` (pre-merge main spec)
- `openspec/config.yaml`
- `openspec/changes/archive/2026-09-22-day-cell-enhancements/archive-report.md` (convention reference)
- Native status: `gentle-ai sdd-status day-restrictions --cwd /home/kitos/calendulum --json` (v1)

## Delivery State

Implementation and all SDD artifacts are **committed to `main`** — the rollback boundary
exists and the round-3 verify SUGGESTION 6 is closed:

- `f9d96db` `feat: add disabled days and visible weekday filter to month view`
- `a97962f` `docs: add openspec SDD artifacts for day restrictions`

**Push to remote is PENDING with the orchestrator** (direct commits to `main` per project
preference; delivery strategy `exception-ok`, size:exception accepted by maintainer, no
chained PRs). Files affected by the change: library `date-utils.ts(+spec)`,
`calendulum-month.{ts,html,scss,spec.ts}`; demo `app.{ts,html,scss}`; `README.md`;
`openspec/` artifacts (delta specs, this archive, merged main specs).

## Notes

- `state.yaml` was absent from the active change folder at archive time (orchestrator-owned
  artifact per the OpenSpec convention). Reported for completeness; it is not a phase artifact
  and does not affect archive validity.
- The change was archived as `git mv` (tracked path) with snapshot + empty `diff -r` readback —
  byte-identity of every artifact is preserved; no content passed through model Read/Write
  except the deliberate MODIFIED-requirements merge into the existing `context-contract` main
  spec (a merge, not a copy — the delta's replacement blocks mirror the delta verbatim).
- New main specs `openspec/specs/disabled-days/spec.md` and `openspec/specs/visible-days/spec.md`
  are untracked additions in the working tree awaiting orchestrator delivery.
- Archive is an audit trail: content will not be modified or deleted.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. Ready for the next
change; push/commit of the working tree additions remains with the orchestrator.
