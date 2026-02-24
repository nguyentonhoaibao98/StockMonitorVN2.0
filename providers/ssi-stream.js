import { SSI_WS_URL, SSI_WS_ENABLED, SSI_WS_AUTH_TOKEN, SSI_WS_SUBSCRIBE_TEMPLATE } from '../config.js';

let ws = null;
let listeners = [];

export function onMessage(fn) {
  listeners.push(fn);
}

export function offAll() {
  listeners = [];
}

function emit(data) {
  for (const fn of listeners) fn(data);
}

export function connect() {
  if (!SSI_WS_ENABLED) return Promise.resolve();
  if (!SSI_WS_URL) return Promise.reject(new Error('SSI_WS_URL not set'));
  return new Promise((resolve, reject) => {
    try {
      const url = SSI_WS_AUTH_TOKEN ? `${SSI_WS_URL}?accessToken=${encodeURIComponent(SSI_WS_AUTH_TOKEN)}` : SSI_WS_URL;
      ws = new WebSocket(url);
      ws.addEventListener('open', () => resolve());
      ws.addEventListener('message', (ev) => {
        let payload = ev.data;
        try { payload = JSON.parse(ev.data); } catch {}
        emit(payload);
      });
      ws.addEventListener('error', (e) => reject(e));
      ws.addEventListener('close', () => { ws = null; emit({ type: 'closed' }); });
    } catch (e) { reject(e); }
  });
}

export function subscribe(symbols) {
  if (!ws) throw new Error('WebSocket not connected');
  if (!Array.isArray(symbols)) symbols = [symbols];
  if (SSI_WS_SUBSCRIBE_TEMPLATE && SSI_WS_SUBSCRIBE_TEMPLATE.length > 0) {
    const symbolsJson = JSON.stringify(symbols);
    const msg = SSI_WS_SUBSCRIBE_TEMPLATE.replace('{symbols}', symbolsJson);
    try {
      const parsed = JSON.parse(msg);
      ws.send(JSON.stringify(parsed));
      return;
    } catch (e) {
      // not a JSON template, send raw
      ws.send(msg);
      return;
    }
  }

  // Default fallback: send a simple subscribe object — you may need to change this for FastConnect
  const fallback = { op: 'subscribe', symbols };
  ws.send(JSON.stringify(fallback));
}

export function disconnect() {
  if (ws) ws.close();
  ws = null;
}
