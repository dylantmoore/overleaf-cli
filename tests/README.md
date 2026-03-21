# Overleaf CLI Skill Test Suite

Automated evaluation pipeline for the `overleaf` Claude Code skill. Runs test tasks through the skill, judges the output against a rubric, and proposes concrete improvements.

## Quick Start

```bash
# Run a single task through the full pipeline (run + judge + propose)
./tests/scripts/run_pipeline.sh tests/tasks/task_01_read_and_edit.md

# Run just the test (no judging)
./tests/scripts/run_test.sh tests/tasks/task_02_suggest_changes.md

# Run all 5 tasks (test only)
./tests/scripts/run_all.sh

# Dry run — list tasks without executing
./tests/scripts/run_all.sh --dry-run

# Judge an existing run
./tests/scripts/judge.sh tests/results/run_001

# Propose skill edits from judge findings
./tests/scripts/propose_changes.sh tests/results/run_001
```

## Pipeline

Each test task goes through three stages:

```
task_*.md ──> run_test.sh ──> judge.sh ──> propose_changes.sh
                  │                │                │
                  v                v                v
           transcript.json  judge_findings.md  proposed_changes.md
```

### Stage 1: Run (`run_test.sh`)

Extracts the prompt from the `## Task Prompt` section of a task file and sends it to `claude --print --output-format stream-json`. The skill triggers naturally from the user's installed plugins — no manual injection.

**Outputs** (in `tests/results/run_NNN/`):
- `transcript.json` — full Claude response
- `task.md` — copy of the original task
- `metadata.json` — run number, timestamp, duration
- `stderr.log` — any CLI errors

### Stage 2: Judge (`judge.sh`)

Sends the task, transcript, and rubric to Claude and asks it to score each of the 7 rubric categories (1-5). PRIMARY categories count 2x, SECONDARY count 1x. Maximum weighted total is 55.

**Outputs:**
- `judge_findings.md` — scores, justifications, errors, strengths/weaknesses

### Stage 3: Propose (`propose_changes.sh`)

Sends the judge findings, transcript, task, and current skill file to Claude. Asks for concrete, actionable edits to improve the skill.

**Outputs:**
- `proposed_changes.md` — specific file edits with priority and justification

## Directory Structure

```
tests/
├── README.md            # This file
├── coverage_map.md      # CLI capability inventory
├── rubric.md            # 7-category scoring rubric
├── tasks/               # Test task files
│   ├── task_01_read_and_edit.md
│   ├── task_02_suggest_changes.md
│   ├── task_03_compile_download.md
│   ├── task_04_search_and_comment.md
│   └── task_05_file_management.md
├── scripts/
│   ├── run_test.sh      # Run single task
│   ├── run_all.sh       # Run all tasks
│   ├── judge.sh         # Score against rubric
│   ├── propose_changes.sh  # Propose skill edits
│   └── run_pipeline.sh  # Full pipeline
└── results/             # Auto-created run directories
    └── run_NNN/
        ├── task.md
        ├── transcript.json
        ├── metadata.json
        ├── stderr.log
        ├── judge_findings.md
        └── proposed_changes.md
```

## Rubric Categories

| # | Category | Weight | What it measures |
|---|----------|--------|------------------|
| 1 | Command Selection | PRIMARY (2x) | Right `overleaf` command for the task |
| 2 | Flag & Option Usage | PRIMARY (2x) | Correct flags, `--old`/`--new` vs `--content` |
| 3 | Safety & Correctness | PRIMARY (2x) | No corruption, conflict handling |
| 4 | Workflow Efficiency | PRIMARY (2x) | Minimal commands, no wasted calls |
| 5 | Error Handling | SECONDARY (1x) | Graceful recovery from errors |
| 6 | Completeness | SECONDARY (1x) | All parts of request addressed |
| 7 | Communication | SECONDARY (1x) | Clear explanation to user |

**Weighted total**: (sum of PRIMARY scores) x 2 + (sum of SECONDARY scores) = max 55

## Requirements

- `claude` CLI installed and authenticated
- `overleaf` CLI installed and authenticated (`overleaf login`)
- A test Overleaf project (the tasks reference 'CLI Test Complete')
- Bash 4+
