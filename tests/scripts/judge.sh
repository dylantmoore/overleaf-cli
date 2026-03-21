#!/usr/bin/env bash
# judge.sh — Run assertions then score with LLM judge
#
# Usage: ./tests/scripts/judge.sh tests/results/run_001
#
# 1. Extracts ## Assertions from the task file and runs each command
# 2. Captures verification output (overleaf threads, files, read, etc.)
# 3. Feeds task + transcript + assertion results + rubric to Claude for scoring

set -euo pipefail
unset CLAUDECODE 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUBRIC_FILE="$REPO_ROOT/tests/rubric.md"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <results_dir>"
    exit 1
fi

RESULTS_DIR="$1"
[[ "$RESULTS_DIR" = /* ]] || RESULTS_DIR="$(pwd)/$RESULTS_DIR"

for f in "$RESULTS_DIR/task.md" "$RESULTS_DIR/transcript.json" "$RUBRIC_FILE"; do
    [[ -f "$f" ]] || { echo "Error: Required file not found: $f"; exit 1; }
done

echo "=== Judge Evaluation ==="
echo "Results dir: $RESULTS_DIR"

# ── Resolve project ID ──────────────────────────────────────────────
PROJECT=$(overleaf projects 2>/dev/null | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [[ -z "$PROJECT" ]]; then
    echo "Warning: Could not resolve project ID for assertions"
fi
export PROJECT

# ── Step 1: Run assertions from task file ───────────────────────────
TASK_FILE="$RESULTS_DIR/task.md"
ASSERTIONS=$(awk '/^## Assertions/,/^## [^A]/' "$TASK_FILE" | grep -v '^##' | sed -n '/^```bash/,/^```/p' | grep -v '^```')

ASSERT_RESULTS=""
ASSERT_PASS=0
ASSERT_FAIL=0
ASSERT_TOTAL=0

if [[ -n "$ASSERTIONS" ]]; then
    echo ""
    echo "Running assertions..."
    while IFS= read -r cmd; do
        [[ -z "$cmd" || "$cmd" =~ ^# ]] && continue
        ASSERT_TOTAL=$((ASSERT_TOTAL + 1))
        # Expand $PROJECT in the command
        EXPANDED=$(eval echo "$cmd")
        if eval "$cmd" 2>/dev/null; then
            ASSERT_PASS=$((ASSERT_PASS + 1))
            ASSERT_RESULTS+="PASS: $cmd\n"
            echo "  PASS: $cmd"
        else
            ASSERT_FAIL=$((ASSERT_FAIL + 1))
            ASSERT_RESULTS+="FAIL: $cmd\n"
            echo "  FAIL: $cmd"
        fi
    done <<< "$ASSERTIONS"
    echo "Assertions: $ASSERT_PASS/$ASSERT_TOTAL passed"
fi

# Save assertion results
printf "$ASSERT_RESULTS" > "$RESULTS_DIR/assertion_results.txt"

# ── Step 2: Capture verification output ─────────────────────────────
VERIFY_OUTPUT=""
if [[ -n "$PROJECT" ]]; then
    VERIFY_OUTPUT+="=== overleaf files ===\n"
    VERIFY_OUTPUT+="$(overleaf files "$PROJECT" 2>/dev/null || echo 'failed')\n\n"
    VERIFY_OUTPUT+="=== overleaf threads ===\n"
    VERIFY_OUTPUT+="$(overleaf threads "$PROJECT" 2>/dev/null || echo 'failed')\n\n"
fi

# ── Step 3: LLM judge with evidence ────────────────────────────────
TRANSCRIPT_TEXT=$(cat "$RESULTS_DIR/transcript.json")

PROMPT_FILE=$(mktemp)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" << 'JUDGE_PROMPT'
You are an Overleaf CLI skill quality judge. Evaluate how well a Claude Code agent used the overleaf CLI to respond to a task.

You have FOUR sources of evidence:
1. The original task prompt
2. The agent's response transcript
3. Assertion results (pass/fail checks on actual Overleaf state)
4. Verification output (current state of project files and threads)

Use the assertions and verification output as ground truth. If assertions passed, the task was completed correctly regardless of what the transcript says. If assertions failed, the task failed regardless of what the transcript claims.

Follow the rubric exactly, including the weighted total formula.

Output format:

# Judge Findings

## Assertion Results
[List each assertion and whether it passed or failed]

## Category Scores

### [Category Name]: X / 5
**Justification:** [2-3 sentences with evidence from assertions and transcript]

(repeat for each of the 7 rubric categories)

## Weighted Total: XX / 55

## Summary
[1-2 sentence assessment grounded in assertion results]

JUDGE_PROMPT

printf '\n---\n\n## Original Task\n\n' >> "$PROMPT_FILE"
cat "$TASK_FILE" >> "$PROMPT_FILE"
printf '\n\n## Scoring Rubric\n\n' >> "$PROMPT_FILE"
cat "$RUBRIC_FILE" >> "$PROMPT_FILE"
printf '\n\n## Agent Transcript\n\n%s\n' "$TRANSCRIPT_TEXT" >> "$PROMPT_FILE"
printf '\n\n## Assertion Results\n\n%b\n' "$ASSERT_RESULTS" >> "$PROMPT_FILE"
printf '\n\n## Verification Output (Current Overleaf State)\n\n%b\n' "$VERIFY_OUTPUT" >> "$PROMPT_FILE"

echo ""
echo "Running LLM judge..."
claude --print -p "$(cat "$PROMPT_FILE")" \
    > "$RESULTS_DIR/judge_findings.md" 2>"$RESULTS_DIR/judge_stderr.log" || true

echo "=== Judge Complete ==="
echo "Assertions: $ASSERT_PASS/$ASSERT_TOTAL"
grep -m1 "Weighted Total" "$RESULTS_DIR/judge_findings.md" 2>/dev/null || true
