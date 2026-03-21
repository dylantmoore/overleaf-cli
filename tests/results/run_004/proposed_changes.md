# Proposed Changes

## Summary
The agent took 8 turns for a 3-command task because the skill's "Core Workflow" section tells agents to *always* get file paths first, leading to unnecessary `files` and likely `read` calls before `search` (which itself returns paths). A small workflow hint can eliminate these extra steps.

## Change 1: Soften "always get file paths" guidance
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: High
- Justification: Workflow Efficiency scored 3/5 — agent ran ~4 extra commands because "Always start by getting the project ID, then the file paths" implies `files` is mandatory before every operation. For search-based workflows, `search` already returns the file path.
- Details: Replace the Core Workflow intro line:

**Old:**
```
Always start by getting the project ID, then the file paths:
```

**New:**
```
Start by getting the project ID. Use `files` when you need to browse the project structure — but commands like `search` already return file paths, so skip `files` when the path is known or will be discovered:
```

## Change 2: Add search→comment workflow hint to Gotchas
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add (append to Gotchas section)
- Priority: Medium
- Justification: Workflow Efficiency 3/5 and Command Selection 4/5 — the agent didn't realize `search` output feeds directly into `add-comment`, so it ran extra exploratory steps. A one-line hint makes this common pipeline explicit.
- Details: Add this bullet to the end of the Gotchas list:

```
- **`search` results feed directly into `add-comment`.**  The search output includes file paths, so `overleaf search abc123 "keyword"` → `overleaf add-comment abc123 <path> "comment" --at-text "keyword"` needs no intermediate `files` or `read`.
```
