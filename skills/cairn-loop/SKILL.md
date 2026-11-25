---
name: cairn-loop
description: work the backlog hands-free — build each queued item to a pull request, repeat until the queue is empty
---

# cairn-loop — work the roadmap autonomously

Drive the cairn backlog without hand-holding: take the current action, build it to a pull
request, then take the next queued item, until nothing buildable is left. Stop and report
the moment the queue runs dry or you hit something only the user should decide.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

You never commit on the default branch, never merge, never deploy. Every item is built on
its own branch and ends as an open pull request for the user to review.

## The loop

Start with the id in `.cairn/board/current.md`, then walk `.cairn/board/queue.md` in order.
For each item:

1. **Read it.** Open `.cairn/backlog/<id>.md` for the body, notes and acceptance criteria.
   The `target` is the definition of done — observable, not a vibe.

2. **Skip what is not buildable now.** Skip an item whose notes already carry a `pr:` link,
   one marked HITL, and one that is `blocked-by` an item whose pull request is not merged.

3. **Build it.** Call the Skill tool with "build" and the item id. It branches, builds
   test-first, runs the checks, opens the pull request and posts the review comments. If
   the build skill is not installed, do the same by hand: branch, implement, check, push,
   open a pull request.

4. **Record the pull request.** Add `pr: <url>` to the item's `notes:`. Leave its status
   and the board alone, and do **not** run `cairn advance`: the item ships when the user
   merges. Persist with `cairn commit "loop: <id> pr opened"` (it honors the commit mode).

5. **Go back to the default branch** and continue with the next item.

After a merge, `/cairn-sync` sees the commits on the default branch and advances the board.

## Stop conditions — report, don't push through

- **Nothing buildable left** → every remaining item is skipped by step 2, or the queue is
  empty. Stop and say so; suggest `/cairn-plan` to refill.
- **Three pull requests from this loop are waiting for review.** The reviewer is one
  person; more open work only makes each review harder. Stop and list them.
- **A decision that is the user's to make** — an ambiguous target, a design fork, or an
  irreversible / outward-facing action. Stop and ask rather than guess.
- **Repeated failure on one item** — the checks won't go green or the target is
  unreachable. Stop, report what's blocking, and persist an honest progress note with
  `cairn commit "sync: <id> progress"`.

## Tone

Level and factual. After each pull request, one line: what was built, the link, and what
is next. Keep moving until a stop condition.
