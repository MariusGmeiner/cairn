---
id: CAIRN-017
title: Fix header row width to fill the box
summary: The NEXT ACTION header row renders narrower than the rest of the box.
requested_by: you
date: 2026-06-13
type: bug
area: tui
benefits: anyone using the board — the header lines up with the box edges
size: S
status: shipped
target: the NEXT ACTION header row and the repo line span the full inner box width, flush to both edges
notes: try dropping the width prop on the width-bounded Box in components.tsx Header and NextAction.tsx ActiveHeader — inside a column flex they should already fill; verify the NEXT ACTION row and the repo/clock row span the full inner width
shipped: 2026-06-13
---
The "NEXT ACTION ... id ... badge" row (and possibly the two-line Header) is visibly
shorter than the bordered box. Likely the `width={width}` on those rows constrains them
to less than the available inner width when they sit inside a column flex.

Your hint — just omit the `width` parameter on those Boxes; a row in a column flex
stretches to the cross-axis width on its own. Check both the `Header` (components.tsx)
and the `ActiveHeader` (NextAction.tsx), and confirm the right-aligned id + badge still
push to the right edge.
