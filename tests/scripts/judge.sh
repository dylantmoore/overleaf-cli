#!/usr/bin/env bash
# judge.sh — Score a test run against the rubric using Claude as judge
#
# Usage: ./tests/scripts/judge.sh tests/results/run_001

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

# Extract transcript text
TRANSCRIPT_TEXT=""
if command -v jq &>/dev/null; then
    TRANSCRIPT_TEXT=$(jq -r '.result // empty' "$RESULTS_DIR/transcript.json" 2>/dev/null || true)
fi
[[ -n "$TRANSCRIPT_TEXT" ]] || TRANSCRIPT_TEXT=$(cat "$RESULTS_DIR/transcript.json")

PROMPT_FILE=$(mktemp)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" << 'JUDGE_PROMPT'
You are an Overleaf CLI skill quality judge. Evaluate how well a Claude Code agent used the overleaf CLI to respond to a task.

Focus on CLI command selection, flag usage, safety (no file corruption), and efficiency. Follow the rubric exactly, including the weighted total formula.

Output format:

# Judge Findings

## Category Scores

### [Category Name]: X / 5
**Justification:** [2-3 sentences with specific command examples]

(repeat for each of the 7 rubric categories)

## Weighted Total: XX / 55

## Errors Found
- [specific errors]

## Key Strengths
- [bullet points]

## Key Weaknesses
- [bullet points]

## Summary
[1-2 sentence overall assessment]

---

JUDGE_PROMPT

printf '\n## Original Task\n\n' >> "$PROMPT_FILE"
cat "$RESULTS_DIR/task.md" >> "$PROMPT_FILE"
printf '\n\n## Scoring Rubric\n\n' >> "$PROMPT_FILE"
cat "$RUBRIC_FILE" >> "$PROMPT_FILE"
printf '\n\n## Agent Transcript\n\n%s\n' "$TRANSCRIPT_TEXT" >> "$PROMPT_FILE"

echo "Running judge..."
claude --print -p "$(cat "$PROMPT_FILE")" \
    > "$RESULTS_DIR/judge_findings.md" 2>"$RESULTS_DIR/judge_stderr.log" || true

echo "=== Judge Complete ==="
grep -m1 "Weighted Total" "$RESULTS_DIR/judge_findings.md" 2>/dev/null || true
