# Task 4: Search and Add Comment

## Task Prompt

Search my 'Wildfire Modeling Draft' project for the word 'automated' and add a comment at that location saying 'Consider expanding on the automation methodology'

## Assertions

```bash
overleaf threads $PROJECT | grep -q "automation methodology"
```

## Capabilities Exercised

- Search, anchored comments
