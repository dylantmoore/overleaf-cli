#!/usr/bin/env bash
# propose_changes.sh — Propose skill edits based on judge findings
#
# Usage: ./tests/scripts/propose_changes.sh tests/results/run_001

set -euo pipefail
unset CLAUDECODE 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/.claude-plugin/skills/overleaf.md"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <results_dir>"
    exit 1
fi

RESULTS_DIR="$1"
[[ "$RESULTS_DIR" = /* ]] || RESULTS_DIR="$(pwd)/$RESULTS_DIR"

for f in "$RESULTS_DIR/task.md" "$RESULTS_DIR/transcript.json" "$RESULTS_DIR/judge_findings.md" "$SKILL_FILE"; do
    [[ -f "$f" ]] || { echo "Error: Required file not found: $f"; exit 1; }
done

echo "=== Change Proposer ==="

TRANSCRIPT_TEXT=""
if command -v jq &>/dev/null; then
    TRANSCRIPT_TEXT=$(jq -r '.result // empty' "$RESULTS_DIR/transcript.json" 2>/dev/null || true)
fi
[[ -n "$TRANSCRIPT_TEXT" ]] || TRANSCRIPT_TEXT=$(cat "$RESULTS_DIR/transcript.json")

PROMPT_FILE=$(mktemp)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" << 'PROPOSE_PROMPT'
You are a skill improvement advisor for the overleaf-cli Claude Code skill. Analyze judge findings and propose concrete edits to the skill file.

Rules:
- The skill SKILL.md must stay under 100 lines (it's a CLI reference, not a tutorial)
- Focus on command selection guidance, gotchas, and flag usage
- Only propose changes that directly address judge-identified weaknesses
- If scores are all 4+, propose minimal or no changes
- Be specific: include exact text to add or change

Output format:

# Proposed Changes

## Summary
[1-2 sentences on main gaps]

## Change 1: [Brief title]
- File: [path]
- Action: [Add/Modify]
- Priority: [High/Medium/Low]
- Justification: [Which judge finding]
- Details: [exact content]

(or)

## No Changes Needed
[If scores are all 4+]

PROPOSE_PROMPT

printf '\n---\n\n## Original Task\n\n' >> "$PROMPT_FILE"
cat "$RESULTS_DIR/task.md" >> "$PROMPT_FILE"
printf '\n\n## Agent Transcript\n\n%s\n' "$TRANSCRIPT_TEXT" >> "$PROMPT_FILE"
printf '\n\n## Judge Findings\n\n' >> "$PROMPT_FILE"
cat "$RESULTS_DIR/judge_findings.md" >> "$PROMPT_FILE"
printf '\n\n## Current Skill File\n\n' >> "$PROMPT_FILE"
cat "$SKILL_FILE" >> "$PROMPT_FILE"

echo "Running proposer..."
claude --print -p "$(cat "$PROMPT_FILE")" \
    > "$RESULTS_DIR/proposed_changes.md" 2>"$RESULTS_DIR/proposer_stderr.log" || true

echo "=== Proposer Complete ==="
CHANGE_COUNT=$(grep -c "^## Change [0-9]" "$RESULTS_DIR/proposed_changes.md" 2>/dev/null || echo "0")
echo "Proposed changes: $CHANGE_COUNT"
