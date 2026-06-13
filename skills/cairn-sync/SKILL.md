---
name: cairn-sync
description: pull progress from your git commits and advance the current action
---

# sync — catch up from work done

Read what actually got committed in this repo, reflect it onto the active action, and
advance if the target is met. This is the bridge between code and the board, so the
user never hand-updates progress.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

## 1. Read recent work

- `.cairn/activity/log.jsonl` — one JSON line per commit:
  `{ ts, repo, sha, author, subject, files }` (plus `{ event: "ship", id, title }`
  lines from past advances). Focus on commit lines since the current action started.
- If the log is thin or missing, fall back to `git log` directly, but prefer the log.
- The active action: `.cairn/board/current.md` (`id`, `target`, `progress`).

## 2. Correlate commits with the target

You can see the code and the plan in the same tree — use it. Look at the relevant
files and commit subjects and judge, concretely, how close the work is to the
`target:` of the current item. Update `.cairn/board/current.md`:

- set a realistic `progress:` (0–100, your honest estimate)
- append a short dated note in the body summarizing what moved it
  (e.g. `- 2026-06-12 wired tagService, tests green (~80%)`)

## 3. Advance when the target is met

If the commits clearly satisfy the `target`, **advance**. The advance is deterministic
and should stay that way — run it through the tool rather than hand-editing, so the
ship is logged and the queue pops exactly like pressing `[a]`:

```sh
cairn advance
```

That marks the current item `shipped`, logs a `ship` event, promotes the next queued
id to `now`, writes its target into `current.md`, **and commits per the repo's commit
mode** (cairn: prefix, or ride-along). Then briefly confirm what shipped and what's now
active.

If the target is **not** met, leave `status: now`, keep the updated progress, and
persist the progress note with `cairn commit "sync: <ID> progress"` (it honors the
commit mode). Say one line on what remains. If the queue is running low or empty,
suggest `/cairn-plan`.

Tone: level and factual. The reward for finishing is in the TUI's advance animation —
you just report the truth.
