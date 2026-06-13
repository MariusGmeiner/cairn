---
id: CAIRN-008
title: Reword onboarding starter from delete to wontdo
summary: The seeded starter teaches deleting items, which is off-model; it should teach marking them wontdo.
requested_by: you
date: 2026-06-12
type: qol
area: cli
benefits: new users — onboarding matches the real status-driven workflow
size: S
status: next
target: the seeded starter text tells you to mark items wontdo, not delete them
notes: src/commands/init.ts (STARTERS — the CAIRN-004 seed)
---

CAIRN's model never deletes backlog items (spec §5): items live forever as files and
move through statuses, `shipped` = done, `wontdo` = declined (with a reason). But the
seeded onboarding starter literally says "Delete these starter items", teaching the one
move the workflow never makes.

Reword the seed in `src/commands/init.ts` so it teaches the spec-aligned cleanup — e.g.
"Mark these starters wontdo once you're rolling" — and point at the `wontdo` status
rather than `rm`.
