#!/usr/bin/env node

import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { basename, join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { getSession, saveSession, requireSession, interactiveLogin } from '../lib/auth.mjs';
import { OverleafAPI } from '../lib/api.mjs';
import { OverleafSocket, buildReplaceOps } from '../lib/socket.mjs';

function normalizePath(p) {
  return p.startsWith('/') ? p : '/' + p;
}

const USAGE = `overleaf - CLI tool for interacting with Overleaf

USAGE:
  overleaf <command> [options]

COMMANDS:
  login                                     Sign in via browser (or --cookie)
  projects                                  List all projects
  create-project <name>                     Create a new blank project
  rename-project <project-id> <new-name>    Rename a project
  files <project-id>                        List files in a project
  read <project-id> <path>                  Read file content (live via Socket.IO)
  edit <project-id> <path>                  Edit a file (stdin or --content)
  suggest <project-id> <path>               Suggest an edit (tracked changes in editor)
  create-doc <project-id> <name>            Create a new document
  delete-doc <project-id> <doc-id>          Delete a document
  create-folder <project-id> <name>         Create a new folder
  delete-folder <project-id> <folder-id>    Delete a folder
  rename <project-id> <entity-id> <name>    Rename a file or folder
  move <project-id> <entity-id> <folder-id> Move a file to a folder
  upload <project-id> <local-path>          Upload a file to project
  download <project-id> <path> -o <file>    Download a single file
  compile <project-id>                      Compile project
  pdf <project-id> -o <file>                Download compiled PDF
  zip <project-id> -o <file>                Download project as zip
  threads <project-id>                      View comment threads
  comment <project-id> <thread-id> <text>   Reply to a thread
  add-comment <project-id> <path> <text>    Create a new anchored comment
  resolve-thread <project-id> <doc-id> <thread-id>   Resolve a thread
  reopen-thread <project-id> <doc-id> <thread-id>    Reopen a thread
  delete-thread <project-id> <doc-id> <thread-id>    Delete a thread
  edit-comment <project-id> <thread-id> <message-id> <text>  Edit a message
  delete-comment <project-id> <thread-id> <message-id>       Delete a message
  accept-changes <project-id> <doc-id> <change-ids...>      Accept tracked changes
  diff <project-id> <path>                  Show file diff between versions
  search <project-id> <query>               Search across all project files
  watch <project-id>                        Stream real-time changes (JSONL)
  history <project-id>                      View version history
  wordcount <project-id>                    Get word count

OPTIONS:
  --raw               Raw content output (for read)
  -o <file>           Output file path
  --content <text>    Inline content (for edit/suggest)
  --parent <id>       Parent folder ID
  --type <doc|file>   Entity type for rename/move (default: doc)
  --name <name>       Remote filename (for upload)
  --from <v>          Start version (for diff, default: 0)
  --to <v>            End version (for diff, default: latest)
  --apply             (unused, kept for compatibility)
  --position <n>      Character offset for anchoring a comment
  --help              Show this help

All commands output JSON by default for easy parsing by AI agents.`;

let pretty = false;
function out(data) {
  console.log(JSON.stringify(data, pretty ? null : undefined, pretty ? 2 : undefined));
}

function die(msg) {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  const positional = [];
  const flags = {};

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') flags.json = true;
    else if (a === '--raw') flags.raw = true;
    else if (a === '--pretty') flags.pretty = true;
    else if (a === '--help') flags.help = true;
    else if (a === '--apply') flags.apply = true;
    else if (a === '-o' && i + 1 < args.length) flags.output = args[++i];
    else if (a === '--cookie' && i + 1 < args.length) flags.cookie = args[++i];
    else if (a === '--content' && i + 1 < args.length) flags.content = args[++i];
    else if (a === '--parent' && i + 1 < args.length) flags.parent = args[++i];
    else if (a === '--type' && i + 1 < args.length) flags.type = args[++i];
    else if (a === '--name' && i + 1 < args.length) flags.name = args[++i];
    else if (a === '--from' && i + 1 < args.length) flags.from = args[++i];
    else if (a === '--to' && i + 1 < args.length) flags.to = args[++i];
    else if (a === '--position' && i + 1 < args.length) flags.position = args[++i];
    else positional.push(a);
  }

  return { cmd, positional, flags };
}

async function readStdin() {
  if (process.stdin.isTTY) return null;
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function findDocId(projectData, targetPath) {
  const rootFolder = projectData?.rootFolder;
  if (!rootFolder?.length) return null;
  function search(folder, prefix) {
    for (const doc of folder.docs || []) {
      if (prefix + '/' + doc.name === targetPath) return doc._id;
    }
    for (const file of folder.fileRefs || []) {
      if (prefix + '/' + file.name === targetPath) return file._id;
    }
    for (const sub of folder.folders || []) {
      const r = search(sub, prefix + '/' + sub.name);
      if (r) return r;
    }
    return null;
  }
  return search(rootFolder[0], '');
}

async function connectToProject(cookie, projectId) {
  const sock = new OverleafSocket(cookie);
  await sock.connect(projectId);
  const [projectInfo] = await sock.joinProject(projectId);
  return { sock, projectInfo, projectData: projectInfo.project };
}

// Read a doc's live content via socket (returns { content, lines, version, docId })
async function readDocViaSocket(cookie, projectId, filePath) {
  const normalizedPath = normalizePath(filePath);
  const { sock, projectData } = await connectToProject(cookie, projectId);
  try {
    const docId = findDocId(projectData, normalizedPath);
    if (!docId) throw new Error(`File not found: ${normalizedPath}`);
    const { lines, version } = await sock.joinDoc(docId);
    const content = lines.join('\n');
    await sock.leaveDoc(docId);
    return { content, lines, version, docId, sock: null };
  } finally {
    sock.close();
  }
}

async function main() {
  const { cmd, positional, flags } = parseArgs(process.argv);
  pretty = !!flags.pretty;

  if (!cmd || cmd === 'help' || flags.help) {
    console.log(USAGE);
    process.exit(0);
  }

  if (cmd === 'login') {
    let cookie;
    if (flags.cookie) {
      cookie = flags.cookie;
      if (!cookie.includes('=')) cookie = `overleaf_session2=${cookie}`;
    } else {
      try { cookie = await interactiveLogin(); } catch (e) { die(`Login failed: ${e.message}`); }
    }
    saveSession({ cookie, createdAt: new Date().toISOString() });
    const api = new OverleafAPI(cookie);
    try {
      const result = await api.listProjects();
      out({ success: true, projectCount: result.projects?.length || 0 });
    } catch (e) { die(`Login failed - cookie may be invalid: ${e.message}`); }
    return;
  }

  const session = requireSession();
  const api = new OverleafAPI(session.cookie);

  switch (cmd) {
    case 'projects': {
      out(await api.listProjects());
      break;
    }

    case 'create-project': {
      const name = positional[0];
      if (!name) die('Usage: overleaf create-project <name>');
      await api.fetchCsrf();
      const res = await api._fetch('/project/new', { method: 'POST', json: { projectName: name, template: 'none' } });
      if (!res.ok) die(`Failed to create project: ${res.status}`);
      out(await res.json());
      break;
    }

    case 'rename-project': {
      const [projectId, newName] = positional;
      if (!projectId || !newName) die('Usage: overleaf rename-project <project-id> <new-name>');
      await api.fetchCsrf();
      const res = await api._fetch(`/project/${projectId}/rename`, { method: 'POST', json: { newProjectName: newName } });
      if (!res.ok) die(`Failed to rename project: ${res.status}`);
      out({ success: true, name: newName });
      break;
    }

    case 'files': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf files <project-id>');
      out(await api.getEntities(projectId));
      break;
    }

    case 'read': {
      const [projectId, filePath] = positional;
      if (!projectId || !filePath) die('Usage: overleaf read <project-id> <path>');
      const { content } = await readDocViaSocket(session.cookie, projectId, filePath);
      if (flags.raw) process.stdout.write(content);
      else out({ path: filePath, content });
      break;
    }

    case 'edit': {
      const [projectId, filePath] = positional;
      if (!projectId || !filePath) die('Usage: overleaf edit <project-id> <path>');
      let newContent = flags.content;
      if (newContent == null) newContent = await readStdin();
      if (newContent == null) die('No content provided. Use --content or pipe via stdin');

      const normalizedPath = normalizePath(filePath);
      const { sock, projectData } = await connectToProject(session.cookie, projectId);
      try {
        const docId = findDocId(projectData, normalizedPath);
        if (!docId) die(`File not found: ${normalizedPath}`);
        const { lines, version } = await sock.joinDoc(docId);
        const oldContent = lines.join('\n');
        if (oldContent === newContent) { out({ success: true, message: 'No changes needed' }); break; }
        await sock.applyUpdate(docId, buildReplaceOps(oldContent, newContent), version);
        await sock.leaveDoc(docId);
        out({ success: true, path: filePath, bytesWritten: newContent.length });
      } finally { sock.close(); }
      break;
    }

    case 'suggest': {
      const [projectId, filePath] = positional;
      if (!projectId || !filePath) die('Usage: overleaf suggest <project-id> <path> --content "new content"');
      let newContent = flags.content;
      if (newContent == null) newContent = await readStdin();
      if (newContent == null) die('No content provided. Use --content or pipe via stdin');

      const normalizedPath = normalizePath(filePath);
      const { sock, projectData, projectInfo } = await connectToProject(session.cookie, projectId);
      try {
        const docId = findDocId(projectData, normalizedPath);
        if (!docId) die(`File not found: ${normalizedPath}`);

        // Get user ID from project info
        const userId = projectInfo.publicId ? null : undefined;
        // Fetch from meta instead
        await api.fetchCsrf();
        const projRes = await api._fetch(`/project/${projectId}`);
        const projHtml = await projRes.text();
        const userIdMatch = projHtml.match(/ol-user_id[^"]*"\s+content="([^"]*)"/);
        const uid = userIdMatch?.[1];
        if (!uid) die('Could not determine user ID');

        // Enable track changes for this user
        await api.enableTrackChanges(projectId, uid);

        // Join doc and apply changes as tracked
        const { lines, version } = await sock.joinDoc(docId);
        const oldContent = lines.join('\n');

        if (oldContent === newContent) {
          await api.disableTrackChanges(projectId, uid);
          out({ success: true, message: 'No changes needed' });
          break;
        }

        // Apply the replacement as tracked changes
        const ops = buildReplaceOps(oldContent, newContent);
        await sock.applyTrackedUpdate(docId, ops, version);
        await sock.leaveDoc(docId);

        // Disable track changes mode
        await api.disableTrackChanges(projectId, uid);

        out({ success: true, path: filePath, mode: 'tracked', message: 'Changes submitted as tracked changes. Review in Overleaf editor.' });
      } finally { sock.close(); }
      break;
    }

    case 'accept-changes': {
      const [projectId, docId, ...changeIds] = positional;
      if (!projectId || !docId || !changeIds.length) die('Usage: overleaf accept-changes <project-id> <doc-id> <change-id1> [change-id2...]');
      out(await api.acceptChanges(projectId, docId, changeIds));
      break;
    }

    case 'create-doc': {
      const [projectId, name] = positional;
      if (!projectId || !name) die('Usage: overleaf create-doc <project-id> <name>');
      out(await api.createDoc(projectId, name, flags.parent));
      break;
    }

    case 'delete-doc': {
      const [projectId, docId] = positional;
      if (!projectId || !docId) die('Usage: overleaf delete-doc <project-id> <doc-id>');
      out(await api.deleteDoc(projectId, docId));
      break;
    }

    case 'create-folder': {
      const [projectId, name] = positional;
      if (!projectId || !name) die('Usage: overleaf create-folder <project-id> <name>');
      out(await api.createFolder(projectId, name, flags.parent));
      break;
    }

    case 'delete-folder': {
      const [projectId, folderId] = positional;
      if (!projectId || !folderId) die('Usage: overleaf delete-folder <project-id> <folder-id>');
      out(await api.deleteFolder(projectId, folderId));
      break;
    }

    case 'rename': {
      const [projectId, entityId, newName] = positional;
      if (!projectId || !entityId || !newName) die('Usage: overleaf rename <project-id> <entity-id> <new-name>');
      await api.fetchCsrf();
      const t = flags.type || 'doc';
      const res = await api._fetch(`/project/${projectId}/${t}/${entityId}/rename`, { method: 'POST', json: { name: newName } });
      if (!res.ok) die(`Failed to rename: ${res.status}`);
      out({ success: true, name: newName });
      break;
    }

    case 'move': {
      const [projectId, entityId, folderId] = positional;
      if (!projectId || !entityId || !folderId) die('Usage: overleaf move <project-id> <entity-id> <folder-id>');
      await api.fetchCsrf();
      const t = flags.type || 'doc';
      const res = await api._fetch(`/project/${projectId}/${t}/${entityId}/move`, { method: 'POST', json: { folder_id: folderId } });
      if (!res.ok) die(`Failed to move: ${res.status}`);
      out({ success: true });
      break;
    }

    case 'upload': {
      const [projectId, localPath] = positional;
      if (!projectId || !localPath) die('Usage: overleaf upload <project-id> <local-path>');
      if (!existsSync(localPath)) die(`File not found: ${localPath}`);
      let fileData;
      try { fileData = readFileSync(localPath); } catch (e) { die(`Cannot read file: ${e.message}`); }
      await api.fetchCsrf();
      const remoteName = flags.name || basename(localPath);
      // Resolve folder_id: use --parent flag, or default to root folder
      let folderId = flags.parent;
      if (!folderId) {
        const { sock, projectData } = await connectToProject(session.cookie, projectId);
        sock.close();
        folderId = projectData.rootFolder?.[0]?._id;
        if (!folderId) die('Could not determine root folder ID');
      }
      const formData = new FormData();
      formData.append('relativePath', 'null');
      formData.append('name', remoteName);
      formData.append('type', 'application/octet-stream');
      formData.append('qqfile', new Blob([fileData]), remoteName);
      const res = await api._fetch(`/project/${projectId}/upload?folder_id=${folderId}`, { method: 'POST', body: formData, headers: { 'x-csrf-token': api.csrf } });
      const result = await res.text();
      try { out(JSON.parse(result)); } catch { out({ status: res.status, response: result }); }
      break;
    }

    case 'download': {
      const [projectId, filePath] = positional;
      if (!projectId || !filePath) die('Usage: overleaf download <project-id> <path> -o <file>');
      const outFile = flags.output || basename(filePath);
      const { content } = await readDocViaSocket(session.cookie, projectId, filePath);
      writeFileSync(outFile, content);
      out({ success: true, path: outFile, bytes: content.length });
      break;
    }

    case 'compile': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf compile <project-id>');
      const result = await api.compile(projectId);
      const pdfFile = result.outputFiles?.find(f => f.path === 'output.pdf');
      out({ status: result.status, pdfUrl: pdfFile?.url, pdfSize: pdfFile?.size, compileTime: result.timings?.compileE2E });
      break;
    }

    case 'pdf': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf pdf <project-id> -o <file>');
      const outFile = flags.output || 'output.pdf';
      const pdfData = await api.downloadPdf(projectId);
      writeFileSync(outFile, pdfData);
      out({ success: true, path: outFile, bytes: pdfData.length });
      break;
    }

    case 'zip': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf zip <project-id> -o <file>');
      const outFile = flags.output || 'project.zip';
      const zipData = await api.downloadZip(projectId);
      writeFileSync(outFile, zipData);
      out({ success: true, path: outFile, bytes: zipData.length });
      break;
    }

    case 'threads': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf threads <project-id>');
      const raw = await api.getThreads(projectId);
      // Slim down: extract unique users, replace inline user objects with IDs
      const users = {};
      const threads = {};
      for (const [tid, thread] of Object.entries(raw)) {
        threads[tid] = {
          messages: (thread.messages || []).map(m => {
            if (m.user) users[m.user.id] = `${m.user.first_name} ${m.user.last_name}`;
            return { id: m.id, content: m.content, user: m.user_id, ts: m.timestamp };
          }),
          ...(thread.resolved ? { resolved: true } : {}),
        };
      }
      out({ threads, users });
      break;
    }

    case 'comment': {
      const [projectId, threadId, ...textParts] = positional;
      const text = textParts.join(' ') || flags.content;
      if (!projectId || !threadId || !text) die('Usage: overleaf comment <project-id> <thread-id> <text>');
      out(await api.sendMessage(projectId, threadId, text));
      break;
    }

    case 'add-comment': {
      const [projectId, filePath, ...textParts] = positional;
      const text = textParts.join(' ') || flags.content;
      if (!projectId || !filePath || !text) die('Usage: overleaf add-comment <project-id> <path> <text> --position <offset>');
      const position = parseInt(flags.position);
      if (isNaN(position)) die('--position <offset> is required');
      const threadId = crypto.randomBytes(12).toString('hex');
      // Create the thread via REST
      const message = await api.sendMessage(projectId, threadId, text);
      // Anchor the comment via Socket.IO OT op
      const normalizedPath = normalizePath(filePath);
      const { sock, projectData } = await connectToProject(session.cookie, projectId);
      try {
        const docId = findDocId(projectData, normalizedPath);
        if (!docId) die(`File not found: ${normalizedPath}`);
        // The comment op anchors "text" at position in the doc
        // The text in the OT op should be the SELECTED text in the document, not the comment content
        // Read the doc to get the text at that position
        const { lines, version } = await sock.joinDoc(docId);
        const docContent = lines.join('\n');
        const selectedText = docContent.substring(position, position + 20); // anchor to ~20 chars
        const ops = [{ c: selectedText, p: position, t: threadId }];
        await sock.applyUpdate(docId, ops, version);
        await sock.leaveDoc(docId);
        out({ success: true, threadId, path: filePath, position, selectedText });
      } finally { sock.close(); }
      break;
    }

    case 'resolve-thread': {
      const [projectId, docId, threadId] = positional;
      if (!projectId || !docId || !threadId) die('Usage: overleaf resolve-thread <project-id> <doc-id> <thread-id>');
      out(await api.resolveThread(projectId, docId, threadId));
      break;
    }

    case 'reopen-thread': {
      const [projectId, docId, threadId] = positional;
      if (!projectId || !docId || !threadId) die('Usage: overleaf reopen-thread <project-id> <doc-id> <thread-id>');
      out(await api.reopenThread(projectId, docId, threadId));
      break;
    }

    case 'delete-thread': {
      const [projectId, docId, threadId] = positional;
      if (!projectId || !docId || !threadId) die('Usage: overleaf delete-thread <project-id> <doc-id> <thread-id>');
      out(await api.deleteThread(projectId, docId, threadId));
      break;
    }

    case 'edit-comment': {
      const [projectId, threadId, messageId, ...textParts] = positional;
      const text = textParts.join(' ') || flags.content;
      if (!projectId || !threadId || !messageId || !text) die('Usage: overleaf edit-comment <project-id> <thread-id> <message-id> <text>');
      out(await api.editMessage(projectId, threadId, messageId, text));
      break;
    }

    case 'delete-comment': {
      const [projectId, threadId, messageId] = positional;
      if (!projectId || !threadId || !messageId) die('Usage: overleaf delete-comment <project-id> <thread-id> <message-id>');
      out(await api.deleteMessage(projectId, threadId, messageId));
      break;
    }

    case 'diff': {
      const [projectId, filePath] = positional;
      if (!projectId || !filePath) die('Usage: overleaf diff <project-id> <path> [--from <v>] [--to <v>]');
      const from = parseInt(flags.from || '0');
      // Get latest version if --to not specified
      let to = flags.to ? parseInt(flags.to) : undefined;
      if (to === undefined) {
        const updates = await api.getUpdates(projectId, 1);
        to = updates.updates?.[0]?.toV || 1;
      }
      const result = await api.getDiff(projectId, normalizePath(filePath).substring(1), from, to);
      out(result);
      break;
    }

    case 'search': {
      const [projectId, ...queryParts] = positional;
      const query = queryParts.join(' ');
      if (!projectId || !query) die('Usage: overleaf search <project-id> <query>');
      // Download zip, extract to temp, grep
      const zipData = await api.downloadZip(projectId);
      const tmpDir = mkdtempSync(join(tmpdir(), 'overleaf-search-'));
      const zipPath = join(tmpDir, 'project.zip');
      try {
        writeFileSync(zipPath, zipData);
        execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}"`, { stdio: 'ignore' });
        let grepOutput = '';
        try {
          grepOutput = execSync(
            `grep -rn --include="*.tex" --include="*.bib" --include="*.sty" --include="*.cls" --include="*.txt" ${JSON.stringify(query)} "${tmpDir}"`,
            { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
          );
        } catch (e) {
          // grep exits 1 when no matches
          grepOutput = e.stdout || '';
        }
        const matches = grepOutput.split('\n').filter(Boolean).map(line => {
          const rel = line.replace(tmpDir + '/', '').replace(tmpDir + '\\', '');
          const colonIdx = rel.indexOf(':');
          const colonIdx2 = rel.indexOf(':', colonIdx + 1);
          return {
            file: rel.substring(0, colonIdx),
            line: parseInt(rel.substring(colonIdx + 1, colonIdx2)),
            text: rel.substring(colonIdx2 + 1),
          };
        });
        out({ query, matches, matchCount: matches.length });
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
      break;
    }

    case 'watch': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf watch <project-id>');
      const { sock, projectData } = await connectToProject(session.cookie, projectId);
      // Join all docs
      const docs = [];
      function collectDocs(folder, prefix) {
        for (const doc of folder.docs || []) docs.push({ id: doc._id, path: prefix + '/' + doc.name });
        for (const sub of folder.folders || []) collectDocs(sub, prefix + '/' + sub.name);
      }
      collectDocs(projectData.rootFolder[0], '');

      for (const doc of docs) {
        await sock.joinDoc(doc.id);
      }

      console.error(`Watching ${docs.length} file(s) in "${projectData.name}". Press Ctrl+C to stop.\n`);

      sock.onUpdate((event) => {
        const docInfo = docs.find(d => d.id === event.data?.doc);
        const line = JSON.stringify({ ...event, path: docInfo?.path, timestamp: new Date().toISOString() });
        process.stdout.write(line + '\n');
      });

      // Keep alive until interrupted
      await new Promise(() => {});
      break;
    }

    case 'history': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf history <project-id>');
      const raw = await api.getUpdates(projectId);
      // Slim down: replace repeated user objects with just user IDs
      const users = {};
      const updates = (raw.updates || []).map(u => {
        const userIds = (u.meta?.users || []).map(usr => {
          users[usr.id] = `${usr.first_name} ${usr.last_name}`;
          return usr.id;
        });
        return {
          fromV: u.fromV, toV: u.toV,
          users: userIds,
          ts: u.meta?.start_ts,
          pathnames: u.pathnames?.length ? u.pathnames : undefined,
          project_ops: u.project_ops?.length ? u.project_ops : undefined,
        };
      });
      out({ updates, users });
      break;
    }

    case 'wordcount': {
      const projectId = positional[0];
      if (!projectId) die('Usage: overleaf wordcount <project-id>');
      out(await api.getWordCount(projectId));
      break;
    }

    default:
      die(`Unknown command: ${cmd}. Run 'overleaf help' for usage.`);
  }
}

main().catch(e => die(e.message));
