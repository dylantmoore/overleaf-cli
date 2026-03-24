# Session Notes — 2026-03-24

## What was built

Built overleaf-cli from scratch in one session: a Node.js CLI tool + Claude Code plugin for interacting with Overleaf LaTeX projects. 28 commands covering reading, editing, compiling, file management, search, comments, track changes, and real-time watching.

## Key technical discoveries

- **Overleaf has no public API.** Everything was reverse-engineered from browser network traffic using Chrome DevTools MCP.
- **Socket.IO v0.9** is used for real-time operations (read, edit, suggest, comments). REST handles everything else.
- **Track changes** are just normal OT ops with `meta.tc` added — an 18-char hex seed generated client-side.
- **GCLB cookie** (Google Cloud load balancer) is required for Socket.IO but not REST. Easy to lose during cookie refresh.
- **File uploads** need `name` form field (not `qqfilename`), and `folder_id` as a URL query param (not form field).

## Skill development process

1. Started with a flat skill doc listing all commands
2. Skill-creator best practices review identified: missing gotchas section, no progressive disclosure, no output format examples
3. A/B tested old vs new skill — new skill achieved 100% targeted --old/--new adoption (0% in v1)
4. Evidence-based judging (assertions + verification + LLM) replaced pure subjective transcript scoring

## Test infrastructure evolution

1. Started with ad-hoc subagent spawning (worked but not reproducible)
2. Restructured to match stata-skill pattern: shell scripts, task files, rubric
3. Discovered `stream-json` output format doesn't work — use `json`
4. Skill injection in prompt caused test agents to run `overleaf login` (opening unwanted browser windows)
5. Removed skill injection — let it trigger naturally from installed plugins
6. Added assertions (shell commands checking actual Overleaf state) to judge
7. Found project name extraction bug: `grep -P` doesn't exist on macOS, `sed` matched "Don't" instead of project name
8. Final: assertions pass 13/14, evidence-based LLM judge scores grounded in real state

## Lessons learned

- **Test the test infrastructure** — we went through 5 iterations of fixing the judge before it worked correctly
- **Evidence > transcripts** — the LLM judge was useless until we fed it assertion results and actual Overleaf state
- **Skill descriptions matter** — the single change of emphasizing --old/--new in the skill changed agent behavior from 0% to 100% adoption
- **Don't say "run login"** in a skill doc — agents take it literally even when already authenticated
- **Natural project names in tests** — "CLI Test Complete" biased the agent toward knowing which tool to use
- **macOS != Linux** — grep -P, stream-json, and other assumptions broke on macOS
