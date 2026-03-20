---
name: overleaf
description: >
  Interact with Overleaf LaTeX projects via the `overleaf` CLI. Use this skill when the user
  mentions Overleaf, LaTeX projects on Overleaf, wants to read/edit/compile .tex files on Overleaf,
  manage Overleaf project files, or download PDFs from Overleaf. Also trigger when the user says
  "my paper", "my thesis", "my manuscript" in contexts where they have Overleaf projects.
---

# Overleaf CLI

The `overleaf` command-line tool lets you interact with Overleaf projects. All commands output JSON.

## Authentication

The user must run `overleaf login` once to authenticate via browser. Session is stored at `~/.config/overleaf-cli/session.json` and auto-refreshes.

## Quick Reference

### List projects
```bash
overleaf projects
```
Returns `{ "projects": [{ "_id": "...", "name": "...", "accessLevel": "..." }] }`

### List files in a project
```bash
overleaf files <project-id>
```

### Read a file (live content via Socket.IO)
```bash
overleaf read <project-id> <path>         # JSON output
overleaf read <project-id> <path> --raw   # Plain text
```

### Edit a file
```bash
overleaf edit <project-id> <path> --content "new LaTeX content"
echo "content" | overleaf edit <project-id> <path>
```

### Suggest an edit (preview without applying)
```bash
overleaf suggest <project-id> <path> --content "proposed content"
overleaf suggest <project-id> <path> --content "proposed content" --apply  # apply it
```

### Compile and download PDF
```bash
overleaf compile <project-id>                    # Compile, get status
overleaf pdf <project-id> -o paper.pdf           # Compile + download PDF
```

### File management
```bash
overleaf create-doc <project-id> <name>          # Create new .tex file
overleaf create-folder <project-id> <name>       # Create folder
overleaf delete-doc <project-id> <doc-id>        # Delete file
overleaf rename <project-id> <entity-id> <name>  # Rename
overleaf move <project-id> <entity-id> <folder-id>  # Move
overleaf upload <project-id> <local-path>        # Upload file
overleaf download <project-id> <path> -o <file>  # Download file
overleaf zip <project-id> -o project.zip         # Download entire project
```

### Search across project
```bash
overleaf search <project-id> "query string"
```

### Version history and diff
```bash
overleaf history <project-id>
overleaf diff <project-id> <path> --from 0 --to 5
```

### Comments and collaboration
```bash
overleaf threads <project-id>                    # View comment threads
overleaf comment <project-id> <thread-id> <text> # Reply to thread
overleaf add-comment <project-id> <path> <text> --position <offset>  # Create anchored comment
overleaf resolve-thread <project-id> <doc-id> <thread-id>   # Resolve a thread
overleaf reopen-thread <project-id> <doc-id> <thread-id>    # Reopen a thread
overleaf delete-thread <project-id> <doc-id> <thread-id>    # Delete a thread
overleaf edit-comment <project-id> <thread-id> <message-id> <text>  # Edit a message
overleaf delete-comment <project-id> <thread-id> <message-id>       # Delete a message
```

### Other
```bash
overleaf wordcount <project-id>
overleaf watch <project-id>                      # Stream real-time changes (JSONL)
```

## Workflow Tips

1. **Always start with `overleaf projects`** to get the project ID
2. **Use `overleaf files <id>`** to see the file structure before reading/editing
3. **Use `overleaf read` before `overleaf edit`** to see current content
4. **Use `overleaf suggest` for review workflows** — show the diff first, then `--apply`
5. **Pipe content** for complex edits: generate LaTeX, then pipe to `overleaf edit`
6. **Compile after editing** to verify changes don't break the build
