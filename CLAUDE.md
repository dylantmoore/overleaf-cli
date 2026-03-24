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

- Compact JSON output to stdout by default (`--pretty` for humans)
- Errors go to stderr as JSON (preserves Unix pipe semantics)
- Targeted `--old`/`--new` edits preferred over full `--content` replacement
- File reads/edits use Socket.IO (live content), not REST blob API
- `suggest` uses Overleaf's real track changes (`meta.tc` on OT ops)
- Session cookie auto-refreshes and persists to `~/.config/overleaf-cli/session.json` (mode 0600)
- GCLB load balancer cookie must be preserved alongside session cookie (required for Socket.IO)

## Testing

Test infrastructure is in `tests/`. See `tests/README.md` for full docs.

**Run tests:** `./tests/scripts/run_all.sh` (or `--dry-run` to list tasks)
**Full pipeline:** `./tests/scripts/run_pipeline.sh tests/tasks/task_01_read_and_edit.md`

The judge uses evidence-based evaluation:
1. Assertions — shell commands that check actual Overleaf state (pass/fail)
2. Verification — captures current project files and threads
3. LLM judge — scores rubric grounded in assertion results and verification output

**Known gotchas in test infra:**
- Use `--output-format json`, NOT `stream-json` (stream-json produces empty files)
- Don't inject the skill into the test prompt — let it trigger naturally from installed plugins
- Project name extraction uses `grep -o "'[A-Z][^']*'"` — do NOT use `grep -P` (unavailable on macOS) or `sed` (breaks on apostrophes like "Don't")
- Test project is "Wildfire Modeling Draft" on Overleaf (disposable, safe to modify)

## Session Notes

See `notes/` for dated session logs with technical discoveries and lessons learned.
