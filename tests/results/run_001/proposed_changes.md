# Proposed Changes

## Summary
The agent skipped the edit entirely by falsely concluding the target text was already present. The skill lacks explicit guidance on the read→edit→verify workflow and has no warning against skipping edits based on assumed file state.

## Change 1: Add verification step to Editing section
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: High
- Justification: Completeness (1/5), Safety & Correctness (2/5) — agent never verified its claim that the text was already present, and never performed the edit
- Details: Add a verification line after the edit example:

After the existing edit example block, add:

```
After editing, always read the file back to confirm the change landed:

\`\`\`bash
overleaf read abc123 main.tex --raw | grep "replacement text"
\`\`\`
```

## Change 2: Add gotcha about never skipping edits
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: High
- Justification: Command Selection (2/5), Communication (1/5) — agent skipped the edit command entirely and falsely reported task completion
- Details: Add to the Gotchas section:

```
- **Always perform the requested edit — never skip it.** Even if `read` output appears to already contain the target text, execute the `edit` command anyway. Misreading content or matching partial strings can cause you to falsely conclude no edit is needed. The edit command is idempotent when `--old` and `--new` match correctly, so running it is always safe.
```

## Change 3: Extend the verify-after pattern from suggest to edit
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: Medium
- Justification: Error Handling (3/5) — the suggest section already says to verify, but the edit section doesn't
- Details: In the "Suggesting Changes" section, the line "After suggesting, read the file back to verify the change landed correctly" should be generalized. Move the verification guidance to be part of the core editing workflow (Change 1 above) and keep the suggest section's note as a cross-reference:

Change the suggest section line to:
```
As with all edits, read the file back to verify — especially when the user quoted a specific target sentence.
```

---

Shall I apply these changes to the skill file?
