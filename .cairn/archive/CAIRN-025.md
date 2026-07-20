---
id: CAIRN-025
title: Grow the board to the full terminal width
summary: The frame is hard-capped at 92 columns, leaving dead space on wide terminals.
requested_by: Marius
date: 2026-07-20
type: qol
area: tui/App
benefits: Anyone on a wide terminal — long titles, targets and ticket bodies stop wrapping early while the screen sits half empty.
size: S
status: shipped
target: The frame fills the terminal at any width and follows it on resize.
notes: "Cap dropped entirely — boxWidth = Math.max(56, cols - 1). Resize listener was already in place (App.tsx). Verified 56–200 columns. Open question left deliberately unbuilt: full-width prose is harder to scan, so capping the reader body alone may still be worth it."
shipped: 2026-07-20
---

`boxWidth = clamp(cols - 1, 56, 92)` means every terminal wider than 93 columns
draws the same 92-column frame with the remainder left blank.

Worth deciding rather than just raising the number: a full-width reader makes long
body text harder to scan, which is why the cap exists. Options, cheapest first:

- drop the cap so the frame always fills the terminal
- raise it (110? 120?) as a compromise
- keep a prose cap for the reader body only, and let the board, lists and cards
  use the full width — the option that keeps both properties, at the cost of two
  width values instead of one

Also worth checking while in here: the frame should re-layout on terminal resize,
not just at startup.
