#!/usr/bin/env bash
# run_test.sh — Run a single skill test task through Claude CLI
#
# Usage: ./tests/scripts/run_test.sh tests/tasks/task_01_read_and_edit.md

set -euo pipefail
unset CLAUDECODE 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESULTS_BASE="$REPO_ROOT/tests/results"
SKILL_FILE="$REPO_ROOT/.claude-plugin/skills/overleaf.md"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <task_file.md>"
    exit 1
fi

TASK_FILE="$1"
if [[ ! -f "$TASK_FILE" ]]; then
    echo "Error: Task file not found: $TASK_FILE"
    exit 1
fi

# Auto-increment run number
mkdir -p "$RESULTS_BASE"
NEXT_RUN=1
for dir in "$RESULTS_BASE"/run_*/; do
    if [[ -d "$dir" ]]; then
        num="${dir%/}"; num="${num##*run_}"
        if [[ "$num" =~ ^[0-9]+$ ]] && (( num >= NEXT_RUN )); then
            NEXT_RUN=$(( num + 1 ))
        fi
    fi
done

RUN_DIR="$RESULTS_BASE/run_$(printf '%03d' "$NEXT_RUN")"
mkdir -p "$RUN_DIR"

echo "=== Test Run $NEXT_RUN ==="
echo "Task: $TASK_FILE"
echo "Results: $RUN_DIR"

cp "$TASK_FILE" "$RUN_DIR/task.md"

# Extract prompt from "## Task Prompt" section
PROMPT=$(awk '/^## Task Prompt/ { found=1; next } found && /^##? [^#]/ { exit } found { print }' "$TASK_FILE")

if [[ -z "$PROMPT" ]]; then
    echo "Error: No '## Task Prompt' section found"
    exit 1
fi

# Build full prompt with skill context
FULL_PROMPT="Read this skill documentation first:

$(cat "$SKILL_FILE")

---

Now execute this task:

$PROMPT"

echo "Running claude..."
START_TIME=$(date +%s)

claude --print \
    --output-format json \
    -p "$FULL_PROMPT" \
    > "$RUN_DIR/transcript.json" 2>"$RUN_DIR/stderr.log" || {
        echo "Warning: claude exited with code $?"
    }

END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))

cat > "$RUN_DIR/metadata.json" <<EOF
{
    "task_file": "$(basename "$TASK_FILE")",
    "run_number": $NEXT_RUN,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "elapsed_seconds": $ELAPSED
}
EOF

echo "=== Complete (${ELAPSED}s) ==="
echo "Transcript: $RUN_DIR/transcript.json"
