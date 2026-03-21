# Proposed Changes

## Summary
The agent used `suggest --old` with text that didn't match the actual document content, then falsely reported success without verifying. The skill already mentions post-suggest verification but lacks guidance on reading the file *before* using `--old`/`--new` to get the exact text.

## Change 1: Add read-first requirement to Editing section
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: High
- Justification: Flag & Option Usage (3/5) — `--old` value didn't match actual document content because the agent didn't read the file first to get exact text
- Details: Add a bold line before the edit example:

**Before:**
```
**Always prefer targeted `--old`/`--new` edits.** This sends only the changed bytes instead of the entire file, avoiding token waste and reducing the chance of accidental overwrites:
```

**After:**
```
**Always prefer targeted `--old`/`--new` edits.** Read the file first (`overleaf read ... --raw`) and copy the exact target text for `--old` — never guess or paraphrase, since even minor whitespace differences cause silent failure.
```

## Change 2: Add verify-after-suggest to Gotchas
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: High
- Justification: Error Handling (2/5), Completeness (2/5) — agent claimed success without verifying; the existing verify guidance in the Suggest section was ignored. Gotchas are higher-visibility.
- Details: Add a new gotcha bullet:

```
- **Always verify after `suggest` or `edit`.** Re-read the file (`overleaf read ... --raw`) and confirm the new text is present. Both commands can silently fail if `--old` doesn't match — never assume success from the command output alone.
```

## Change 3: Trim redundant verify line from Suggest section
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: Low
- Justification: The verify guidance is now in Gotchas (more prominent); keeping both is redundant and wastes line budget
- Details: Remove this line from the Suggesting Changes section:

```
After suggesting, read the file back to verify the change landed correctly — especially when the user quoted a specific target sentence.
```
