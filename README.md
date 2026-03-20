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

There are two ways to contribute:

### 1. Add or maintain CLI commands

If Overleaf changes their API or you want to add a new command:

- CLI entry point: `bin/overleaf.mjs`
- REST API client: `lib/api.mjs`
- Socket.IO client: `lib/socket.mjs`
- Auth/login: `lib/auth.mjs`

**Important:** Any change to the CLI must also be updated in:
- `.claude-plugin/skills/overleaf.md` (the Claude Code skill)
- The `USAGE` help text in `bin/overleaf.mjs`
- This README

### 2. Improve the Claude Code skill

The skill at `.claude-plugin/skills/overleaf.md` is what tells Claude how to use the CLI. Improving it makes every AI agent better at using the tool. To contribute skill improvements, you should run the eval suite to prove your changes help.

#### Running the eval suite

The eval suite tests whether the skill effectively guides AI agents to use the CLI correctly. It runs independent agents on realistic tasks and measures tokens, time, tool calls, and behavioral correctness.

**Test cases** are in `evals/evals.json`. Each eval has a prompt, expected output, and assertions.

**To run evals:**

1. Snapshot the current skill before making changes:
   ```bash
   cp .claude-plugin/skills/overleaf.md overleaf-workspace/skill-snapshot-old.md
   ```

2. Make your skill changes in `.claude-plugin/skills/overleaf.md`

3. Run A/B test agents — for each eval, spawn two agents (one with old skill, one with new):
   ```
   # With old skill: point agent at the snapshot
   # With new skill: point agent at .claude-plugin/skills/overleaf.md
   ```

4. Compare results on these dimensions:
   - **Behavioral correctness:** Did the agent use the right commands? (e.g., `--old`/`--new` vs `--content`)
   - **Safety:** Did it avoid file corruption or silent overwrites?
   - **Token efficiency:** Fewer tokens = less cost per invocation
   - **Tool calls:** Fewer calls = faster completion

**Results from our benchmarks:**

| Metric | Without Skill | With Skill v1 | With Skill v2 |
|---|---|---|---|
| Avg tokens | 20,690 | 15,089 | 15,041 |
| Avg duration | 188s | 99s | 140s |
| Targeted edit adoption | 0% | 0% | **100%** |
| File corruption incidents | 1 | 0 | 0 |
| Concurrent edit collisions | N/A | 1 (silent) | 0 (caught) |

The v1→v2 improvement came from rewriting the skill to emphasize `--old`/`--new` targeted edits and adding a Gotchas section.

**Previous eval results** are in `overleaf-workspace/iteration-1/` and `overleaf-workspace/iteration-2/` with full transcripts, timing data, and benchmark JSON.

## License

MIT
