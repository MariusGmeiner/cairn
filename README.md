# ⣠⣾⣷⣄ CAIRN

**Command-line Assistant Interface for Roadmaps and Next actions** — *marks your next step.*

A project-agnostic, terminal-native PM assistant for a solo developer. Installed once
globally, it works inside *any* git repo: it keeps a clean per-repo backlog, always
tells you the one next thing to do, and lets you capture and triage requests through a
conversation instead of a form.

Two panes that never talk to each other directly — they share the repo's `.cairn/`
markdown files:

```
┌───────────────────────────┬───────────────────────────┐
│  LEFT: cairn (the TUI)    │  RIGHT: Claude Code        │
│  always-on, read-only     │  on-demand, the "brain"    │
│  no model calls           │  runs the /skills          │
└─────────────┬─────────────┴─────────────┬─────────────┘
              │        read / write        │
              ▼                            ▼
          ┌───────────────────────────────────┐
          │   <repo>/.cairn/  (markdown files) │
          └───────────────────────────────────┘
```

The board is a fullscreen, tabbed TUI — **Next · Inbox · Backlog · Help**, switched with
the arrow keys:

```
╭──────────────────────────────────────────────────────────────╮
│  ⣠⣾⣷⣄ ⣏⡁⡮⡆⣹⡁⡯⡂⡗⡅ · marks your next step                    │
│  Project: my-app                            2026-06-13  09:41 │
│ ──────────────────────────────────────────────────────────── │
│ ▸ Next     Inbox 3     Backlog     Help                      │
│ ──────────────────────────────────────────────────────────── │
│ NEXT ACTION                                   CRM-042   FEAT  │
│                                                              │
│ ▸ Bulk-edit contact tags                                     │
│    target ▸ select multiple contacts, apply a tag in one go  │
│    ░░░░░░░░░░░░░░░░  0%                                       │
│    press a to mark shipped   ·   v to read the full item     │
│                                                              │
│   next   Wire the tag service                                │
╰──────────────────────────────────────────────────────────────╯
  watching ./.cairn ● live · auto       ←/→ tabs · a ship · v read · q quit
```

- **Next** — the one active action: clickable id (Ctrl/⌘+Click opens its `.md`), the full
  target, `v` to read the whole item, and the next-up item at the bottom.
- **Inbox** — untriaged ideas; the tab badge shows how many are waiting.
- **Backlog** — the now/next/later roadmap, scrollable, `1–5` to filter by type.
- **Help** — the working loop, the keys, and the installed skills.

## Install

```sh
git clone <this repo> && cd cairn
npm install          # also builds via "prepare"
npm link             # puts `cairn` on your PATH

cairn install-skills # add /cairn-capture /cairn-intake /cairn-plan /cairn-sync /cairn-shutdown /cairn-ballot /cairn-loop to ~/.claude/skills
```

> Requires Node ≥ 18 and git. Renders in Windows Terminal / Git Bash (box-drawing +
> color verified).

## Use it in any repo

```sh
cd ~/code/my-project
cairn init     # scaffold .cairn/, install the post-commit hook, seed starter items
cairn          # open the board (left pane)
```

Open Claude Code in a second pane in the same folder and drive the brain with the
skills:

| skill              | what it does                                              |
|--------------------|-----------------------------------------------------------|
| `/cairn-capture`   | add a request — asks the open questions, triages, files it |
| `/cairn-intake`    | break a plan / spec / conversation into a batch of triaged backlog items |
| `/cairn-plan`      | refresh Now / Next / Later + pre-compute the next-action queue |
| `/cairn-sync`      | pull progress from your commits, advance the current action |
| `/cairn-shutdown`  | Cal-Newport shutdown ritual — daily log + team update     |
| `/cairn-ballot`    | every 2nd Monday: propose exactly 2 vetted day-or-two options to vote on |
| `/cairn-loop`      | work the backlog hands-free — implement, commit, sync, repeat |

In the TUI: **`←/→`** switch tabs · **`a`** ship the current action (pop the next) ·
**`v`** read the full item · **`↑/↓`** move the list selection · **`1–5`** filter the
backlog by type · **`q`** quit. The board watches `.cairn/` and re-renders the instant a
skill edits a file.

## Layout (`cairn init` creates this)

```
<repo>/.cairn/
  backlog/      one markdown file per item (YAML frontmatter)
  board/
    current.md  the active next action + target + progress
    queue.md    ordered upcoming item ids (pre-computed by /cairn-plan)
  daily/        end-of-day summaries (written by /cairn-shutdown)
  activity/     this repo's commits — gitignored, written by the hook
```

Commit `backlog/` and `board/` (their history travels with the repo). `activity/` is
local, derived, and gitignored. CAIRN's own commits — if you make them — use a `cairn:`
prefix so they filter out of code history:
`git log --invert-grep --grep='^cairn:'`.

## Backlog item schema

```markdown
---
id: CRM-042
title: Bulk-edit contact tags
summary: Select multiple contacts, apply or remove a tag in one action
requested_by: Sara (Sales)
date: 2026-06-10
type: qol             # core | qol | bug | feature
area: contacts
benefits: anyone managing large contact lists
size: S               # S | M | L
status: inbox         # inbox | later | next | now | shipped | wontdo
target:               # acceptance condition; set when it becomes the active action
notes: depends on the tag-refactor already in flight
---
```

Now / Next / Later are **derived** from `status` — never duplicated.

## Billing guardrails

The TUI never calls a model. Keep the brain on your subscription:

- Run Claude Code **interactively** (Pro/Max limits), not `claude -p` / headless.
- **Unset `ANTHROPIC_API_KEY`** — if set, Claude Code routes to API billing.
- Use **Opus** at a sensible `/effort` for the reasoning skills.

## Commands

```
cairn                  open the board (TUI) for the current repo
cairn init [--bare]    scaffold .cairn/ + install the post-commit hook
cairn install-skills   install the bundled skills into ~/.claude/skills [--force]
cairn advance          ship the current action + advance (same as [a])
cairn commit [msg]     commit .cairn changes per commit mode (cairn: prefix / ride-along)
cairn config           show/set commit mode + ballot cadence
cairn record-commit    internal — called by the git post-commit hook
cairn --help
```

## Commit modes

CAIRN versions `.cairn/backlog/`, `.cairn/board/`, and `.cairn/daily/`; `.cairn/activity/`
is gitignored. How those changes get committed is per-repo config (`.cairn/config.json`):

- **`auto`** (default) — CAIRN commits its own changes with a `cairn:` prefix, so they're
  trivial to filter out of code history:
  `git log --invert-grep --grep='^cairn:'`. The post-commit hook ignores these, so the
  activity log stays about real work.
- **`ride-along`** — CAIRN only writes files; they go in with your next code commit. No
  `cairn:` noise.

```sh
cairn config                          # show mode + when the next vote is due
cairn config commit-mode ride-along   # switch
```

The TUI's `[a]`, `cairn advance`, and the skills all honor the mode automatically.

## The biweekly vote

Every **second Monday** — or the **Monday after the last voted feature shipped** — the
board shows a **ballot due** chip. Run **`/cairn-ballot`**: it proposes **exactly two**
options, each a `feature`/`qol` pre-vetted against the actual code and scoped to a
~98%-certain **1–2 day** build, with explicit out-of-scope cuts. The team votes; the
single winner is queued for the next cycle. No voting on the raw backlog, no items that
turn out to be a pain to implement.

`cairn config` shows the next vote date and the voted feature's status.
`cairn config ballot-done <winner-id>` records a held vote + its winner and resets the
Monday clock; when that winner later ships, CAIRN pulls the next vote forward to the
following Monday.

## Develop

```sh
npm run dev -- init    # run the CLI from source via tsx
npm run dev            # run the TUI from source
npm run build          # tsc → dist/
npm run typecheck
```

## License

MIT
