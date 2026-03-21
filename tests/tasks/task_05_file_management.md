# Task 5: File Management

## Task Prompt

In my 'Wildfire Modeling Draft' project, create a new folder called 'sections', then create a new file called 'conclusion.tex' inside it, and write a simple LaTeX conclusion section in it.

## Assertions

```bash
overleaf files $PROJECT | grep -q "sections/conclusion.tex"
overleaf read $PROJECT sections/conclusion.tex --raw | grep -q "\\\\section"
```

## Capabilities Exercised

- Folder creation, doc creation in subfolder, writing content
