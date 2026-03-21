# Proposed Changes

## Summary
The only weak score is Workflow Efficiency (3/5) — 15 turns for a 3-command pipeline. The skill's Compiling section is too terse and doesn't show the compile→pdf→wordcount sequence as a cohesive pipeline, likely causing the agent to explore rather than execute directly.

## Change 1: Expand Compiling section into a sequenced pipeline

- **File:** `.claude-plugin/skills/overleaf.md`
- **Action:** Modify
- **Priority:** Medium
- **Justification:** Workflow Efficiency 3/5 — "the optimal path would be ~7-8 commands" but agent took 15 turns. Showing the compile/pdf/wordcount sequence as a clear pipeline gives the agent a direct execution plan.
- **Details:**

Replace:
```markdown
## Compiling

```bash
overleaf compile abc123
overleaf pdf abc123 -o paper.pdf
```
```

With:
```markdown
## Compiling & PDF Download

Compile first, then download. `pdf` only works after a successful `compile`:

```bash
overleaf compile abc123
# => {"status":"success","compileTime":329}

overleaf pdf abc123 -o paper.pdf
# => saves PDF to disk

overleaf wordcount abc123
# => {"texcount":{"textWords":150,"headWords":12,"headers":5,...}}
```

Run these sequentially — don't attempt `pdf` until `compile` returns success.
```

This adds ~3 net lines (well within the 100-line budget) and directly addresses the judge's efficiency finding by making the optimal command sequence explicit. The other six scores are all 4+ and don't warrant skill changes.
