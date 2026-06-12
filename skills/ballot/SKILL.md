---
name: ballot
description: every 2nd Monday — propose exactly 2 vetted day-or-two features to vote on
---

# ballot — assemble the biweekly vote

Every second Monday (or the Monday after the last voted feature shipped), the team votes
on **one** small thing to build next. Your job is to put exactly **two** options on the
ballot — and to make damn sure both are safe. The whole point is that people vote on
pre-vetted, tightly-scoped work, **not** on the raw backlog where they might pick
something that turns out to be a pain to implement.

Operate on `<git root>/.cairn/`. If there is no `.cairn/`, tell the user to run
`cairn init` and stop.

## 0. Is a vote due?

```sh
cairn config        # shows "next vote: due now — run /ballot" when it's time
```

The cadence is **every second Monday**, brought forward to the **Monday after the voted
feature shipped**. If a vote is **not** due, say when the next one is and stop — unless
the user explicitly wants to prep one early.

## 1. Build the candidate pool

Pull only `type: feature` or `type: qol` items from `.cairn/backlog/` (any of
`later` / `next` / `inbox`). **Never** put `core` work on the ballot — core is decided by
the roadmap, not voted on. Favor high-benefit, obviously-small items.

## 2. Constrain each candidate — this is the real work

For every item you're considering, do not take its backlog size on faith. **Vet it
against the actual code** (you can see the repo): open the files it touches, confirm the
APIs/components it needs already exist, and look for hidden refactors, migrations, or
unknowns. Then shape it into a guaranteed-safe unit of work:

- **Scope (in):** the smallest version that still delivers the benefit.
- **Acceptance / `target`:** one concrete, observable condition that means done.
- **Out of scope (cuts):** explicitly list what you're *removing* to protect the budget
  (edge cases, settings, polish, adjacent refactors). These cuts are what keep it to
  1–2 days.
- **Estimate:** 1 or 2 days, and you are **~98% sure** of it. If you're not that sure,
  either carve out a smaller slice you *are* that sure of, or drop the item.

Discard anything you can't make safe. It is far better to under-scope than to let a risky
feature onto the ballot.

## 3. Pick exactly two

Choose the **2** best vetted options. Make them meaningfully different (not two flavours
of the same idea) so the vote is a real choice. If you genuinely cannot get two items to
~98% confidence, say so plainly and offer fewer — or recommend a short spike to de-risk a
candidate first. **Do not pad the ballot with an option you don't trust.**

## 4. Write the ballot

Write `.cairn/daily/<today, YYYY-MM-DD>-ballot.md`:

```markdown
# Ballot · <YYYY-MM-DD>  (vote closes <next Monday>)

Pick ONE to ship in the next two weeks.

## Option A — <title>
- benefit: <one line, who gains>
- scope: <what's in>
- done when: <acceptance / target>
- out of scope: <the cuts that keep this to 1–2 days>
- estimate: <1–2> days · confidence ~98%

## Option B — <title>
- benefit: ...
- scope: ...
- done when: ...
- out of scope: ...
- estimate: <1–2> days · confidence ~98%
```

Then give the user a clean copy-paste block to post on the team board (Trello / Fider /
Canny — CAIRN feeds it, it doesn't post).

## 5. Record the outcome

When the winner is known:

1. Set the winning item `status: next` and write its `target:` (the acceptance from the
   ballot), so it enters the queue and the TUI surfaces it.
2. Reset the cadence and track the winner:

   ```sh
   cairn config ballot-done <winning-id>
   ```

   That stamps today as the last vote and remembers the winner — so when it later ships,
   CAIRN brings the *next* vote forward to the Monday after.
3. Persist: `cairn commit "ballot: <YYYY-MM-DD>"` (honors the repo's commit mode).

Conservative tone throughout. Two safe options, one clear winner, no surprises.
