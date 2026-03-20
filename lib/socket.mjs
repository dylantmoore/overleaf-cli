import WebSocket from 'ws';

const BASE = 'https://www.overleaf.com';
const WS_BASE = 'wss://www.overleaf.com';

// Socket.IO v0.9 protocol implementation for Overleaf
export class OverleafSocket {
  constructor(cookie) {
    this.cookie = cookie;
    this.ws = null;
    this.ackId = 0;
    this.pendingAcks = new Map();   // id -> { resolve, reject, timer }
    this.pendingEvents = new Map(); // name -> { resolve, reject, timer }
    this.heartbeatInterval = null;
  }

  async connect(projectId) {
    const handshakeUrl = `${BASE}/socket.io/1/?projectId=${projectId}&t=${Date.now()}`;
    const res = await fetch(handshakeUrl, {
      headers: { 'Cookie': this.cookie },
    });
    if (!res.ok) throw new Error(`Socket handshake failed: ${res.status}`);
    const body = await res.text();
    const [sessionId, heartbeatTimeout] = body.split(':');

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };

      const wsUrl = `${WS_BASE}/socket.io/1/websocket/${sessionId}`;
      this.ws = new WebSocket(wsUrl, {
        headers: { 'Cookie': this.cookie },
      });

      this.ws.on('open', () => {
        const interval = (parseInt(heartbeatTimeout) || 25) * 1000 * 0.8;
        this.heartbeatInterval = setInterval(() => {
          if (this.ws.readyState === WebSocket.OPEN) this.ws.send('2::');
        }, interval);
      });

      this.ws.on('message', (data) => {
        const msg = data.toString();
        const type = msg.charAt(0);

        if (type === '1') {
          settle(resolve);
        } else if (type === '2') {
          this.ws.send('2::');
        } else if (type === '5') {
          try {
            const payload = JSON.parse(msg.substring(4));
            this._handleEvent(payload);
            const handler = this.pendingEvents.get(payload.name);
            if (handler) {
              clearTimeout(handler.timer);
              this.pendingEvents.delete(payload.name);
              handler.resolve(payload.args);
            }
          } catch { /* ignore malformed messages */ }
        } else if (type === '6') {
          try {
            const match = msg.match(/^6:::(\d+)(\+(.*))?$/s);
            if (match) {
              const id = parseInt(match[1]);
              const ackData = match[3] ? JSON.parse(match[3]) : [];
              const handler = this.pendingAcks.get(id);
              if (handler) {
                clearTimeout(handler.timer);
                this.pendingAcks.delete(id);
                handler.resolve(ackData);
              }
            }
          } catch { /* ignore malformed acks */ }
        }
      });

      this.ws.on('error', (err) => settle(reject, err));
      setTimeout(() => settle(reject, new Error('Socket connection timeout')), 10000);
    });
  }

  _emitWithAck(event, ...args) {
    return new Promise((resolve, reject) => {
      const id = ++this.ackId;
      const timer = setTimeout(() => {
        this.pendingAcks.delete(id);
        reject(new Error(`Timeout waiting for ack on ${event}`));
      }, 30000);
      this.pendingAcks.set(id, { resolve, reject, timer });
      this.ws.send(`5:${id}+::${JSON.stringify({ name: event, args })}`);
    });
  }

  _emitAndWaitEvent(emitName, emitArgs, responseName) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingEvents.delete(responseName);
        reject(new Error(`Timeout waiting for event ${responseName}`));
      }, 30000);
      this.pendingEvents.set(responseName, { resolve, reject, timer });
      const id = ++this.ackId;
      this.ws.send(`5:${id}+::${JSON.stringify({ name: emitName, args: emitArgs })}`);
    });
  }

  async joinProject(projectId) {
    return this._emitAndWaitEvent(
      'joinProject', [{ project_id: projectId }], 'joinProjectResponse'
    );
  }

  async joinDoc(docId) {
    const result = await this._emitWithAck('joinDoc', docId, { encodeRanges: true });
    const [err, lines, version, ranges, , otType] = result;
    if (err) throw new Error(`joinDoc error: ${JSON.stringify(err)}`);
    return { lines, version, ranges, otType };
  }

  async applyUpdate(docId, ops, version) {
    await this._emitWithAck('applyOtUpdate', docId, { doc: docId, op: ops, v: version });
  }

  async leaveDoc(docId) {
    await this._emitWithAck('leaveDoc', docId);
  }

  onUpdate(callback) {
    // Register a persistent listener for incoming OT updates from other users
    this._updateCallback = callback;
  }

  _handleEvent(payload) {
    // Called for all type-5 messages. Check for update events.
    if (payload.name === 'otUpdateApplied' && this._updateCallback) {
      this._updateCallback({ type: 'otUpdateApplied', data: payload.args[0] });
    }
    if (payload.name === 'otUpdateError' && this._updateCallback) {
      this._updateCallback({ type: 'otUpdateError', data: payload.args[0] });
    }
  }

  close() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    for (const h of this.pendingAcks.values()) clearTimeout(h.timer);
    for (const h of this.pendingEvents.values()) clearTimeout(h.timer);
    this.pendingAcks.clear();
    this.pendingEvents.clear();
    if (this.ws) this.ws.close();
  }
}

export function buildReplaceOps(oldContent, newContent) {
  const ops = [];
  if (oldContent.length > 0) ops.push({ d: oldContent, p: 0 });
  if (newContent.length > 0) ops.push({ i: newContent, p: 0 });
  return ops;
}
