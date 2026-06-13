---
id: CAIRN-007
target: cairn init in a fresh repo adds .cairn/activity/ to the root .gitignore (idempotent on re-run)
progress: 0
started: 2026-06-12
---
- next: in src/commands/init.ts, append `.cairn/activity/` to the repo root .gitignore (idempotent — skip if already present); decide whether to drop the nested .cairn/.gitignore. CAIRN-008 lives in the same file, so batch them.
