# Task 9: Full Comment Thread Lifecycle

## Task Prompt

In my 'Wildfire Modeling Draft' project on main.tex: add a comment anchored at the word "Results" saying "This section needs data tables", then reply to that thread with "I'll add them next week", then resolve the thread. Show me the threads at each step.

## Assertions

```bash
overleaf threads $PROJECT | grep -q "data tables"
overleaf threads $PROJECT | grep -q "add them next week"
overleaf threads $PROJECT | grep -q "resolved"
```

## Capabilities Exercised

- Anchored comments, replying, resolving threads, chaining IDs
