---
id: CAIRN-024
title: Render ticket bodies with markdown styling
summary: Style item bodies in the content viewer — cairn-blue headings plus the other formatting the terminal actually supports.
requested_by: Marius
date: 2026-07-20
type: qol
area: tui/ContentViewer
benefits: Anyone reading a ticket in the TUI — long bodies become skimmable instead of a wall of uniform white text.
size: S
status: shipped
target: Ticket bodies render as styled markdown in the reader — headings in cairn blue, lists, quotes, code, emphasis, links.
notes: New src/tui/markdown.ts parses rows into styled runs before wrapping, so inline markers never count toward the width. Soft-wrapped source lines reflow. Shipped in bd45466.
shipped: 2026-07-20
---

Today `ContentViewer` prints every body line in one flat color. Add a small
line-level markdown renderer so headings and structure read at a glance.

Confirmed-supported in Ink/chalk, no new dependency:

- `#` / `##` / `###` headings → bold in cairn blue (`palette.lit` for h1,
  `palette.shadow` for deeper levels — same two-tone light source as the logo)
- `- ` / `* ` bullets → accent-colored glyph (`·`), body text normal
- `1. ` ordered lists → dim number, normal text
- `> ` quotes → dim text behind a `│` gutter
- `` `code` `` and fenced blocks → dim, or `inverse` for inline spans
- `**bold**` / `*italic*` / `~~strike~~` → the matching Ink props, markers stripped
- `---` → a full-width rule in `palette.rule`
- `[label](url)` → the existing `link()` OSC-8 helper
- checkboxes `- [ ] / - [x]` → `☐` / `☑`, ticked items dim

Not worth it: nested inline combinations, tables, syntax highlighting inside
fenced blocks. Scope is one pass over each line, styled as a whole where possible.
