# Task 6: Upload and Download Files

## Task Prompt

In my 'Wildfire Modeling Draft' Overleaf project, download main.tex to /tmp/overleaf-test-download.tex, then upload it back as 'main_backup.tex'. Verify both files exist in the project afterward.

## Assertions

```bash
test -s /tmp/overleaf-test-download.tex
overleaf files $PROJECT | grep -q "main_backup.tex"
```

## Capabilities Exercised

- File download, file upload with --name
