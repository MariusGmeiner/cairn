---
name: cairn-shutdown
description: close the day — Newport shutdown ritual, daily log, biweekly QoL vote
---

# shutdown — close the day (Cal Newport shutdown ritual)

A deliberate end-of-day ritual for this repo, modeled on Cal Newport's *shutdown
routine* from **Deep Work**: bring every open loop to a known state, make a plan you
trust for what's unfinished, then close the day cleanly so your mind can release work
until tomorrow. Calm and quick — under a minute for the user to review.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

## The ritual

Work these steps in order. The point of the ritual is completeness: by the end, nothing
important is left lurking only in the user's head.

### 1. Capture — sweep every open loop into the system

Pull together everything in motion so nothing is forgotten:

- `.cairn/board/current.md` — the active action and its `progress`.
- `.cairn/board/queue.md` — what's queued next.
- `.cairn/backlog/*.md` with `status: inbox` — untriaged captures.
- today's `.cairn/activity/log.jsonl` — commits + `ship` events.

Ask the user one open question only if something is clearly unrecorded ("anything you
worked on that isn't captured?"). Otherwise proceed.

### 2. Review — give every incomplete commitment a trusted next step

For each unfinished item (the `now` action and anything `next`), confirm there is a
concrete, trusted next step. If one is missing, add it (to the item's `notes:` or the
current action's body). Fix any obviously-stale `status:` — e.g. an item finished in
today's commits but still `now` → set `shipped`. Surface anything ambiguous instead of
guessing.

### 3. Plan — tomorrow's one thing

Decide the single most important action for tomorrow (usually the current `now`, or the
top of the queue). Name 1–2 backups. This is the "what I'll start on" so the user opens
tomorrow with zero deliberation.

### 4. Record — write the daily shutdown summary

Create/overwrite `.cairn/daily/<today, YYYY-MM-DD>.md`:

```markdown
# <YYYY-MM-DD> · shutdown

## Shipped today
- <ID> <title>

## In flight (each has a trusted next step)
- <ID> <title> — <progress>% toward "<target>" · next: <concrete next action>

## Captured (out of my head, safe until tomorrow)
- <loose ends, inbox items, anything that surfaced>

## Tomorrow — the one thing
- <ID> <title>   (backups: <ID>, <ID>)

— Schedule shutdown complete.
```

The closing phrase is the ritual's point: it signals work is done for the day.

### 5. Persist

Run `cairn commit "shutdown <YYYY-MM-DD>"` — it records the daily summary and any status
fixes under a `cairn:` prefix, or no-ops in ride-along mode (your next code commit
carries them). Don't hand-roll the git command; let the tool honor the commit mode.

## Draft the team update

Below the summary (or as a copy-paste block in chat), draft a short, human update for
the **separate** team-facing board (Trello / Fider / Canny — CAIRN only feeds it, it
doesn't post). 3–5 plain-language bullets, no internal jargon. A draft for the user to
send, not an automated post.

## Biweekly vote

The two-option vote has its own skill. Check whether one is due:

```sh
cairn config        # shows "next vote: due now — run /cairn-ballot" when it's time
```

The cadence is **every second Monday**, brought forward to the **Monday after the voted
feature shipped**. If a vote is due, just point the user at **`/cairn-ballot`** — it proposes
exactly two pre-vetted, day-or-two options for the team to vote on. Don't assemble the
ballot here.

Close with a one-line sign-off. Level tone — the day's wins already showed up in the TUI.
