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

Interact with Overleaf projects from the command line. All commands output JSON. Run `overleaf help` for the full command list.

## Authentication

If a command fails with "Not authenticated", the user needs to run `overleaf login` (opens Chrome for sign-in). Do not run login preemptively — just start using commands and the CLI will tell you if auth is needed.

## Core Workflow

Always start by getting the project ID, then the file paths:

```bash
overleaf projects
# => {"projects":[{"_id":"abc123","name":"My Paper","accessLevel":"owner"}]}

overleaf files abc123
# => {"entities":[{"path":"/main.tex","type":"doc"},{"path":"/refs.bib","type":"doc"}]}

overleaf read abc123 main.tex --raw
# => plain text content to stdout
```

## Editing Files

**Always prefer targeted `--old`/`--new` edits.** This sends only the changed bytes instead of the entire file, avoiding token waste and reducing the chance of accidental overwrites:

```bash
overleaf edit abc123 main.tex --old "old text to find" --new "replacement text"
# => {"success":true,"path":"main.tex","matched":142,"replaced":18,"inserted":16}
```

The old string must be unique in the file (like Claude Code's Edit tool). If it's not unique, include more surrounding context.

Full file replacement is available as a fallback for rewrites: `overleaf edit abc123 main.tex --content "entire new content"`

## Suggesting Changes (Track Changes)

Use `suggest` instead of `edit` when the user wants reviewable changes. This creates real Overleaf tracked changes (green/red in the editor) that collaborators can accept or reject:

```bash
overleaf suggest abc123 main.tex --old "existing text" --new "proposed replacement"
# => {"success":true,"path":"main.tex","mode":"tracked"}
```

To accept tracked changes programmatically:
```bash
overleaf accept-changes abc123 <doc-id> <change-id1> [change-id2...]
```

## Compiling

```bash
overleaf compile abc123
overleaf pdf abc123 -o paper.pdf
```

## Gotchas

- **Use `--old`/`--new`, not `--content`** for edits. Full replacement risks overwriting concurrent changes and wastes tokens sending the entire file.
- **`create-doc` and `create-folder` auto-resolve the root folder.** Use `--parent <folder-id>` only when creating inside a subfolder.
- **`add-comment` needs an anchor.** Use `--at-text "text to highlight"` (preferred) or `--position <char-offset>`. Example: `overleaf add-comment abc123 main.tex "Fix this typo" --at-text "teh results"`
- **`resolve-thread` and `delete-thread` need the doc ID**, not just the thread ID. Get doc IDs from the project structure via Socket.IO.
- **Socket commands may timeout** if the same Overleaf project is open in a browser tab with an active editor session.

## Additional Commands

Run `overleaf help` or any command with no args to see its usage. Key groups:

**File management:** `create-doc`, `create-folder`, `delete-doc`, `delete-folder`, `rename`, `move`, `upload`, `download`, `zip`

**Search & history:** `search abc123 "keyword"`, `diff abc123 main.tex --from 0 --to 5`, `history`

**Comments:** `threads`, `comment` (reply), `add-comment` (with `--at-text`), `resolve-thread`, `reopen-thread`, `delete-thread`, `edit-comment`, `delete-comment`

**Projects:** `create-project`, `rename-project`

**Other:** `wordcount`, `watch` (streams real-time changes as JSONL)
