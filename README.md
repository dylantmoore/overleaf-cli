# overleaf-cli

A command-line tool for interacting with [Overleaf](https://www.overleaf.com) projects. Designed for AI agent automation. All commands output compact JSON.

Also ships as a **Claude Code plugin** for seamless integration with Claude.

## Install

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **Google Chrome** (for interactive login)

### Setup

```bash
git clone https://github.com/dylantmoore/overleaf-cli.git
cd overleaf-cli
npm install
npm link
```

This installs two dependencies: `ws` (WebSocket client for Socket.IO) and `puppeteer-core` (uses your system Chrome for login — no bundled browser download).

### As a Claude Code Plugin

```
/install-plugin https://github.com/dylantmoore/overleaf-cli
```

Or via the `dylantmoore/claude-plugins` marketplace:
```
/plugin install overleaf-cli
```

## Quick Start

```bash
# Sign in (opens Chrome — sign into Overleaf, window closes automatically)
overleaf login

# List your projects
overleaf projects

# Read a file
overleaf read <project-id> main.tex --raw

# Targeted edit (preferred — only sends the changed bytes)
overleaf edit <project-id> main.tex --old "old text" --new "new text"

# Suggest a tracked change (reviewable in Overleaf editor)
overleaf suggest <project-id> main.tex --old "old text" --new "proposed text"

# Compile and download PDF
overleaf pdf <project-id> -o paper.pdf
```

## Authentication

`overleaf login` opens Chrome to Overleaf's sign-in page. Once you log in, the session is captured automatically. Stored at `~/.config/overleaf-cli/session.json` (mode 0600). Auto-refreshed on each API call.

For headless/CI environments: `overleaf login --cookie "overleaf_session2=s%3A..."`

## Commands

Run `overleaf help` for the full list. Key commands:

### Projects

| Command | Description |
|---|---|
| `overleaf projects` | List all projects |
| `overleaf create-project "My Paper"` | Create a new blank project |
| `overleaf rename-project <id> "New Name"` | Rename a project |

### Reading & Editing

| Command | Description |
|---|---|
| `overleaf read <id> main.tex` | Read file content (JSON) |
| `overleaf read <id> main.tex --raw` | Read file content (plain text) |
| `overleaf edit <id> main.tex --old "find" --new "replace"` | Targeted edit (preferred) |
| `overleaf edit <id> main.tex --content "full content"` | Full file replacement (fallback) |
| `overleaf suggest <id> main.tex --old "find" --new "replace"` | Tracked change (accept/reject in editor) |

### File Management

| Command | Description |
|---|---|
| `overleaf files <id>` | List all files |
| `overleaf create-doc <id> chapter2.tex` | Create new doc |
| `overleaf create-folder <id> figures` | Create folder |
| `overleaf delete-doc <id> <doc-id>` | Delete doc |
| `overleaf delete-folder <id> <folder-id>` | Delete folder |
| `overleaf rename <id> <entity-id> new.tex` | Rename file/folder |
| `overleaf move <id> <entity-id> <folder-id>` | Move to folder |
| `overleaf upload <id> ./image.png` | Upload local file |
| `overleaf download <id> main.tex -o main.tex` | Download file |
| `overleaf zip <id> -o project.zip` | Download entire project |

### Compilation

| Command | Description |
|---|---|
| `overleaf compile <id>` | Compile and show status |
| `overleaf pdf <id> -o paper.pdf` | Compile + download PDF |

### Search & History

| Command | Description |
|---|---|
| `overleaf search <id> "keyword"` | Search across all project files |
| `overleaf diff <id> main.tex --from 0 --to 5` | Show file diff between versions |
| `overleaf history <id>` | View version history |

### Collaboration

| Command | Description |
|---|---|
| `overleaf threads <id>` | View comment threads |
| `overleaf add-comment <id> main.tex "note" --at-text "anchor"` | Add anchored comment |
| `overleaf comment <id> <thread-id> "reply"` | Reply to a thread |
| `overleaf suggest <id> main.tex --old "x" --new "y"` | Tracked change (accept/reject in editor) |
| `overleaf accept-changes <id> <doc-id> <change-ids...>` | Accept tracked changes |
| `overleaf resolve-thread <id> <doc-id> <thread-id>` | Resolve a thread |
| `overleaf watch <id>` | Stream real-time changes (JSONL) |
| `overleaf wordcount <id>` | Word count stats |

## How It Works

- **REST API** for project listing, compilation, file management, and downloads
- **Socket.IO v0.9** (Overleaf's real-time OT protocol) for reading/editing file content
- **Track changes** via OT `meta.tc` for suggest command
- **Session cookies** for auth, auto-refreshed on each request
- **Puppeteer-core** (system Chrome) for interactive login

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add commands, fix bugs, or improve the Claude Code skill (includes eval suite documentation).

## License

MIT
