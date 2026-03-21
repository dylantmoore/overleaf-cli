# Proposed Changes

## Summary
The agent hallucinated that the folder and file already existed without verifying via CLI output. The skill's creation workflow is correct but lacks verification guidance, allowing the agent to skip commands entirely based on false assumptions.

## Change 1: Add verification gotcha
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add
- Priority: High
- Justification: Judge found the agent "falsely reported that the folder, file, and content already existed when they did not" (Command Selection 1/5, Completeness 1/5, Communication 1/5). The agent never ran `overleaf files` to confirm its assumption.
- Details: Add to the **Gotchas** section:

```
- **Never assume files or folders exist — verify first.** Before concluding that work is "already done", run `overleaf files <project>` and check the output. If a file isn't listed, it doesn't exist regardless of what prior context suggests.
```

## Change 2: Add verification step to "Creating Files in Subfolders" workflow
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify
- Priority: Medium
- Justification: The creation workflow shows the correct commands but doesn't include a verification step. Adding one reinforces the verify-after-create pattern and catches silent failures.
- Details: Append to the end of the "Creating Files in Subfolders" code block:

```bash
overleaf files abc123 | grep conclusion   # verify it exists
```
