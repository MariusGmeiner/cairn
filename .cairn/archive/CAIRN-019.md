---
id: CAIRN-019
title: Open and close items with Enter, not v
summary: Replace the undiscoverable v reader key with Enter to open and close the item.
requested_by: you
date: 2026-06-13
type: qol
area: tui
benefits: anyone using the board — a natural, discoverable key to read an item
size: S
status: shipped
target: Enter opens and closes the item reader, a still ships, and no hint mentions v
notes: App.tsx useInput viewer open and close, plus the footer hints, Help legend, and the DoneHint; Enter opens the active or selected item and Enter or Esc closes; note Enter currently also advances on the Next tab, so drop that and keep a as the ship key
shipped: 2026-06-13
---
The `v` reader binding is neither explained nor intuitive. Use Enter to open the
selected or active item in the scrollable reader, and Enter (or Esc) to close it again.

Watch the existing binding — Enter currently also triggers advance on the Next tab. Drop
that so `a` stays the only ship key and Enter is unambiguous. Update the footer hint, the
Help keys legend, and the inline hint that currently mentions `v`.
