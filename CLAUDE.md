# overleaf-cli

## Important

**Any change to the CLI (new commands, changed flags, updated behavior) MUST also be reflected in:**
1. `.claude-plugin/skills/overleaf.md` — the Claude Code skill doc
2. `bin/overleaf.mjs` USAGE help text — the `overleaf help` output
3. `README.md` — the user-facing documentation

All three must stay in sync. If you add a command, update all three. If you change a flag, update all three.

## Architecture

- `bin/overleaf.mjs` — CLI entry point, command routing, arg parsing
- `lib/api.mjs` — REST API client (projects, compile, threads, track changes)
- `lib/socket.mjs` — Socket.IO v0.9 client (read, edit, suggest, comments, watch)
- `lib/auth.mjs` — Session management, interactive login via Puppeteer

## Key Design Decisions

- All commands output JSON to stdout for AI agent parsing
- Errors go to stderr as JSON (preserves Unix pipe semantics)
- File reads/edits use Socket.IO (live content), not REST blob API
- `suggest` uses Overleaf's real track changes (`meta.tc` on OT ops)
- Session cookie auto-refreshes and persists to `~/.config/overleaf-cli/session.json` (mode 0600)
- GCLB load balancer cookie must be preserved alongside session cookie (required for Socket.IO)

## Testing

Test against a disposable Overleaf project. The test suite covers: projects, files, read, edit, suggest, create-doc, delete-doc, create-folder, delete-folder, rename, move, upload, download, compile, pdf, zip, search, diff, history, threads, add-comment, comment, edit-comment, delete-comment, resolve-thread, reopen-thread, delete-thread, accept-changes, wordcount, watch, error cases.
