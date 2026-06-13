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
status: inbox
target:
notes: open decision — cairn- prefix vs Claude Code plugin/package (cairn:capture)
---

The five skills install into the shared `~/.claude/skills/` with very generic names
(`capture`, `plan`, `sync`, `shutdown`, `ballot`), which can collide with other skills
there. Give them a CAIRN namespace.

Two approaches (pick one):

- **Simple prefix** — rename to `cairn-capture` … `cairn-ballot` (invoked `/cairn-capture`).
  Quick, no extra machinery.
- **Plugin / package** — ship them as a Claude Code plugin so they namespace as
  `cairn:capture`. Canonical, but needs a plugin manifest + packaging.

Ripple to update together when renaming:
- the `name:` frontmatter in each `skills/*/SKILL.md`
- `src/core/skills.ts` `ORDER` (legend order)
- every `/command` reference inside the skill bodies (e.g. capture→/plan, sync→/plan,
  shutdown→/ballot)
- `src/commands/init.ts` output ("/capture /plan /sync /shutdown")
- the TUI hints — Idle "run /plan", footer "ballot due · /ballot", skills legend
- README skills table + the spec mockup
