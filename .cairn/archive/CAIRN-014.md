---
id: CAIRN-014
title: New braille logo + two-tone lit theme
summary: Replace the TUI title logo/wordmark with the braille pile + lettering and add a right-lit 2-color scheme applied across the TUI.
requested_by: you
date: 2026-06-13
type: qol
area: tui
benefits: anyone using the board — a distinctive lit brand mark and a consistent light-from-the-right shading language
size: M
status: shipped
target: TUI title line is updated
shipped: 2026-06-13
---
Swap the brand mark in the TUI header (and the README masthead) to the supplied braille art:

```
⣠⣾⣷⣄ ⣏⡁⡮⡆⣹⡁⡯⡂⡗⡅
```

`⣠⣾⣷⣄` is the pile (logo), `⣏⡁⡮⡆⣹⡁⡯⡂⡗⡅` spells the wordmark.

Light-from-the-right idea: define a 2-color shading pair in `theme.ts` — a bright
"lit edge" color and a dimmer "shadow body" color — so the right-facing strokes read as
catching the light. Apply the pair to both the pile and the lettering (e.g. render the
art in two passes / per-glyph so the right side is bright, the body is shadow), then reuse
the same two-tone language for other TUI accents (rules, the ▸ markers, tab underlines)
so the whole board shares one consistent light direction. Pick the actual two colors —
something that holds up on both dark and light terminals.

Header repo line: prefix the project name with a gray `Project: ` label, and render the
project name itself in bright white.
