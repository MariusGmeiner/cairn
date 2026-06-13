---
id: CAIRN-011
title: Restructure the TUI into navigable tabs
summary: Split the TUI into Next / Inbox / Backlog / Help tabs switched with the left/right arrow keys.
requested_by: you
date: 2026-06-13
type: feature
area: tui
benefits: anyone working the backlog daily in the TUI
size: L
status: shipped
target: ←/→ cycles Next / Inbox / Backlog / Help; Next is default, showing the ID link and the full un-truncated target
notes: ripples src/tui/App.tsx, components.tsx, NextAction.tsx, useCairnData.ts; folds in CAIRN-009 skills-legend relocation; coexists with CAIRN-010 header + CAIRN-006 ship animation
shipped: 2026-06-13
---
Turn the single-pane TUI into four tabbed views, switchable with ←/→. Default lands
on the next-action view.

**Tab 1 — Next action (default)**
- Show the backlog item ID as a link — Ctrl+Click opens / jumps to the `.cairn/backlog/<ID>.md` file.
- Show the *entire* target (today it's truncated with an ellipsis).
- Add a key binding to open the item's full content (body without frontmatter) in a
  scrollable view inside the TUI.
- Rework the done affordance: either make it actually clickable, or stop styling it
  like a button. Make it clear you press `a` to complete — only reveal the ✓ + "done"
  while the completion animation plays.
- Bottom of the view shows the next item — full title, no ellipsis.

**Tab 2 — Inbox**
- Scrollable list of inbox items.
- If feasible, badge the count of new inbox items in the tab header so it's always visible.

**Tab 3 — Backlog**
- Scrollable list, same as inbox.
- Add key bindings to quick-filter by `type` (core / feature / qol / bug).

**Tab 4 — Help**
- Describe how to work with CAIRN.
- Show the Claude skills here — moving them off the main view, where always showing
  them eats a lot of screen space (resolves the screen-space concern from CAIRN-009).
