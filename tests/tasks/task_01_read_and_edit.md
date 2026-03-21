# Task 1: Read and Targeted Edit

## Task Prompt

I have an Overleaf project called 'Wildfire Modeling Draft'. Can you read the main.tex file, find the Introduction section, and change the text there to say 'This document was edited by an AI agent as part of automated testing.' Don't change anything else.

## Assertions

```bash
overleaf read $PROJECT main.tex --raw | grep -q "edited by an AI agent as part of automated testing"
```

## Capabilities Exercised

- Project lookup, file reading, targeted editing
