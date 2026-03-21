# Proposed Changes

## Summary
All scores are 4+, so only a minimal change is warranted. The one recurring inefficiency is the agent needing to look up flags for `download` and `upload`, which likely caused the 1-2 extra turns noted by the judge.

## Change 1: Add flag hints for download/upload in Additional Commands
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: Low
- Justification: Judge gave 4/5 on Flag Usage and Workflow Efficiency, noting the agent likely needed help lookups for `-o` and `--name` flags. Adding brief hints eliminates those extra turns.
- Details: Replace the current file management line:

```
**File management:** `create-doc`, `create-folder`, `delete-doc`, `delete-folder`, `rename`, `move`, `upload`, `download`, `zip`
```

with:

```
**File management:** `create-doc`, `create-folder`, `delete-doc`, `delete-folder`, `rename`, `move`, `upload <project> <local-file> [--name remote.tex]`, `download <project> <path> [-o local.tex]`, `zip`
```

This adds 0 extra lines and gives the agent the two most important flags inline, avoiding help lookups for the most common upload/download patterns.
