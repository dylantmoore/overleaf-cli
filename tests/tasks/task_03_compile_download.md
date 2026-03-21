# Task 3: Compile and Download PDF

## Task Prompt

Can you compile my Overleaf project 'Wildfire Modeling Draft' and download the PDF to /tmp/test-output.pdf? Also tell me the word count.

## Assertions

```bash
test -s /tmp/test-output.pdf
```

## Capabilities Exercised

- Compilation, PDF download, word count
