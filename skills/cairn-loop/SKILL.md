---
name: cairn-loop
description: work the backlog hands-free — implement the current action, commit, sync, repeat until the queue is empty
---

# cairn-loop — work the roadmap autonomously

Drive the cairn backlog without hand-holding: take the current action, implement it,
commit the work, sync to advance, and repeat until there is no current action. Stop and
report the moment the queue runs dry or you hit something only the user should decide.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

## The loop

Repeat until `.cairn/board/current.md` has no active id:

1. **Read the current action.** `.cairn/board/current.md` gives the `id` and `target`;
   open `.cairn/backlog/<id>.md` for the full body and notes. The `target` is the
   definition of done — observable, not a vibe.

2. **Implement it.** Make the smallest correct change that meets the target. Match the
   surrounding code and conventions. Build / typecheck and do a quick smoke check (e.g.
   render the TUI) before calling it done; fix anything you broke.

3. **Commit the code.** A normal `git commit` — **not** `cairn commit`, which only stages
   `.cairn/`. Write a conventional message that references the id. The post-commit hook
   logs the commit to the activity log so sync can see it.

4. **Sync.** Run the **cairn-sync** skill. It correlates the commit with the target and
   runs `cairn advance` when the target is met — shipping the item, popping the queue, and
   promoting the next item to current.

5. **Re-read the current action** and continue from step 1.

## Stop conditions — report, don't push through

- **No current action after sync** → the queue is empty. Stop and say so; suggest
  `/cairn-plan` to refill.
- **A decision that is the user's to make** — an ambiguous target, a design fork, or an
  irreversible / outward-facing action. Stop and ask rather than guess.
- **Repeated failure on one item** — the build won't go green or the target is
  unreachable. Stop, report what's blocking, leave the item `now`, and persist an honest
  progress note with `cairn commit "sync: <id> progress"`.

## Tone

Level and factual. After each ship, one line: what shipped and what is now active. No
celebration — the reward is the TUI's advance animation. Keep moving until a stop
condition.
