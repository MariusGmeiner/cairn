---
id: CAIRN-010
title: Two-line TUI header with logo and slogan
summary: Split the header into a logo+slogan line and a repo+date/time line.
requested_by: you
date: 2026-06-12
type: qol
area: tui
benefits: anyone using the board — clearer branding, room for the slogan
size: S
status: inbox
target:
notes: src/tui/components.tsx (Header, ~lines 28-40)
---

Make the TUI header two lines:

- **Line 1:** ` ▟█▙ CAIRN · marks your next step` — replace the `▲` mark with `▟█▙` and
  add the slogan (slogan rendered dim).
- **Line 2:** project name (repo) on the left, date/time on the right (the existing
  clock), space-between.

Font caveat (answered): a terminal app can't set the font — glyph rendering belongs to
the terminal emulator, so it's a **terminal setting only**. The TUI can only (a) use
widely-covered glyphs (it does — these are standard Block Elements / Box Drawing,
U+2500–U+259F) and (b) optionally offer an `--ascii` fallback (╭╮╰╯→+-|, blocks→#/=) for
thin terminals. `▟ █ ▙` (U+2599/2588/259F) are covered by Cascadia Mono/Code, Consolas,
DejaVu Sans Mono — safe in any decent monospace font. The ASCII-fallback could be its
own item if degraded terminals ever matter.
