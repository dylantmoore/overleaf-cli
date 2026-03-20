# Transcript: Compile, Download PDF, and Word Count for 'CLI Test Complete'

## Step 1: List projects to find the project ID

**Command:**
```bash
overleaf projects
```

**Output:**
```json
{"projects":[{"_id":"696e6ecf94ce67c00134217e","name":"test","accessLevel":"owner"},{"_id":"69bd6a92cbcd2126236dfc6e","name":"CLI Test Complete","accessLevel":"owner"},{"_id":"699cbfd4ce3f377f3b61b929","name":"Wildfire Plan","accessLevel":"readWrite"}]}
```

**Result:** Found project "CLI Test Complete" with ID `69bd6a92cbcd2126236dfc6e`.

---

## Step 2: Compile the project

**Command:**
```bash
overleaf compile 69bd6a92cbcd2126236dfc6e
```

**Output:**
```json
{"status":"success","pdfUrl":"/project/69bd6a92cbcd2126236dfc6e/user/696e6ea87224723a80295118/build/19d0cd10ded-c0c073bf06c2718a/output/output.pdf","pdfSize":50021,"compileTime":375}
```

**Result:** Compilation succeeded. PDF size: 50,021 bytes. Compile time: 375 ms.

---

## Step 3: Get word count

**Command:**
```bash
overleaf wordcount 69bd6a92cbcd2126236dfc6e
```

**Output:**
```json
{"texcount":{"encode":"ascii","textWords":20,"headWords":6,"outside":0,"headers":4,"elements":0,"mathInline":0,"mathDisplay":0,"errors":0,"messages":""}}
```

**Result:** Word count summary:
- Text words: 20
- Heading words: 6
- Headers: 4
- Math inline: 0
- Math display: 0
- Errors: 0

---

## Step 4: Download the PDF

**Command:**
```bash
overleaf pdf 69bd6a92cbcd2126236dfc6e -o /tmp/test-output.pdf
```

**Output:**
```json
{"success":true,"path":"/tmp/test-output.pdf","bytes":50021}
```

**Result:** PDF downloaded to `/tmp/test-output.pdf` (50,021 bytes).

---

## Step 5: Verify the downloaded file

**Command:**
```bash
ls -la /tmp/test-output.pdf
```

**Output:**
```
-rw-r--r--  1 dylantmoore  wheel  50021 Mar 20 09:55 /tmp/test-output.pdf
```

**Result:** File confirmed on disk at expected size.
