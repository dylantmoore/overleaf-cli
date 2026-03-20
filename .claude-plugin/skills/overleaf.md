---
name: overleaf
description: >
  Interact with Overleaf LaTeX projects via the `overleaf` CLI. Use this skill when the user
  mentions Overleaf, LaTeX projects on Overleaf, wants to read/edit/compile .tex files on Overleaf,
  manage Overleaf project files, or download PDFs from Overleaf. Also trigger when the user says
  "my paper", "my thesis", "my manuscript" in contexts where they have Overleaf projects.
---

# Overleaf CLI

The `overleaf` command-line tool lets you interact with Overleaf projects. All commands output JSON. Run `overleaf help` for the full command list.

## Authentication

Run `overleaf login` once to authenticate via browser. Session auto-refreshes.

## Core Workflow

```bash
overleaf projects                                    # List projects, get IDs
overleaf files <project-id>                          # See file tree
overleaf read <project-id> main.tex                  # Read file (JSON)
overleaf read <project-id> main.tex --raw            # Read file (plain text)
overleaf edit <project-id> main.tex --content "..."  # Replace file content
overleaf compile <project-id>                        # Compile, get status
overleaf pdf <project-id> -o paper.pdf               # Download compiled PDF
```

Start with `overleaf projects` to get the project ID, then `overleaf files` to see paths.

## Suggesting Changes (Track Changes)

`suggest` creates real Overleaf tracked changes with accept/reject in the editor UI:

```bash
overleaf suggest <project-id> main.tex --content "proposed new content"
```

To accept programmatically (change IDs come from `overleaf read` ranges or the Overleaf UI):

```bash
overleaf accept-changes <project-id> <doc-id> <change-id1> [change-id2...]
```

## Additional Commands

Run `overleaf help` or `overleaf <command>` with no args to see usage for any command. Key groups:

**File management:** `create-doc`, `create-folder`, `delete-doc`, `delete-folder`, `rename`, `move`, `upload`, `download`, `zip`

**Search & history:** `search <project-id> "query"`, `diff <project-id> <path> --from <v> --to <v>`, `history`

**Comments:** `threads`, `comment` (reply), `add-comment` (anchored, needs `--position`), `resolve-thread`, `reopen-thread`, `delete-thread`, `edit-comment`, `delete-comment`

**Projects:** `create-project`, `rename-project`

**Other:** `wordcount`, `watch` (real-time JSONL stream)
