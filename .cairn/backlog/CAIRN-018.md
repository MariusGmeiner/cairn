---
id: CAIRN-018
title: Make the ticket id link display and work
summary: Confirm the item id renders as a clickable link, or document the Ink and terminal limits.
requested_by: you
date: 2026-06-13
type: bug
area: tui
benefits: anyone using the board — Ctrl or Cmd click jumps straight to an item's md file
size: S
status: shipped
target: the item id renders as a clickable link in the TUI, or the Ink/terminal limitation is documented with a sensible fallback
notes: link() in theme.ts emits an OSC-8 hyperlink and ActiveHeader in NextAction.tsx renders it; check whether Ink or string-width mangles the escape, whether the id is clipped by the CAIRN-017 width bug, or whether the terminal simply lacks OSC-8 support
shipped: 2026-06-13
---
The item id in the NEXT ACTION header is meant to be an OSC-8 hyperlink (Ctrl or Cmd
click opens the `.cairn/backlog/<ID>.md` file). Verify it actually shows and is
clickable in a real terminal.

If it does not work, find out why and report it — likely candidates are Ink stripping or
mis-measuring the escape, the id being clipped by the header width bug (CAIRN-017), or
the terminal not supporting OSC-8 hyperlinks at all (then say so and suggest a fallback,
e.g. show the relative path).
