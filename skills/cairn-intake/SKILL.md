---
name: cairn-intake
description: Break a plan, PRD, spec, or conversation into a batch of triaged CAIRN backlog items as vertical slices. The bulk counterpart to cairn-capture (one idea). Use to convert a larger piece of work into ready backlog items. Merges the old to-prd / to-issues / triage skills, retargeted from an issue tracker to the cairn backlog.
---

# cairn-intake — turn a plan into triaged backlog items

Bulk intake for the CAIRN backlog. Where `cairn-capture` files a single idea, `cairn-intake` takes a larger input — a conversation, a plan, a spec, or a referenced doc — and turns it into a set of small, independently-grabbable, triaged backlog items.

The backlog lives in `.cairn/` at the repo root. Resolve it with `git rev-parse --show-toplevel` and operate on `<root>/.cairn/`. If there is no `.cairn/`, tell the user to run `cairn init` first and stop.

## 1. Gather context

Work from what's already in the conversation. If the user passes a reference (a file path, a plan, a backlog id), read it fully. Explore the repo enough to use its domain vocabulary and respect any ADRs in the area you're touching. Don't interview — synthesize what you can already infer.

## 2. (Optional) Synthesize the spec

If the input is a loose discussion rather than a written plan, first sketch a lightweight spec so the slices have something to cut through:

- **Problem** (from the user's perspective) and **solution**.
- A short list of **user stories** — _As an &lt;actor&gt;, I want &lt;feature&gt;, so that &lt;benefit&gt;._
- Key **decisions** (modules, interfaces, schema/API shapes, prior art) — prose, no file paths or code (they go stale). Inline a snippet only if it encodes a decision more precisely than prose can (a schema, a state machine).
- **Out of scope.**

Keep it tight. Offer to save it as a single parent `feature` item the slices can reference, or keep it inline.

## 3. Slice into vertical tracer bullets

Break the work into thin **vertical slices**, each cutting end-to-end through every layer it touches (schema → API → UI → tests), not a horizontal slice of one layer.

- Each slice is demoable / verifiable on its own.
- Prefer many thin slices over a few thick ones.
- Mark each **AFK** (can be implemented and merged without you) or **HITL** (needs a decision, design, or manual check). Prefer AFK.
- Work out the **blocked-by** order.

## 4. Triage each slice (cairn-native)

For every slice decide:

- **type:** `core` (the product's reason to exist) | `feature` | `qol` | `bug`.
- **size:** S (hours) | M (a day or two) | L (bigger).
- **dedupe:** skim `.cairn/backlog/*.md`; if a slice overlaps an existing item, extend that item instead of duplicating.
- **status:** default `inbox`. (The old issue-tracker roles map to cairn: needs-triage → `inbox`; ready-for-agent / ready-for-human → `next` once queued, noting AFK/HITL in `notes`; wontfix → don't create it, just mention it as out-of-scope.)

## 5. Present the breakdown and iterate

Show the proposed slices as a numbered list — **title · type · size · AFK/HITL · blocked-by** — plus which user stories each covers. Ask whether the granularity, dependencies, and AFK/HITL marks are right. Iterate until the user approves. **Do not write files before approval.**

## 6. Write the items

On approval, write each slice to `.cairn/backlog/<ID>.md` in dependency order (so blockers get real ids first). Pick ids the cairn way: scan `.cairn/backlog/` for the existing prefix (e.g. `CRM-`, `CAIRN-`) and increment the highest number; if the backlog is empty, derive a short uppercase prefix from the repo folder name.

```markdown
---
id: <ID>
title: <imperative, <= 8 words>
summary: <one sentence — the end-to-end behaviour, not layer-by-layer>
requested_by: <name / team>
date: <today, YYYY-MM-DD>
type: core | feature | qol | bug
area: <subsystem>
benefits: <who gains>
size: S | M | L
status: inbox
target:
notes: <blocked-by: <ID>; AFK|HITL; parent spec ref; deps>
---

## What to build
<the vertical slice, end-to-end. No file paths or code snippets — they go stale.>

## Acceptance criteria
- [ ] criterion 1
- [ ] criterion 2
```

## 7. Persist

Run `cairn commit "intake: <N> items from <source>"`. Let the tool honor its commit mode (batch / auto / ride-along) — don't hand-roll git. The files are on disk immediately, so nothing is lost.

Keep the tone level and terse. **Propose; don't promote** to `now` / `next` or reshuffle the board without a yes — that's `cairn-plan`'s job.
