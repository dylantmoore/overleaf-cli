---
name: overleaf
description: >
  Interact with Overleaf LaTeX projects via the `overleaf` CLI — read, edit, compile, suggest
  changes, manage files, search, and collaborate. Use this skill whenever the user mentions
  Overleaf, LaTeX projects, compiling LaTeX to PDF, or collaborative academic writing. Also
  trigger when the user refers to "my paper", "my thesis", "my manuscript", "my draft",
  "my writeup", "my dissertation", or discusses co-authoring, tracked changes, or BibTeX
  in the context of an online LaTeX editor. Even if the user doesn't say "Overleaf" explicitly,
  use this skill if they're working with .tex files hosted online or mention needing to compile
  and download a PDF of their document.
---

# Overleaf CLI

Interact with Overleaf projects from the command line. All commands output JSON to stdout. Run `overleaf help` for the full command list with all flags.

## Authentication

Run `overleaf login` once — opens Chrome, user signs in, session is captured automatically.

## Core Workflow

Always start by getting the project ID, then the file paths:

```bash
overleaf projects
# => { "projects": [{ "_id": "abc123", "name": "My Paper", "accessLevel": "owner" }] }

overleaf files abc123
# => { "entities": [{ "path": "/main.tex", "type": "doc" }, { "path": "/refs.bib", "type": "doc" }] }

overleaf read abc123 main.tex
# => { "path": "main.tex", "content": "\\documentclass{article}\\n..." }

overleaf read abc123 main.tex --raw
# => plain text content directly to stdout
```

To edit a file, read it first (edit does a full replacement — you need the current content to make surgical changes):

```bash
overleaf edit abc123 main.tex --content "full new content here"
echo "content" | overleaf edit abc123 main.tex    # or pipe via stdin
```

Compile and get the PDF:

```bash
overleaf compile abc123
# => { "status": "success", "pdfSize": 49172, "compileTime": 583 }

overleaf pdf abc123 -o paper.pdf
# => { "success": true, "path": "paper.pdf", "bytes": 49172 }
```

## Suggesting Changes (Track Changes)

Use `suggest` instead of `edit` when the user wants reviewable changes rather than a silent overwrite. This creates real Overleaf tracked changes — green/red insertions/deletions that collaborators can accept or reject in the editor:

```bash
overleaf suggest abc123 main.tex --content "proposed new content"
# => { "success": true, "mode": "tracked", "message": "Changes submitted as tracked changes..." }
```

To accept tracked changes programmatically:

```bash
overleaf accept-changes abc123 <doc-id> <change-id1> [change-id2...]
```

## Additional Commands

Run `overleaf help` or any command with no args to see its usage. Key groups:

**File management:** `create-doc`, `create-folder`, `delete-doc`, `delete-folder`, `rename`, `move`, `upload`, `download`, `zip`

**Search & history:** `search abc123 "keyword"`, `diff abc123 main.tex --from 0 --to 5`, `history`

**Comments:** `threads`, `comment` (reply), `add-comment` (anchored at `--position`), `resolve-thread`, `reopen-thread`, `delete-thread`, `edit-comment`, `delete-comment`

**Projects:** `create-project`, `rename-project`

**Other:** `wordcount`, `watch` (streams real-time changes as JSONL)
