# Archive Report — day-cell-enhancements

**Archived**: 2026-09-22
**From**: `openspec/changes/day-cell-enhancements/` (active)
**To**: `openspec/changes/archive/2026-09-22-day-cell-enhancements/`
**Artifact store**: openspec
**Status at close**: SUCCESS — full cycle complete; delivery pending (see Delivery State).

## Final State (at close)

Facts below are the state of the change AT CLOSE, ranked per the Final-State Authority
hierarchy (native status > persisted tasks artifact > orchestrator launch-prompt final-state
facts > intermediate snapshots).

- **Tasks**: all tasks in the persisted `tasks.md` are checked `[x]`; 0 unchecked. Native
  status reports `taskProgress: 19/19 completed, allComplete: true`. NOTE ON COUNT: the
  persisted artifact contains 19 task checkboxes (phases 1–6: 4+6+2+2+2+3); the "16 tasks"
  figure in `apply-progress.md` and `verify-report.md` is a stale count from the moment those
  snapshots were written. Both sources agree on completeness — every task is complete.
- **Tests**: 48/48 passing (45 library + 3 demo), EXIT 0
  (`test_output_hash sha256:f3439a0d1f24730e999deab80a14777787595dca08189b03ed0cc27463971eed`).
- **Builds**: both green —
  `npx ng build calendulum` (library, ng-packagr FESM+DTS) and `npx ng build demo` (app),
  EXIT 0 (`build_output_hash sha256:d8a4c574ef0965b4650cbc3632e4f4a67ef3d89e40bb46718b827f1144d613e3`).
- **Formatter**: `npx prettier --check .` clean (EXIT 0).
- **Spec compliance**: 16/16 requirements, 26/26 scenarios compliant
  (day-click 3/7, day-styling 5/8, day-cell-content 5/6, context-contract 3/5) — per
  `verify-report.md` at verification time; no later work changed these counts.
- **Verification verdict**: PASS WITH WARNINGS at verification time — both warnings/suggestions
  that affected process or config are resolved in the final state (below). Zero CRITICAL findings
  at any point; no CRITICAL ever blocked archive.
- **Review gate**: Native status reports `reviewGate` structurally ABSENT — no review was ever
  discovered for this candidate; archive proceeds under ordinary repository policy. A
  `reviewOffer` was present in status (post-verify invitation) and was declined by proceeding
  to archive, which the contract defines as an invitation, never a gate.

### Resolution of verification-time WARNINGS / SUGGESTIONS

| #          | Item (verify-report)                                                                                                           | Final-state resolution                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1         | `apply-progress.md` absent from the openspec store (lived only in Engram #70)                                                  | **Resolved** — the orchestrator materialized `openspec/changes/day-cell-enhancements/apply-progress.md` (now in archive); full TDD Cycle Evidence table present.                              |
| S3         | `openspec/config.yaml` `verify.build_command` drift (`npx ng build` alone fails: no defaultProject in multi-project workspace) | **Resolved** — `config.yaml` now reads `npx ng build calendulum && npx ng build demo` (line 46).                                                                                              |
| S1, S2, S4 | Demo smoke assertion strength; implicit-context assertion strength; computed-style jsdom proxy residual                        | **Carried forward** — non-blocking quality suggestions, no code defect; S4 (browser-level computed-style proof) explicitly residual-by-design per the spike-proven custom-property mechanism. |

## Specs Synced

Main spec store (`openspec/specs/`) was empty (only `.gitkeep`) before archive. Per the
`config.yaml` archive rule ("Warn before merging destructive deltas"): **no destructive merge
occurred** — all four delta specs were created as new main specs, so no warning was required.
All syncs performed with mechanical shell copy + byte-identity `diff -r` readback (empty).

| Domain             | Action  | Details                                                                                                                                              |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `day-click`        | Created | 3 requirements, 7 scenarios — `dayClick` output with viewport coords, additive selection, custom-cell a11y parity                                    |
| `day-styling`      | Created | 5 requirements, 8 scenarios — `dayStyle` record keyed by `dateKey()`, local ISO keying, custom-property application, state precedence, class merging |
| `day-cell-content` | Created | 5 requirements, 6 scenarios — top/bottom slots, full context, pointer-event pass-through, `dayCell` precedence, styling cooperation                  |
| `context-contract` | Created | 3 requirements, 5 scenarios — flat template context `{date, inMonth, isToday, isSelected}`, README contract parity, `DayCell` purity                 |

## Archive Contents

Moved mechanically (`mv` fallback — the change folder was untracked in git, so `git mv`
was inapplicable), verified byte-identical against a pre-move recursive snapshot via
`diff -r` (empty output):

- `exploration.md` ✅
- `proposal.md` ✅
- `specs/{day-click,day-styling,day-cell-content,context-contract}/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (19/19 tasks complete, 0 unchecked)
- `apply-progress.md` ✅
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file — additive, excluded from byte-identity comparison)

Active changes directory (`openspec/changes/`) no longer contains the change.

## Artifacts Read (traceability)

All artifacts were read from the openspec file store (not Engram):

- `openspec/changes/day-cell-enhancements/proposal.md`
- `openspec/changes/day-cell-enhancements/design.md`
- `openspec/changes/day-cell-enhancements/tasks.md`
- `openspec/changes/day-cell-enhancements/apply-progress.md`
- `openspec/changes/day-cell-enhancements/verify-report.md`
- `openspec/changes/day-cell-enhancements/specs/{day-click,day-styling,day-cell-content,context-contract}/spec.md`
- `openspec/config.yaml`
- Native status: `gentle-ai sdd-status day-cell-enhancements --cwd /home/kitos/calendulum --json` (v1)

## Delivery State

The implementation lives ONLY in the working tree — it has NOT been committed. Per the
orchestrator's explicit instruction, the archive phase did not commit. **Delivery/commit is
PENDING with the orchestrator** (direct commits to `main` per project preference; delivery
strategy `exception-ok`, size:exception accepted by maintainer, no chained PRs).

Files affected by the change (working tree): library `date-utils.ts(+spec)`,
`calendulum-month.{ts,html,scss,spec.ts}`; demo `app.{ts,html,scss}` (+spec/config);
`README.md`; repo config files (formatting-only prettier fixes); `openspec/` artifacts;
`.gitignore` (+/.atl).

## Notes

- `state.yaml` was absent from the active change folder at archive time (orchestrator-owned
  artifact per the OpenSpec convention). Reported for completeness; it is not a phase
  artifact and does not affect archive validity.
- The change was archived as `mv` (untracked path) with snapshot + empty `diff -r` readback —
  byte-identity of every artifact is preserved; no content passed through model Read/Write.
- Archive is an audit trail: content will not be modified or deleted.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. Ready for the next
change; commit/delivery of the working tree remains with the orchestrator.
