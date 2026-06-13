---
id: CAIRN-015
title: Refresh docs to match the current TUI
summary: Bring README (and any spec/help text) in line with the shipped tabs, fullscreen, header, filter keys, renamed skills, and new logo.
requested_by: you
date: 2026-06-13
type: qol
area: docs
benefits: anyone reading the docs — they match what the tool actually does
size: M
status: shipped
target: README masthead, TUI mockup, skills table, command examples, and keybindings all match the shipped tabbed/fullscreen TUI and the cairn- skill names
notes: do last — after CAIRN-009 (skill rename) and CAIRN-014 (logo) so the docs reflect final names + art; touch README.md masthead, skills table, TUI mockup, command examples
shipped: 2026-06-13
---
The README and help text drifted as the TUI was rebuilt. Update them to the current
state, sequenced after CAIRN-009 and CAIRN-014 so names and art are final:

- **Masthead / logo** — use the new braille mark from CAIRN-014.
- **TUI mockup** — redraw to the tabbed Next / Inbox / Backlog / Help layout
  (fullscreen, two-line header, bottom-anchored footer), not the old single pane.
- **Skills table + command examples** — rename to the `cairn-` prefixed skills from
  CAIRN-009 (`/cairn-capture` … `/cairn-ballot`).
- **Keybindings** — document ←/→ tabs, `a` ship, `v` read, ↑/↓ move, `1–5` filter.
- Sweep `cairn --help` / init output / any spec doc for the same drift.
