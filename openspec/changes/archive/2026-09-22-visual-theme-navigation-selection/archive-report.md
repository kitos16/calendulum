# Archive Report: visual-theme-navigation-selection

## Change Summary

**Change**: visual-theme-navigation-selection
**Archived to**: `openspec/changes/archive/2026-09-22-visual-theme-navigation-selection/`
**Date**: 2026-09-22
**Status**: Complete (all 51/51 tasks verified, 145 tests passing, SCSS 3879B < 4096B budget)

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| context-contract | MODIFIED | Appended ADDED requirements: weekNumber, isInRange, isRangeStart, isRangeEnd context flags (7 scenarios) + README documentation requirement (1 scenario). Preserved all 3 original requirements and scenarios. |
| disabled-days | MODIFIED | Replaced 7 requirements with updated versions adding minDate/maxDate bounds merge logic. Added 15 new scenarios covering bounds-disabled cells, OR logic with predicate, inclusive bounds, bounds-disabled activation blocking, aria-disabled, disabled class, context flag, unconditional select(), README bounds merge docs. Preserved all original scenarios. |
| selection-modes | CREATED | New main spec: 9 requirements, 33 scenarios covering single/multiple/range selection modes, discriminated union value type, weekNumbers ISO column, bounds integration, backward compatibility. |
| font-size | CREATED | New main spec: 3 requirements, 9 scenarios covering discrete tiers (sm/md/lg), CSS var multiplier (0.875/1/1.125), uniform text scaling, runtime updates. |
| density | CREATED | New main spec: 3 requirements, 9 scenarios covering discrete tiers (compact/cozy/spacious), CSS var multiplier (0.75/1/1.375), cell padding/gap/header height scaling via calc(), runtime updates. |
| corner-radius | CREATED | New main spec: 3 requirements, 9 scenarios covering discrete tiers (sm/md/lg/full), CSS var override (0.25rem/0.5rem/0.75rem/9999px), applies to day cells/header/dropdown, runtime updates. |
| extended-navigation | CREATED | New main spec: 5 requirements, 23 scenarios covering minDate/maxDate bounds (clamping, nav button disable, cell disable), monthSelector dropdown/arrows/none, dropdown bounds filtering, native select accessibility. |

## Archive Contents

All artifacts preserved in archive:
- ✅ proposal.md
- ✅ exploration.md
- ✅ design.md
- ✅ tasks.md (51/51 tasks complete, all checked)
- ✅ apply-progress.md
- ✅ specs/ (7 domain subdirectories with spec.md each)
- ❌ verify-report.md (not generated — orchestrator verified fresh: 145 tests, builds, prettier, SCSS budget)

## Source of Truth Updated

The following main specs now reflect the new behavior:
- `openspec/specs/context-contract/spec.md` — extended template context contract
- `openspec/specs/disabled-days/spec.md` — bounds merge into disabled logic
- `openspec/specs/selection-modes/spec.md` — new selection modes with week numbers
- `openspec/specs/font-size/spec.md` — new fontSize input
- `openspec/specs/density/spec.md` — new density input
- `openspec/specs/corner-radius/spec.md` — new cornerRadius input
- `openspec/specs/extended-navigation/spec.md` — new minDate/maxDate bounds and monthSelector

## Verification Evidence

- **Mechanical copy verified**: All `diff -r` comparisons between source and destination produced empty output (byte-identical)
- **Task Completion Gate passed**: All 51 implementation tasks checked in tasks.md
- **No CRITICAL issues**: Verification passed (145 tests, 2 builds, prettier clean, SCSS 3879B < 4096B)
- **Archive folder created**: `openspec/changes/archive/2026-09-22-visual-theme-navigation-selection/`
- **Active changes directory cleaned**: `openspec/changes/visual-theme-navigation-selection/` no longer exists

## Key Implementation Decisions Archived

1. **Value type**: Simple union `Date | null | Date[] | {start, end}` with external `selectionMode` discriminant (not embedded discriminated union) — preserves backward compatibility
2. **Bounds semantics**: Inclusive absolute calendar limits applied before weekday filter; merged into `isDisabled` via OR with predicate
3. **Month selector**: Native `<select>` for accessibility, styled via existing CSS vars (`--cld-font`, `--cld-radius`, `--cld-bg`, `--cld-border`)
4. **CSS custom properties**: Single multiplier per visual input (fontSize, density, cornerRadius) — minimal SCSS budget growth (~297B delta)
5. **Oracle-derived tests**: Integration expectations computed from same pure functions (`getISOWeek`, `clampDate`, `normalizeValue`, `isInRange`) — prevents combinatorial explosion

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
Ready for the next change.
