---
id: CAIRN-013
title: Make the TUI fullscreen, fixed-height
summary: Pin the board to the terminal height so tabs fill the screen and scroll within instead of the box growing and shrinking.
requested_by: you
date: 2026-06-13
type: qol
area: tui
benefits: anyone using the board — a stable full-height layout that doesn't jump as you switch tabs
size: M
status: shipped
target: the board fills the terminal height with the footer anchored at the bottom, and switching tabs no longer changes the box size
notes: builds on CAIRN-011 tabs/windowing; consider the fullscreen-ink wrapper vs hand-rolled alt-buffer escapes
shipped: 2026-06-13
---
Today the root box is `clamp(cols-1, 56, 92)` wide with no height, so it grows to its
content and the layout jumps as you switch tabs. Make it a proper fullscreen TUI:

- **Own the screen** — enter the alternate screen buffer on mount (`ESC[?1049h`) and
  restore on exit (`ESC[?1049l`), so the shell scrollback is untouched on quit. Either
  hand-roll the escapes or adopt the small `fullscreen-ink` wrapper (`withFullScreen`).
- **Fill the height** — set the root `<Box height={rows}>` from `useStdout().stdout.rows`
  and re-render on resize (Node's `resize` event / SIGWINCH; Ink already re-renders).
- **Anchor the footer** to the bottom of the viewport rather than trailing the content.
- **Let each tab fill** its fixed-height region and scroll within — the windowing is
  already there (`windowAround`, the ContentViewer paging); feed it the real viewport
  height so the `rows` budgets stop being guesses.

Caveat to respect: Ink redraws the whole frame, so content taller than the terminal
flickers/duplicates — the fixed-height + internal scrolling is exactly what avoids that.
