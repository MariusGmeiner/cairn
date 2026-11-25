---
name: cairn-shutdown
description: close the session — Newport shutdown ritual, log of everything since the last shutdown, biweekly QoL vote
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

### 0. Find the gap — shutdown is not always daily

The ritual covers **everything since the last shutdown**, not just today. The last
shutdown is the newest `.cairn/daily/YYYY-MM-DD.md` (ignore `-ballot` files). Everything
after it is unprocessed: commits and `ship` events in `.cairn/activity/log.jsonl` with a
later date, plus anything from that same day which its summary does not mention. If no
daily file exists, start from the first log entry. If the log is thin, fall back to
`git log --since=<that date>` on the default branch.

Then run the **cairn-sync** skill once, so progress and ships reflect the whole gap before
you summarize it.

### 1. Capture — sweep every open loop into the system

Pull together everything in motion so nothing is forgotten:

- `.cairn/board/current.md` — the active action and its `progress`.
- `.cairn/board/queue.md` — what's queued next.
- `.cairn/backlog/*.md` with `status: inbox` — untriaged captures.
- `.cairn/activity/log.jsonl` since the last shutdown — commits + `ship` events.
- backlog items with a `pr:` note — pull requests waiting for review or merged since.

Ask the user one open question only if something is clearly unrecorded ("anything you
worked on that isn't captured?"). Otherwise proceed.

### 2. Review — give every incomplete commitment a trusted next step

For each unfinished item (the `now` action and anything `next`), confirm there is a
concrete, trusted next step. If one is missing, add it (to the item's `notes:` or the
current action's body). Fix any obviously-stale `status:` — e.g. an item finished in
the gap's commits but still `now` → set `shipped`. Surface anything ambiguous instead of
guessing.

### 3. Plan — tomorrow's one thing

Decide the single most important action for tomorrow (usually the current `now`, or the
top of the queue). Name 1–2 backups. This is the "what I'll start on" so the user opens
tomorrow with zero deliberation.

### 4. Record — write the daily shutdown summary

Create/overwrite `.cairn/daily/<today, YYYY-MM-DD>.md`:

```markdown
# <YYYY-MM-DD> · shutdown
<!-- only when the gap is longer than a day: -->
Covers <first unprocessed day> → <today>

## Shipped since the last shutdown
- <ID> <title>   <!-- group under a "### <YYYY-MM-DD>" line per day when the gap spans several -->

## Waiting for review
- <ID> <title> — <pr link>

## In flight (each has a trusted next step)
- <ID> <title> — <progress>% toward "<target>" · next: <concrete next action>

## Captured (out of my head, safe until tomorrow)
- <loose ends, inbox items, anything that surfaced>

## Tomorrow — the one thing
- <ID> <title>   (backups: <ID>, <ID>)

— Schedule shutdown complete.
```

The closing phrase is the ritual's point: it signals work is done for the day.

### 5. Persist — flush the day's backlog changes as one commit

Run `cairn commit --flush "shutdown <YYYY-MM-DD>"`. Shutdown is the flush point: under the
default **batch** mode every capture / plan / sync / ship this session only wrote files
(deferred), so this single `--flush` lands the whole day's `.cairn/` changes — the daily
summary, status fixes, the queue, archived ships — as **one** `cairn:` commit. That's what
keeps the code history readable: management churn collapses to a daily line you can filter
out with `git log --invert-grep --grep='^cairn:'`.

(`--flush` forces the commit regardless of mode. In ride-along mode, drop it and let the
changes ride with your next code commit instead.) Don't hand-roll the git command.

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

## Monthly architecture review

Look for the newest `{"event":"arch-review"}` line in `.cairn/activity/log.jsonl`. If there
is none, or it is more than a month old, add one line to the sign-off: "Architecture review
is due — run `/improve-codebase-architecture`." Skip this when that skill is not installed.

Close with a one-line sign-off. Level tone — the day's wins already showed up in the TUI.
