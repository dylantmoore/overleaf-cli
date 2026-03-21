# Proposed Changes

## Summary
The agent reported false success after `add-comment` without verifying the comment was persisted. The skill lacks verification guidance for comment operations, and the `add-comment` gotcha doesn't warn about silent OT failures.

## Change 1: Add post-comment verification to `add-comment` gotcha
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: **High**
- Justification: Error Handling (1/5), Completeness (1/5), Safety & Correctness (2/5) — agent claimed success without checking `overleaf threads`. The OT comment op (`{ c, p, t }`) can silently fail (e.g., stale version, Socket.IO issues) while `api.sendMessage` succeeds first, making the CLI report `{"success":true}` even when the anchor didn't land.
- Details: Replace the existing `add-comment` gotcha (line 93) with:

**Old:**
```
- **`add-comment` needs an anchor.** Use `--at-text "text to highlight"` (preferred) or `--position <char-offset>`. Example: `overleaf add-comment abc123 main.tex "Fix this typo" --at-text "teh results"`
```

**New:**
```
- **`add-comment` needs an anchor and post-verification.** Use `--at-text "text to highlight"` (preferred) or `--position <char-offset>`. The OT anchor op can fail silently even when the CLI reports success — **always verify with `overleaf threads <project-id>` and confirm the comment text appears**. Example: `overleaf add-comment abc123 main.tex "Fix this typo" --at-text "teh results"` then `overleaf threads abc123 | grep -q "Fix this typo"`.
```

## Change 2: Generalize verification principle for all mutating Socket.IO operations
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: **Medium**
- Justification: The existing suggest section (line 75) already says "read the file back to verify," but this principle isn't generalized. The judge dinged Flag & Option Usage (2/5) and Communication (2/5) because the agent trusted the CLI output blindly. A one-line addition to Gotchas makes verification a default habit for all write operations.
- Details: Add a new gotcha after the existing Socket timeout gotcha (after line 95):

**Add:**
```
- **Verify all mutations.** After `edit`, `suggest`, `add-comment`, or any write operation, confirm the result landed: re-read the file, list threads, or check the output. Socket.IO ops can fail silently.
```

This adds 1 net line (total ~111 → ~112). To stay under budget, the existing suggest verification note on line 75 ("After suggesting, read the file back to verify the change landed correctly — especially when the user quoted a specific target sentence.") can be shortened since the gotcha now covers it:

**Old (line 75):**
```
After suggesting, read the file back to verify the change landed correctly — especially when the user quoted a specific target sentence.
```

**New:**
```
After suggesting, read the file back to verify the change landed correctly.
```

Net line impact: +1 line for new gotcha, −0 lines (shorter line 75 is same count), total stays within margin.
