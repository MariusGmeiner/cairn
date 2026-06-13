---
id: CAIRN-007
title: cairn init adds .cairn/activity to root .gitignore
summary: On init, ignore the activity log via the repo's root .gitignore instead of a separate nested file.
requested_by: you
date: 2026-06-12
type: qol
area: cli
benefits: anyone running cairn init — cleaner, conventional ignore handling
size: S
status: shipped
target: cairn init in a fresh repo adds .cairn/activity/ to the root .gitignore (idempotent on re-run)
notes: src/commands/init.ts — today it writes a nested .cairn/.gitignore (activity/)
shipped: 2026-06-13
---
When `cairn init` runs, append `.cairn/activity/` to the **repo's root `.gitignore`**
(create the file if missing; idempotent — don't duplicate an existing entry) so the
local activity log is ignored without needing a separate committed file.

Open question for implementation: keep the current nested `.cairn/.gitignore`, or drop
it in favour of the single root-level entry.
