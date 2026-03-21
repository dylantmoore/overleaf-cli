#!/usr/bin/env bash
# run_all.sh — Run all test tasks sequentially
#
# Usage: ./tests/scripts/run_all.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASKS_DIR="$REPO_ROOT/tests/tasks"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

TASK_FILES=()
for f in "$TASKS_DIR"/task_*.md; do
    [[ -f "$f" ]] && TASK_FILES+=("$f")
done

if [[ ${#TASK_FILES[@]} -eq 0 ]]; then
    echo "No task files found in $TASKS_DIR"
    exit 1
fi

echo "Found ${#TASK_FILES[@]} task(s):"
for f in "${TASK_FILES[@]}"; do echo "  - $(basename "$f")"; done

if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] Exiting."
    exit 0
fi

PASSED=0; FAILED=0
for f in "${TASK_FILES[@]}"; do
    echo ""
    echo "━━━ Running: $(basename "$f") ━━━"
    if bash "$SCRIPT_DIR/run_test.sh" "$f"; then
        PASSED=$(( PASSED + 1 ))
    else
        FAILED=$(( FAILED + 1 ))
        echo "WARNING: $(basename "$f") had errors"
    fi
done

echo ""
echo "━━━ Complete: $PASSED passed, $FAILED failed out of ${#TASK_FILES[@]} ━━━"
[[ $FAILED -gt 0 ]] && exit 1
