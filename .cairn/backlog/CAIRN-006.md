---
id: CAIRN-006
title: Refine ship animation + animated green frame
summary: Polish the completion celebration and grow a dark→bright green border around the NEXT ACTION block as progress fills.
requested_by: you
date: 2026-06-12
type: qol
area: tui
benefits: anyone shipping an action in the TUI
size: S
status: shipped
target: ship fill eases 0→100 and a dark→bright green border wraps the NEXT ACTION block, settling at palette.good
notes: src/tui/NextAction.tsx (Shipping / SparkleRow)
shipped: 2026-06-12
---
Refine the ship celebration in `src/tui/NextAction.tsx`:

- **Smoother, more polished motion** — ease the progress-bar fill (not linear) and
  soften the sparkle pacing so it does not flicker.
- **Animated green frame** — during the ship, a border appears around the *entire*
  NEXT ACTION block. It starts a very dark green and brightens as the percentage grows,
  ending at the same green as the done-button surround (`palette.good`). The border
  shade tracks progress 0→100, then settles.
