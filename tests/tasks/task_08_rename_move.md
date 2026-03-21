# Task 8: Rename and Move Files

## Task Prompt

In my 'Wildfire Modeling Draft' project, create a doc called 'temp.tex', then rename it to 'methods_detail.tex', then create a folder called 'extras' and move methods_detail.tex into it. Show me the final file listing.

## Assertions

```bash
overleaf files $PROJECT | grep -q "extras/methods_detail.tex"
```

## Capabilities Exercised

- Doc creation, renaming, folder creation, moving files, chaining entity IDs
