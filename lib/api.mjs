import { updateCookie } from './auth.mjs';

const BASE = 'https://www.overleaf.com';

export class OverleafAPI {
  constructor(cookie) {
    this.cookie = cookie;
    this.csrf = null;
  }

  async _fetch(path, opts = {}) {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    const headers = {
      'Accept': 'application/json',
      'Cookie': this.cookie,
      ...opts.headers,
    };
    if (opts.method && opts.method !== 'GET' && this.csrf) {
      headers['x-csrf-token'] = this.csrf;
    }
    if (opts.json) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.json);
      delete opts.json;
    }
    const res = await fetch(url, { ...opts, headers, redirect: 'manual' });

    if (res.status === 302) {
      const location = res.headers.get('location') || '';
      if (location.includes('/login')) {
        throw new Error('Session expired. Run: overleaf login');
      }
    }

    const setCookie = res.headers.get('set-cookie');
    if (setCookie && setCookie.includes('overleaf_session2=')) {
      const match = setCookie.match(/overleaf_session2=([^;]+)/);
      if (match) {
        const newSession = `overleaf_session2=${match[1]}`;
        const extras = this.cookie.split(';').map(c => c.trim())
          .filter(c => c && !c.startsWith('overleaf_session2=')).join('; ');
        this.cookie = extras ? `${newSession}; ${extras}` : newSession;
        updateCookie(this.cookie);
      }
    }
    return res;
  }

  async fetchCsrf() {
    const res = await this._fetch('/project');
    const html = await res.text();
    const match = html.match(/ol-csrfToken[^"]*"\s+content="([^"]*)"/);
    if (match) this.csrf = match[1];
    return this.csrf;
  }

  async listProjects() {
    const res = await this._fetch('/user/projects');
    if (!res.ok) throw new Error(`Failed to list projects: ${res.status}`);
    return res.json();
  }

  async getEntities(projectId) {
    const res = await this._fetch(`/project/${projectId}/entities`);
    if (!res.ok) throw new Error(`Failed to get entities: ${res.status}`);
    return res.json();
  }

  async compile(projectId, opts = {}) {
    await this._ensureCsrf();
    const res = await this._fetch(`/project/${projectId}/compile`, {
      method: 'POST',
      json: { check: 'silent', draft: opts.draft || false },
    });
    if (!res.ok) throw new Error(`Failed to compile: ${res.status}`);
    return res.json();
  }

  async downloadPdf(projectId) {
    const result = await this.compile(projectId);
    if (result.status !== 'success') throw new Error(`Compilation failed: ${result.status}`);
    const pdfFile = result.outputFiles?.find(f => f.path === 'output.pdf');
    if (!pdfFile) throw new Error('No PDF in compile output');
    const res = await this._fetch(pdfFile.url);
    if (!res.ok) throw new Error(`Failed to download PDF: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async downloadZip(projectId) {
    const res = await this._fetch(`/project/${projectId}/download/zip`);
    if (!res.ok) throw new Error(`Failed to download zip: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async getThreads(projectId) {
    const res = await this._fetch(`/project/${projectId}/threads`);
    if (!res.ok) throw new Error(`Failed to get threads: ${res.status}`);
    return res.json();
  }

  async getUpdates(projectId, minCount = 10) {
    const res = await this._fetch(`/project/${projectId}/updates?min_count=${minCount}`);
    if (!res.ok) throw new Error(`Failed to get updates: ${res.status}`);
    return res.json();
  }

  async getWordCount(projectId) {
    const res = await this._fetch(`/project/${projectId}/wordcount`);
    if (!res.ok) throw new Error(`Failed to get word count: ${res.status}`);
    return res.json();
  }

  async createDoc(projectId, name, parentFolderId) {
    await this._ensureCsrf();
    const body = { name };
    if (parentFolderId) body.parent_folder_id = parentFolderId;
    const res = await this._fetch(`/project/${projectId}/doc`, { method: 'POST', json: body });
    if (!res.ok) throw new Error(`Failed to create doc: ${res.status}`);
    return res.json();
  }

  async deleteDoc(projectId, docId) {
    await this._ensureCsrf();
    const res = await this._fetch(`/project/${projectId}/doc/${docId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete doc: ${res.status}`);
    return { success: true };
  }

  async createFolder(projectId, name, parentFolderId) {
    await this._ensureCsrf();
    const body = { name };
    if (parentFolderId) body.parent_folder_id = parentFolderId;
    const res = await this._fetch(`/project/${projectId}/folder`, { method: 'POST', json: body });
    if (!res.ok) throw new Error(`Failed to create folder: ${res.status}`);
    return res.json();
  }

  async deleteFolder(projectId, folderId) {
    await this._ensureCsrf();
    const res = await this._fetch(`/project/${projectId}/folder/${folderId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete folder: ${res.status}`);
    return { success: true };
  }

  async getDiff(projectId, pathname, from, to) {
    const res = await this._fetch(
      `/project/${projectId}/diff?pathname=${encodeURIComponent(pathname)}&from=${from}&to=${to}`
    );
    if (!res.ok) throw new Error(`Failed to get diff: ${res.status}`);
    return res.json();
  }

  async sendMessage(projectId, threadId, content) {
    await this._ensureCsrf();
    const res = await this._fetch(`/project/${projectId}/thread/${threadId}/messages`, {
      method: 'POST',
      json: { content },
    });
    if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
    return res.json();
  }

  async _ensureCsrf() {
    if (!this.csrf) await this.fetchCsrf();
  }
}
