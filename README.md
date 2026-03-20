# overleaf-cli

A command-line tool for interacting with [Overleaf](https://www.overleaf.com) projects. Designed for both human use and AI agent automation. All commands output JSON for easy parsing.

Also ships as a **Claude Code plugin** for seamless integration with Claude.

## Install

```bash
git clone https://github.com/dylantmoore/overleaf-cli.git
cd overleaf-cli
npm install
npm link
```

Requires Node.js 18+ and Google Chrome (for login).

### As a Claude Code Plugin

```
/install-plugin https://github.com/dylantmoore/overleaf-cli
```

## Quick Start

```bash
# Sign in (opens Chrome - sign into Overleaf, window closes automatically)
overleaf login

# List your projects
overleaf projects

# Read a file
overleaf read <project-id> main.tex

# Edit a file
overleaf edit <project-id> main.tex --content "\documentclass{article}..."

# Compile and download PDF
overleaf pdf <project-id> -o paper.pdf
```

## Authentication

`overleaf login` opens Chrome to Overleaf's sign-in page. Once you log in, the session is captured automatically. Stored at `~/.config/overleaf-cli/session.json` (mode 0600). Auto-refreshed on each API call.

For headless/CI environments: `overleaf login --cookie "overleaf_session2=s%3A..."`

## Commands

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
| `overleaf edit <id> main.tex --content "..."` | Replace file content |
| `cat new.tex \| overleaf edit <id> main.tex` | Edit via stdin pipe |
| `overleaf suggest <id> main.tex --content "..."` | Preview a suggested edit (diff) |
| `overleaf suggest <id> main.tex --content "..." --apply` | Apply the suggestion |

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
| `overleaf comment <id> <thread-id> "message"` | Reply to a thread |
| `overleaf watch <id>` | Stream real-time changes (JSONL) |
| `overleaf wordcount <id>` | Word count stats |

## How It Works

- **REST API** for project listing, compilation, file management, and downloads
- **Socket.IO v0.9** (Overleaf's real-time protocol) for reading/editing file content
- **Session cookies** for auth, auto-refreshed on each request
- Uses Puppeteer (with system Chrome) for interactive login

## License

MIT
