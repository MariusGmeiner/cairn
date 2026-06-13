---
id: CAIRN-012
title: Start backlog filter keys at 1, not 0
summary: Renumber the Backlog type filter so the digits run 1–5 instead of 0–4.
requested_by: you
date: 2026-06-13
type: qol
area: tui
benefits: anyone filtering the backlog — 1–5 sits under the fingers, 0 is a reach
size: S
status: shipped
target: the Backlog type filter is bound to 1–5 (1 all, 2 core, 3 feature, 4 qol, 5 bug) across the chips, key handler, footer hint, and Help legend
notes: follow-up to CAIRN-011; ripples src/tui/App.tsx (input handler + footer hint), src/tui/lists.tsx (FilterChips numbering), src/tui/Help.tsx (keys legend)
shipped: 2026-06-13
---
The Backlog tab's type filter is currently bound to `0–4` (0 all, 1 core, 2 feature,
3 qol, 4 bug). Shift the whole row up by one so it reads `1–5` (1 all, 2 core,
3 feature, 4 qol, 5 bug) — the number row left-to-right, no reach for `0`.

Touch points:
- `src/tui/App.tsx` — the `input === '0'…'4'` filter handler and the footer hint `0–4 filter`.
- `src/tui/lists.tsx` — `FilterChips` numbering (`${i}:` → `${i + 1}:`).
- `src/tui/Help.tsx` — the keys legend line `0–4 filter the Backlog by type`.
