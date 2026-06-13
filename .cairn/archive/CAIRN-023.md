---
id: CAIRN-023
title: Archive shipped items out of backlog
summary: Move shipped/wontdo items to .cairn/archive/ so planning only scans live work.
requested_by: you
date: 2026-06-13
type: core
area: backlog
benefits: planning speed + context cleanliness
size: S
status: shipped
target: advance() relocates the shipped file; backlog/ holds only active items
notes: new core/archive.ts (archiveItemFile, sweepTerminalItems); archive added to COMMIT_PATHS
shipped: 2026-06-13
---

Shipped items accumulated in `.cairn/backlog/` (20+), and `/cairn-plan` instructs the model
to read every file there — an unbounded, growing scan. Now `advance()` moves a just-shipped
item to `.cairn/archive/` (git tracks the rename, so history is intact), and the active
`backlog/` holds only inbox/now/next/later. The TUI already filtered shipped/wontdo out of the
Backlog tab, so the board is unchanged. Existing terminal items were swept into archive/ as a
one-time migration.
