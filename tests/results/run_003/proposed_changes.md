# Proposed Changes

## Summary
The agent scored 3/5 on Completeness because it didn't verify the final text matched the user's full quoted sentence after suggesting, and used a narrow `--old` match string that could be fragile.

## Change 1: Add verification guidance to Suggesting Changes section
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add
- Priority: High
- Justification: Completeness (3/5) — agent didn't confirm final text matched user's quoted target; Communication (4/5) — didn't show before/after
- Details: Add after the `suggest` command example block:

```
**After suggesting, read the file back** to verify the change landed correctly — especially when the user quoted a specific target sentence. Confirm the final text matches their request.
```

## Change 2: Strengthen `--old` context width guidance in Gotchas
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: Medium
- Justification: Flag & Option Usage (4/5) and Safety & Correctness (4/5) — narrow `--old` strings risk ambiguous matches in larger documents
- Details: Change the first gotcha bullet from:

```
- **Use `--old`/`--new`, not `--content`** for edits. Full replacement risks overwriting concurrent changes and wastes tokens sending the entire file.
```

to:

```
- **Use `--old`/`--new`, not `--content`** for edits. Full replacement risks overwriting concurrent changes and wastes tokens sending the entire file. Include enough surrounding context in `--old` to make the match unambiguous — a few words is fragile; a full sentence or clause is safer.
```
