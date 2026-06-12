# CAIRN

**Command-line Assistant Interface for Roadmaps and Next actions.**

A project-agnostic, terminal-native PM assistant for a solo developer. Installed once
globally, it works inside *any* git repo: it keeps a clean per-repo backlog, always tells you
the one next thing to do in that project, and lets you capture and triage new requests
through a conversation instead of a form. You run it locally in a terminal in your project folder.

> Scope: the CAIRN application only — the TUI, the per-repo backlog convention, the Claude
> Code skills that drive it, the git activity hook, and the startup wiring. The monorepo
> migration is out of scope. "CAIRN" is the name; rename freely.

---

## 1. Core ideas

- **One tool, many repos.** CAIRN is installed once. You run it inside a project and it
  operates on that project's backlog. Behavior is global; data is per-repo.
- **Per-repo source of truth:** a `.cairn/` folder at each repo's root holds plain markdown.
  Human- and Obsidian-readable, diffable, co-located with the code it describes.
- **Now / Next / Later**, not sprints. A lightweight roadmap — no dates, no agile ceremony.
- **One next action at a time.** CAIRN surfaces a single concrete next step with a defined
  *target state*. Hit the target, advance to the next. The whole backlog is one keystroke
  away but never in your face — the antidote to overwhelm.
- **Protect focus.** New input rarely changes what you're doing right now; CAIRN only
  promotes something to a next step when it's genuinely urgent or blocking, and it surfaces
  that change rather than silently reshuffling.
- **Calm, terse chief-of-staff** tone, not a chirpy mascot.

## 2. Architecture — file-as-contract, per repo

Inside a project you run two panes that never talk to each other directly — they share the
repo's `.cairn/` files:

```
  Windows Terminal (one window, two panes) — inside the project repo
  ┌───────────────────────────┬───────────────────────────┐
  │  LEFT: cairn (the TUI)    │  RIGHT: Claude Code        │
  │  Ink, read-only display   │  interactive, in the repo  │
  │  always-on · no model     │  on-demand · subscription  │
  └─────────────┬─────────────┴─────────────┬─────────────┘
                │        read / write        │
                ▼                            ▼
            ┌───────────────────────────────────┐
            │   <repo>/.cairn/  (markdown files) │
            │   = this project's source of truth │
            └───────────────────────────────────┘
```

- The **TUI** is an always-on display for the current repo. It reads `.cairn/`, watches it,
  and re-renders the instant anything changes. No model calls. Its only write is a
  deterministic "advance to next action."
- The **brain** is Claude Code, run interactively in the repo. Because it sees the code *and*
  the plans in one tree, it can correlate the plan with the real code, commits, and tests —
  the skills are sharper for it.
- The repo's own **post-commit hook** appends each commit to its local activity log, so the
  assistant sees what you've done without being told.

## 3. Install, layout & commands

Global, installed once:

- The four skills in your user-level Claude config (`~/.claude/skills/`) so they're available
  in every repo. Each SKILL.md encodes the `.cairn/` convention.
- The `cairn` binary on your PATH.

Per repo, created by `cairn init`:

```
<repo>/
  .cairn/
    backlog/
      CRM-001.md          one item per file (frontmatter, §5)
      ...
    board/
      current.md          active next action: item id, target state, progress
      queue.md            ordered upcoming item ids (pre-computed by `plan`)
    daily/
      2026-06-12.md       end-of-day summaries written by `shutdown`
    activity/
      log.jsonl           this repo's commits (written by the hook; gitignored)
```

Commands:

- `cairn init` — scaffold `.cairn/` in the current repo and install the post-commit hook.
- `cairn` — launch the TUI for the current repo (resolves the repo root via
  `git rev-parse --show-toplevel`, so it works from any subdirectory).
- `cairn record-commit` — internal; called by the hook (§7).

## 4. Versioning the `.cairn/` folder

Default: commit `.cairn/backlog/` and `.cairn/board/` (you want their history, and they
travel with clones), and **gitignore `.cairn/activity/`** — it's local, derived, noisy, and
the hook writing to it would otherwise keep your tree perpetually dirty. CAIRN's own commits
use a `cairn:` prefix so they're easy to filter out of code history
(`git log --invert-grep --grep='^cairn:'`).

The markdown is written to disk immediately regardless of commits, so a crash never loses
captured content — only its git history. If the `cairn:` commit noise bothers you, switch to
**ride-along mode**: CAIRN writes the files but doesn't commit them, and they go in with your
next code commit. Pick per taste.

## 5. Backlog item schema

Each item is one markdown file in `.cairn/backlog/` with YAML frontmatter:

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
target:               # acceptance condition; set when this becomes the active action
notes: depends on the tag-refactor already in flight
---
```

Status meanings: `inbox` = freshly captured, awaiting ranking · `later` = someday/backlog ·
`next` = queued · `now` = active this period · `shipped` = done · `wontdo` = declined (keep a
one-line reason so people feel heard). The Now / Next / Later views are **derived** from these
statuses, never duplicated; the TUI's inbox panel shows freshly captured items.

## 6. Single next action + target state

`board/current.md` names the active item and restates its target state — the concrete
acceptance condition that means done (e.g. "bulk-edit can call `tagService.apply()`").
`board/queue.md` holds the pre-computed ordered ids of what comes next.

Advancing is deterministic and free: in the TUI you click a button when you've hit the
target. The TUI marks the current item `shipped`, keeps a note about it in the activity log (
`.cairn/activity/log.jsonl`), pops the next id from `queue.md`, sets it
`now`, and writes its target into `current.md` — no model involved. If the queue is empty, it
tells you to run `/plan` in the right pane. You only spend a brain pass when the queue runs
low, the inbox piles up, or priorities shift — not every time you finish a step. That's what
keeps your focus stable.

## 7. The skills (the brain)

Four global, convention-aware skills in `~/.claude/skills/`, run interactively in the right
pane. A skill "triggering" another is just the same session continuing into the next skill's
steps — one conversation where you can still answer questions mid-flow.

**`capture` — interactive intake.** You type a raw idea or request. It asks only the open
questions it can't infer (who's it for, what problem, does it block anything, rough size),
triages inline (categorize, dedup against the backlog, rough-size), writes a structured item
file, and records it. Then it checks whether the item affects your next steps: if not, it
lands quietly in the backlog; if it's urgent or blocking, it **surfaces** the change and
offers to promote it ("this looks like it should be your next step — promote it?") rather than
silently reordering. Absorbs what would otherwise be a separate triage step.

**`plan` — refresh the roadmap.** Reads the backlog, refreshes Now / Next / Later and the
pre-computed `queue.md` (each with a target state), and writes a short briefing. Core
features outrank community/QoL items — those are never auto-prioritized over core work.

**`sync` — catch up from work done.** Reads recent commits from this repo's
`.cairn/activity/log.jsonl`, marks progress on the current action, judges whether its target
was met, and advances.

**`shutdown` — close the day.** Updates statuses, writes the `daily/<date>.md` summary,
drafts the team update, and (biweekly) assembles the vetted small-QoL voting ballot for the
separate team-facing board.

## 8. The git activity hook

`cairn init` installs a trivial post-commit hook that delegates to the tool, so the fiddly
part (reading the commit, escaping JSON safely) lives in testable code, not shell:

```sh
# .git/hooks/post-commit  (installed by `cairn init`, must be executable)
#!/bin/sh
command -v cairn >/dev/null 2>&1 && cairn record-commit >/dev/null 2>&1 || true
```

The guard means a missing `cairn` on PATH can never block a commit. `cairn record-commit`
then appends one JSONL line to this repo's activity log:

```ts
const root = sh('git rev-parse --show-toplevel').trim();
const cairnDir = path.join(root, '.cairn');
if (!fs.existsSync(cairnDir)) process.exit(0);          // not a CAIRN repo → no-op

// NUL-separated so commit messages with quotes/commas can't break parsing
const [sha, author, ts, subject] = sh('git log -1 --format=%H%x00%an%x00%aI%x00%s').split('\0');
const files = sh('git diff-tree --no-commit-id --name-only -r HEAD').split('\n').filter(Boolean);

const line = JSON.stringify({
  ts, repo: path.basename(root), sha: sha.slice(0, 10), author, subject, files: files.length,
}) + '\n';

fs.mkdirSync(path.join(cairnDir, 'activity'), { recursive: true });
fs.appendFileSync(path.join(cairnDir, 'activity', 'log.jsonl'), line);
```

`JSON.stringify` handles escaping, the NUL separators avoid delimiter collisions, and the
early no-op when there's no `.cairn/` makes the hook safe anywhere. The hook only appends — it
never commits — so there's no loop, and the gitignored log never dirties the tree.

To install it once for **all** repos instead of per-repo, set a global hooks path:

```sh
git config --global core.hooksPath ~/.cairn/git-hooks   # place the post-commit hook there
```

Caveat: a global `core.hooksPath` overrides each repo's local `.git/hooks`, so it collides
with husky / lefthook / any tool that also drives hooks through that setting. For repos with
their own hook managers, prefer the per-repo `cairn init` install; use the global path only if
you don't otherwise manage hooks.

## 9. The TUI

Built in **Ink (React + TypeScript)** — terminal-native. Always-on
left pane: read-only for backlog content, with the one deterministic advance action.

It must:
- Read the current repo's `.cairn/backlog/`, `board/current.md`, and `board/queue.md`; group
  items by status.
- Read each skill's `description` straight from `~/.claude/skills/*/SKILL.md` so the on-screen
  skills legend stays in sync automatically — never hardcode it.
- Watch all of these with **chokidar** and re-render on change, so the board updates the
  instant a skill in the other pane edits a file.
- Use color for meaning only (core vs qol, filled vs empty progress), a small ANSI-safe
  palette, and a live-watch indicator. No gradients/effects.
- Keybinds: **`[a]dvance`** (equals click on the done button), **`[q]uit`**, and scrolling. No capture/edit keys — those live in
  the Claude pane.
- Render correctly in Git Bash on Windows (verify box-drawing chars + colors).

Layout:

```
 ┌─ CAIRN · crm-contacts ───────────── 2026-06-12 14:32 ─┐
 │ NEXT ACTION                                      core  │
 │  ▸ Finish tag-refactor                                 │
 │    target ▸ bulk-edit can call tagService.apply()      │
 │    ████████░░  ~80%                                    |
 |  ________                                              │
 |  | Done |                                              │
 ├────────────────────────────────────────────────────────┤
 │ NOW            NEXT              LATER                 │
 │ • tag-refactor • bulk-edit UI    • CSV import          │
 │                • contact merge   • dark mode      +12  │
 ├────────────────────────────────────────────────────────┤
 │ INBOX                                           3 new  │
 │ • export to xlsx?   • merge dupes faster   • …         │
 ├────────────────────────────────────────────────────────┤
 │ SKILLS  ·  run these in the Claude Code pane →         │
 │  /capture   add a request — asks questions, then files │
 │  /plan      refresh now / next / later + next action   │
 │  /sync      pull git progress, advance current action  │
 │  /shutdown  end-of-day log + team update               │
 └────────────────────────────────────────────────────────┘
  watching ./.cairn  ● live          [a]dvance   [q]uit
```

## 10. Billing guardrails (important)

The brain must stay on your subscription, not API billing:

- Run Claude Code **interactively** — interactive terminal use draws from your Pro/Max limits.
- **Do not** use `claude -p` / headless / scheduled runs. As of 2026-06-15 those bill against
  a separate per-user credit pool at API rates.
- **Unset `ANTHROPIC_API_KEY`** — if set, Claude Code routes to API billing.
- Use **Opus** for the reasoning skills at a sensible `/effort`. The TUI never calls a model.

## 11. Build phases

- **v1 — thin slice (start here):** the `cairn init` scaffold + schema + the four skills
  (global), the TUI display with `[a]dvance` (or `Done` button), and `capture` + `plan` run by hand. No git
  ingestion yet. Live with the loop in one project for a few days.
- **v2 — auto sync:** the post-commit hook + `record-commit`, and the git-aware part of
  `sync` so progress tracks from your commits.
- **Polish:** `shutdown` daily summaries + biweekly ballot, inbox/overflow refinements,
  ride-along commit mode.

## 12. Out of scope / non-goals

- **Cross-project / global "single next action" roll-up** — deliberately omitted. Each repo
  has its own next action; you switch repos. (Few enough projects that a unified view isn't
  worth the complexity.)
- **Team-facing transparency board + voting** — a *separate* tool (Trello / Fider / Canny).
  CAIRN only feeds it: `shutdown` drafts the update and the biweekly ballot.
- **Custom MCP** — not needed; the brain edits the markdown directly and the TUI reads it.
- **Capture-from-anywhere global hotkey** — not wanted; switching to the terminal pane is fine.

## 13. Tooling summary

Node + TypeScript · Ink (TUI) · chokidar (file watching) · git (per-repo hook) · Claude Code on Opus, interactive, subscription-billed (the brain).
