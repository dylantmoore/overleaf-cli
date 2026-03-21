# Overleaf CLI Skill Rubric

Score each category 1-5 based on the agent's response.

## Categories

### 1. Command Selection (PRIMARY, 2x weight)
Did the agent pick the right `overleaf` command for the task?

- 5: Perfect command choice, no unnecessary commands
- 4: Correct command, maybe one extra exploratory call
- 3: Got there eventually but tried wrong commands first
- 2: Used a suboptimal command (e.g., `edit --content` when `--old`/`--new` was appropriate)
- 1: Used completely wrong command or couldn't figure it out

### 2. Flag & Option Usage (PRIMARY, 2x weight)
Did the agent use the correct flags and options?

- 5: All flags correct, used targeted `--old`/`--new` where appropriate
- 4: Correct flags, minor inefficiency (e.g., `--content` when `--old`/`--new` would work)
- 3: Some flag issues but task completed
- 2: Wrong flags caused errors that required retries
- 1: Couldn't figure out the right flags

### 3. Safety & Correctness (PRIMARY, 2x weight)
Did the agent avoid file corruption, silent overwrites, and handle conflicts gracefully?

- 5: Used targeted edits, checked for conflicts, no data loss
- 4: Task completed correctly, no corruption
- 3: Minor issues but no data loss
- 2: Caused a silent overwrite or needed to restore content
- 1: Corrupted file content or lost data

### 4. Workflow Efficiency (PRIMARY, 2x weight)
Did the agent follow an efficient workflow (minimal commands, no wasted calls)?

- 5: Optimal path — minimum commands needed
- 4: Near-optimal, one unnecessary command
- 3: Some wasted calls but reasonable
- 2: Significant wasted work (e.g., reading help repeatedly)
- 1: Spiraled with many failed attempts

### 5. Error Handling (SECONDARY, 1x weight)
Did the agent handle errors gracefully when they occurred?

- 5: Errors caught and recovered cleanly, or no errors
- 4: Minor error, quick recovery
- 3: Error required some fumbling to resolve
- 2: Error caused significant wasted work
- 1: Error was not recovered from

### 6. Completeness (SECONDARY, 1x weight)
Did the agent address all parts of the request?

- 5: All parts addressed fully
- 4: All parts addressed, minor omission
- 3: Most parts addressed
- 2: Significant parts missing
- 1: Task barely attempted

### 7. Communication (SECONDARY, 1x weight)
Did the agent explain what it did and what the user should expect?

- 5: Clear, concise explanation of actions and results
- 4: Adequate explanation
- 3: Minimal explanation
- 2: Confusing or misleading explanation
- 1: No explanation

## Scoring Formula

**Weighted total** = (sum of PRIMARY scores) x 2 + (sum of SECONDARY scores)

Maximum: (4 x 5) x 2 + (3 x 5) = 55
