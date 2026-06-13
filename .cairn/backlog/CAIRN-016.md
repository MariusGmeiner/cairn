---
id: CAIRN-016
title: Frontmatter parse failure destroys item fields
summary: A colon-space in any frontmatter value breaks the YAML parse, then updateItemFields/advance silently rewrites the file dropping every other field.
requested_by: cairn (discovered during CAIRN-014)
date: 2026-06-13
type: bug
area: core
benefits: anyone — prevents silent data loss of backlog items on advance/sync
size: S
status: shipped
target: 'a frontmatter value containing a colon-space (e.g. "Project: foo") round-trips through parse + updateItemFields/advance without dropping any other field'
notes: src/core/frontmatter.ts (parse) + src/core/backlog.ts updateItemFields; advance promoted CAIRN-014 and wiped its frontmatter to just status when its target contained a "Project" colon-space value
shipped: 2026-06-13
---
Repro: give an item a `target:` (or any value) containing a `: ` (colon followed by a
space), e.g. a target that reads `"Project: <name>"`. On the next `cairn advance` that
touches the file (status patch), the whole frontmatter is reduced to just the patched
field — id/title/type/target/etc. are lost. The body survives.

Cause: `parseFrontmatter` fails the YAML parse (a plain scalar can't contain `: `) and
returns empty `data`. `updateItemFields` then writes `{...{}, ...patch}` — so every
unrecognized field is dropped. Silent, irreversible without git.

Fix options:
- On parse failure, **refuse to write** (throw / no-op) rather than persist a lossy
  rewrite — never destroy data on a parse error.
- Or make the writer preserve the original raw frontmatter block when it can't be parsed.
- Optionally quote values on write so round-tripping a colon-space is safe.

Severity: data loss. Any item with a colon-space in a field is a landmine for the next
advance/sync.
