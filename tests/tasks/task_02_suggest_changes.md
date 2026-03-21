# Task 2: Suggest Tracked Changes

## Task Prompt

I'm working on the 'Wildfire Modeling Draft' project on Overleaf. Can you suggest changing the Methods section to say 'We use a comprehensive automated test suite covering 42 test cases across all CLI commands.' I want to review the change before it's applied.

## Assertions

```bash
# The suggest command creates tracked changes, which modify the doc content
overleaf read $PROJECT main.tex --raw | grep -q "comprehensive automated test suite"
```

## Capabilities Exercised

- Choosing `suggest` over `edit`, tracked changes
