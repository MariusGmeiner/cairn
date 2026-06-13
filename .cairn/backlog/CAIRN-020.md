---
id: CAIRN-020
title: Restore visible two-tone shading on the logo
summary: The lit and shadow two-tone is not visible on the icon and wordmark; make the bright colors render.
requested_by: you
date: 2026-06-13
type: bug
area: tui
benefits: anyone using the board — the logo reads as lit from one side
size: S
status: shipped
target: the logo pile and wordmark show a clearly visible lit vs shadow two-tone in the terminal
notes: lit is cyanBright and shadow is cyan in theme.ts, which can render identically on terminals that map bright variants to the base color; pick a clearly contrasting pair and verify the bright SGR codes are actually emitted (color level); you are iterating on the LOGO_WORD glyphs separately
shipped: 2026-06-13
---
The two-tone light and shadow has no visible effect on the pile or the wordmark — both
read as one flat color. Two likely causes:

- `lit` (cyanBright) and `shadow` (cyan) are too close, or the terminal renders the
  bright variant the same as the base.
- The bright color codes are not being emitted (color level too low).

Pick a pair with real contrast that holds on both dark and light terminals, and confirm
the bright codes land. The LitText split itself works — this is about the colors.
