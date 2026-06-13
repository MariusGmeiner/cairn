---
id: CAIRN-022
title: Batch cairn commits per session
summary: Defer .cairn commits and flush the whole session as one cairn: commit at shutdown.
requested_by: you
date: 2026-06-13
type: core
area: git
benefits: anyone reading the repo history
size: M
status: shipped
target: a day's capture/plan/sync/ship produce one cairn: commit, not many
notes: new commit-mode "batch" (now the default); shutdown runs `cairn commit --flush`
shipped: 2026-06-13
---

The `cairn:` bookkeeping commits (capture/plan/ship/shutdown) outnumbered real code
commits ~2:1, making `git log` hard to read. Added a third commit mode, **batch** — now
the default. In batch, `maybeCommit` defers (writes files only); `/cairn-shutdown` runs
`cairn commit --flush` to land the whole session's `.cairn/` changes as a single `cairn:`
commit. `--flush` (alias `--now`) on `cairn commit` forces a commit regardless of mode.
Code history stays software-only; filter the daily management line with
`git log --invert-grep --grep='^cairn:'`.
