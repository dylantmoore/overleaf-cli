# Contributing

There are two ways to contribute to overleaf-cli:

## 1. Add or maintain CLI commands

If Overleaf changes their API, a command breaks, or you want to add a new command:

**Code layout:**
- `bin/overleaf.mjs` — CLI entry point, command routing, arg parsing
- `lib/api.mjs` — REST API client
- `lib/socket.mjs` — Socket.IO v0.9 client (read, edit, suggest, comments)
- `lib/auth.mjs` — Session management, interactive login

**Important:** Any change to the CLI must also be updated in all three of these:
- `.claude-plugin/skills/overleaf.md` (the Claude Code skill)
- The `USAGE` help text in `bin/overleaf.mjs`
- `README.md`

**Testing your changes:** Create a disposable Overleaf project and run the test suite against it. See `tests/README.md` for full details.

## 2. Improve the Claude Code skill

The skill at `.claude-plugin/skills/overleaf.md` tells Claude how and when to use the CLI. Improving it makes every AI agent better at the tool. **To contribute skill improvements, run the eval suite to prove your changes help.**

### Quick start

```bash
# Run one task through the full pipeline (test + judge + propose improvements)
./tests/scripts/run_pipeline.sh tests/tasks/task_01_read_and_edit.md

# Run all 5 tasks
./tests/scripts/run_all.sh

# Judge an existing run
./tests/scripts/judge.sh tests/results/run_001

# Get proposed skill edits from judge findings
./tests/scripts/propose_changes.sh tests/results/run_001
```

### How it works

The pipeline has three stages:

```
task_*.md ──> run_test.sh ──> judge.sh ──> propose_changes.sh
                  │                │                │
                  v                v                v
           transcript.json  judge_findings.md  proposed_changes.md
```

1. **Run** — sends the task prompt (with the skill prepended) to `claude --print` and saves the transcript
2. **Judge** — sends the transcript + rubric to Claude, gets a scored evaluation (7 categories, max 55 points)
3. **Propose** — sends the judge findings + current skill to Claude, gets concrete file edits to improve the skill

See `tests/README.md` for full documentation on the rubric, task format, and directory structure.

### Requirements

- `claude` CLI installed and authenticated
- `overleaf` CLI installed and authenticated (`overleaf login`)
- A test Overleaf project (tasks reference 'Wildfire Modeling Draft')
- Bash 4+
