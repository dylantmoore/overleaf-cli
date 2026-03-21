# Overleaf CLI Skill Coverage Map

Capabilities exposed by the CLI, grouped by category. Used to design test tasks that span skill coverage.

## Core Operations (always in skill body)

| Command | Capabilities |
|---------|-------------|
| `projects` | List projects, get IDs |
| `files` | List file tree with paths and types |
| `read` | Read file content (JSON or `--raw` plain text) |
| `edit` | Targeted `--old`/`--new` replacement, or full `--content` |
| `suggest` | Tracked changes via `--old`/`--new` or `--content` |
| `compile` | Compile LaTeX, get status and PDF URL |
| `pdf` | Compile + download PDF |

## File Management (in "Additional Commands" section)

| Command | Capabilities |
|---------|-------------|
| `create-doc` | Create new doc, `--parent` for subfolder |
| `create-folder` | Create folder (auto-resolves root) |
| `delete-doc` | Delete by doc ID |
| `delete-folder` | Delete by folder ID |
| `rename` | Rename entity, `--type doc\|file\|folder` |
| `move` | Move entity to folder ID |
| `upload` | Upload local file, `--name` for remote name |
| `download` | Download single file |
| `zip` | Download entire project as zip |

## Search & History

| Command | Capabilities |
|---------|-------------|
| `search` | Grep across all project files |
| `diff` | Version diff with `--from`/`--to` |
| `history` | Version history with user deduplication |

## Collaboration

| Command | Capabilities |
|---------|-------------|
| `threads` | List comment threads |
| `add-comment` | Anchored comment with `--at-text` or `--position` |
| `comment` | Reply to existing thread |
| `edit-comment` | Edit a message |
| `delete-comment` | Delete a message |
| `resolve-thread` | Resolve (needs doc ID) |
| `reopen-thread` | Reopen (needs doc ID) |
| `delete-thread` | Delete thread (needs doc ID) |
| `accept-changes` | Accept tracked changes by change ID |

## Project Management

| Command | Capabilities |
|---------|-------------|
| `create-project` | Create new blank project |
| `rename-project` | Rename a project |

## Gotchas (in skill body)

- Use `--old`/`--new` not `--content` for edits (avoids concurrent edit collisions)
- `create-doc` and `create-folder` auto-resolve root folder; use `--parent` only for subfolders
- `add-comment` needs `--at-text "anchor"` or `--position <offset>`
- `resolve-thread` and `delete-thread` need doc ID, not just thread ID
- Socket commands may timeout if browser has the project open
