# Contributing

There are two ways to contribute to overleaf-cli:

## 1. Add or maintain CLI commands

If Overleaf changes their API, a command breaks, or you want to add a new command:

**Code layout:**
- `bin/overleaf.mjs` — CLI entry point, command routing, arg parsing
- `lib/api.mjs` — REST API client
- `lib/socket.mjs` — Socket.IO v0.9 client (read, edit, suggest, comments)
- `lib/auth.mjs` — Session management, interactive login

**Important:** Any change to the CLI must also be updated in all three of these:
- `.claude-plugin/skills/overleaf.md` (the Claude Code skill)
- The `USAGE` help text in `bin/overleaf.mjs`
- `README.md`

**Testing your changes:** Create a disposable Overleaf project and test every command you touched. The full coverage test (30 commands) is documented in `overleaf-workspace/iteration-2/full-coverage/transcript.md` as a reference for what a successful run looks like.

## 2. Improve the Claude Code skill

The skill at `.claude-plugin/skills/overleaf.md` is what tells Claude how and when to use the CLI. Improving it makes every AI agent better at using the tool. **To contribute skill improvements, you need to run the eval suite to prove your changes actually help.**

### How the eval suite works

The eval suite tests whether the skill effectively guides AI agents to use the CLI correctly. It runs independent agents on realistic tasks and compares behavior, token cost, and correctness.

**Test cases** are in `evals/evals.json`. Each has a prompt, expected output, and behavioral assertions.

### Running an A/B test

1. **Snapshot the current skill** before making changes:
   ```bash
   cp .claude-plugin/skills/overleaf.md overleaf-workspace/skill-snapshot-old.md
   ```

2. **Make your skill changes** in `.claude-plugin/skills/overleaf.md`

3. **Run A/B test agents.** For each eval in `evals/evals.json`, spawn two independent Claude Code subagents:
   - **Old skill agent:** reads the snapshot at `overleaf-workspace/skill-snapshot-old.md`
   - **New skill agent:** reads `.claude-plugin/skills/overleaf.md`

   Both agents get the same task prompt and save transcripts to `overleaf-workspace/iteration-N/eval-<name>/{old_skill,new_skill}/outputs/transcript.md`.

4. **Compare results** on these dimensions:
   - **Behavioral correctness:** Did the agent use the right commands? (e.g., targeted `--old`/`--new` vs full `--content` replacement)
   - **Safety:** Did it avoid file corruption or silent overwrites?
   - **Token efficiency:** Fewer tokens = less cost per invocation
   - **Tool calls:** Fewer calls = faster completion

5. **Save timing data** from each agent's task notification (`total_tokens`, `duration_ms`, `tool_uses`) into `timing.json` in each run directory.

6. **Write a benchmark.json** summarizing the comparison. See `overleaf-workspace/iteration-2/benchmark.json` for the format.

### What we measure

| Metric | Why it matters |
|---|---|
| Targeted edit adoption | Agents using `--old`/`--new` instead of `--content` means the skill is guiding them correctly |
| File corruption / silent overwrites | Full `--content` replacement can overwrite concurrent edits; targeted edits catch conflicts |
| Token count | Lower = cheaper to run at scale |
| Tool calls | Fewer = faster task completion |
| Error recovery | Did the agent handle errors gracefully or spiral? |

### Benchmark history

| Metric | No Skill | Skill v1 | Skill v2 |
|---|---|---|---|
| Avg tokens | 20,690 | 15,089 | 15,041 |
| Avg duration | 188s | 99s | 140s |
| Targeted edit adoption | 0% | 0% | **100%** |
| File corruption incidents | 1 | 0 | 0 |
| Concurrent edit collisions | N/A | 1 (silent) | 0 (caught) |

The v1 to v2 improvement came from rewriting the skill to emphasize `--old`/`--new` targeted edits and adding a Gotchas section.

**Previous eval results** with full transcripts, timing, and benchmarks are in `overleaf-workspace/iteration-1/` and `overleaf-workspace/iteration-2/`.
