#!/usr/bin/env bash
# run_pipeline.sh — Full pipeline: run + judge + propose for a single task
#
# Usage: ./tests/scripts/run_pipeline.sh tests/tasks/task_01_read_and_edit.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <task_file.md>"
    exit 1
fi

echo "Step 1/3: Running test..."
bash "$SCRIPT_DIR/run_test.sh" "$1"

LATEST_RUN=$(ls -td "$REPO_ROOT/tests/results"/run_*/ 2>/dev/null | head -1)
LATEST_RUN="${LATEST_RUN%/}"

echo ""
echo "Step 2/3: Judging..."
bash "$SCRIPT_DIR/judge.sh" "$LATEST_RUN"

echo ""
echo "Step 3/3: Proposing changes..."
bash "$SCRIPT_DIR/propose_changes.sh" "$LATEST_RUN"

echo ""
echo "=== Pipeline Complete ==="
echo "Results: $LATEST_RUN"
