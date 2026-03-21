# Proposed Changes

## Summary
The skill lacks a concrete example of the folder creation → folder ID → `create-doc --parent` → `edit` chain, which is the exact workflow the agent failed to demonstrate (Command Selection: 3/5). The gotchas mention `--parent` but never show how to extract and pipe the folder ID.

## Change 1: Add folder-creation workflow example
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add
- Priority: High
- Justification: Command Selection scored 3/5 because the agent never demonstrated the folder ID flow. The judge noted "folder creation, subfolder doc creation with `--parent`, content writing via `edit`, and folder ID piping — was never demonstrated." The skill mentions `--parent` in gotchas but provides no example of the actual chain.
- Details: Add a new section after "## Editing Files" showing the folder ID flow:

```markdown
## Creating Files in Subfolders

Create a folder, capture its ID, then use `--parent` to place a doc inside it:

\`\`\`bash
overleaf create-folder abc123 "sections"
# => {"_id":"fold456","name":"sections"}

overleaf create-doc abc123 conclusion.tex --parent fold456
# => {"_id":"doc789","path":"/sections/conclusion.tex"}

overleaf edit abc123 sections/conclusion.tex --content "\\section{Conclusion}\n..."
\`\`\`

The folder ID from `create-folder` output feeds into `--parent`. Without `--parent`, docs are created in the project root.
```

This is 10 lines. The skill is currently ~75 lines, keeping it well under the 100-line limit. It directly addresses the folder ID piping gap without duplicating existing content.
