---
id: CAIRN-009
title: Namespace the CAIRN skills to avoid collisions
summary: Prefix the five skills so capture/plan/sync/shutdown/ballot don't clash in the global ~/.claude/skills.
requested_by: you
date: 2026-06-12
type: qol
area: skills
benefits: anyone installing cairn alongside other skills — no name clashes
size: M
status: shipped
target: the bundled skills are cairn-capture … cairn-ballot (directory + name:), and skills.ts ORDER plus every in-app /command hint use the cairn- names
notes: decided — simple cairn- prefix (cairn-capture … cairn-ballot, invoked /cairn-capture)
shipped: 2026-06-13
---
The five skills install into the shared `~/.claude/skills/` with very generic names
(`capture`, `plan`, `sync`, `shutdown`, `ballot`), which can collide with other skills
there. Give them a CAIRN namespace.

**Decided: the simple `cairn-` prefix.** Rename to `cairn-capture` … `cairn-ballot`
(invoked `/cairn-capture`). Quick, no plugin manifest/packaging machinery.

Ripple to update together when renaming:
- the `name:` frontmatter in each `skills/*/SKILL.md`
- `src/core/skills.ts` `ORDER` (legend order)
- every `/command` reference inside the skill bodies (e.g. capture→/plan, sync→/plan,
  shutdown→/ballot)
- `src/commands/init.ts` output ("/capture /plan /sync /shutdown")
- the TUI hints — Idle "run /plan", footer "ballot due · /ballot", skills legend
- README skills table + the spec mockup
