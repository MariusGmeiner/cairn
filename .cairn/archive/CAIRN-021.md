---
id: CAIRN-021
title: Make tab sections scroll, not overflow
summary: On a short terminal the Help section overflows and overwrites the footer line; tab content should scroll instead.
requested_by: you
date: 2026-06-13
type: bug
area: tui
benefits: anyone on a small terminal — content stays inside the box, footer stays put
size: M
status: shipped
target: on a short terminal the Help tab scrolls with up/down and no tab content overwrites the footer line
notes: Help.tsx is static (not windowed) so it spills past the fixed-height content box and overwrites the footer; overflowY hidden on the content Box in App.tsx is not fully clipping. Make Help scrollable like the lists/reader (window its lines, up/down to scroll when the content exceeds the rows), and double-check Next/Inbox/Backlog clip cleanly too. Mouse-wheel scrolling needs SGR mouse mode plus parsing wheel events in useInput — do it if it is not too invasive.
shipped: 2026-06-13
---
When the terminal is too short to fit the Help tab, the overflowing lines render past
the bottom of the box and clobber the footer's last line.

Fix:
- **Help** is the main offender — it is static, not windowed. Give it the same treatment
  as the Inbox/Backlog lists and the reader: keep a scroll offset, show a window of lines
  that fits `contentRows`, and move it with up/down (with a "more above / more below" hint).
- **Audit the other tabs** — Inbox/Backlog already window, the reader scrolls, the Next
  view is short; confirm none can overflow the footer on a short terminal.
- **Belt and suspenders** — make the content region actually clip so nothing can ever
  paint over the footer, regardless of tab.
- **Mouse wheel** — if not too invasive, enable SGR mouse reporting and map wheel up/down
  to the same scroll, so the lists/reader/Help scroll with the wheel too.
