---
name: cairn-plan
description: refresh now / next / later and pre-compute the next-action queue
---

# plan — refresh the roadmap

Re-rank this repo's backlog into a calm Now / Next / Later roadmap and pre-compute the
queue the TUI advances through. No dates, no sprints — just a clear order with a
concrete target on each upcoming step.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

## 1. Read the whole picture

- Every item in `.cairn/backlog/*.md` (id, title, type, size, status, notes).
- The current action: `.cairn/board/current.md`.
- Recent progress, if present: `.cairn/activity/log.jsonl` (commits + ship events).

## 2. Re-rank — core before community

Decide each item's `status`:

- `now` — the single thing being actively worked (usually keep the existing one).
- `next` — queued, in priority order.
- `later` — someday/backlog.
- leave `inbox` items alone unless triage is obviously overdue (then suggest `/cairn-capture`).

**Ranking rule:** `core` work outranks `feature`, and both outrank `qol`. Never
auto-prioritize a community/QoL item above core work — call it out if the user asks for
that explicitly. Prefer unblocking in-flight work and small high-leverage items.

Apply the decision by editing each item file's `status:` field.

## 3. Set targets

For every `next` item (and the `now` item if it lacks one), write a one-line
**`target:`** in its frontmatter — the concrete acceptance condition that means done,
e.g. `bulk-edit can call tagService.apply()`. A good target is observable, not a vibe.

## 4. Pre-compute the queue

Rewrite `.cairn/board/queue.md` as the ordered list of upcoming item ids:

```markdown
# Queue
<!-- ordered upcoming items · pre-computed by /cairn-plan -->

- CRM-007 · Wire tag service
- CRM-012 · Bulk-edit UI
```

If `.cairn/board/current.md` has no active item and the queue is non-empty, promote the
first id: set that item `status: now` and write `current.md` with its `id`, `target`,
and `progress: 0`. (The TUI does this automatically on advance, but doing it here means
the board is never empty after planning.)

## 5. Persist

Run `cairn commit "plan: refreshed roadmap"`. It commits the re-ranked items, the queue,
and current.md under a `cairn:` prefix, or no-ops in ride-along mode. Let the tool honor
the commit mode rather than running git yourself.

## 6. Brief the user

Close with a short briefing (5–8 lines max): what's `now`, the top 3 `next`, anything
notable moved to `later`, and one sentence on why. Terse and level. The TUI will
re-render the moment you save the files — no need to describe the layout.
