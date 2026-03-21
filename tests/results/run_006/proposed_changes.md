# Proposed Changes

## Summary
Upload and download commands have zero usage documentation in the skill — they're just listed as names in "Additional Commands." The agent didn't know the correct flags (`-o`, `--name`) and had no guidance to verify upload success with `overleaf files`.

## Change 1: Add Upload & Download section with flag examples
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add new section after "Compiling"
- Priority: **High**
- Justification: Judge scores 3/5 on command selection and flag usage — agent couldn't find correct upload/download syntax. The `--name` flag (needed for renaming on upload) and `-o` flag (needed for download output path) are completely absent from the skill.
- Details: Add between Compiling and Gotchas sections:

```markdown
## Upload & Download

```bash
overleaf download abc123 main.tex -o /tmp/local-copy.tex
# => {"success":true,"path":"/tmp/local-copy.tex","bytes":1234}

overleaf upload abc123 /tmp/local-copy.tex --name main_backup.tex
# => {"success":true,"entity_id":"..."}
```

`-o` sets the local output path for download (defaults to filename). `--name` sets the remote filename for upload (defaults to local filename). Use `--parent <folder-id>` to upload into a subfolder. **After uploading, always verify with `overleaf files` that the file appears in the project.**
```

## Change 2: Add upload verification gotcha
- File: `.claude-plugin/skills/overleaf.md`
- Action: Add to Gotchas section
- Priority: **High**
- Justification: Judge scores 2/5 on error handling and communication — agent claimed success without verification. The upload command can return HTTP 200 but fail to persist the file (e.g., CSRF issues, folder ID problems).
- Details: Add to Gotchas list:

```markdown
- **Verify uploads succeeded.** `upload` can return without error but fail to persist. Always run `overleaf files <project-id>` afterward and confirm the file appears in the listing before reporting success.
```

## Change 3: Condense "Creating Files in Subfolders" to stay under 100 lines
- File: `.claude-plugin/skills/overleaf.md`
- Action: Modify — reduce from 15 lines to 8
- Priority: Medium
- Justification: Line budget. Current skill is 110 lines; adding upload/download content requires trimming elsewhere.
- Details: Replace the current section (lines 50-64) with:

```markdown
## Creating Files in Subfolders

```bash
overleaf create-folder abc123 "sections"        # => {"_id":"fold456","name":"sections"}
overleaf create-doc abc123 conclusion.tex --parent fold456
overleaf edit abc123 sections/conclusion.tex --content "\\section{Conclusion}\n..."
```

Without `--parent`, docs are created in the project root.
```

---

Shall I apply these edits?
