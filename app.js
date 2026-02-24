import { PROVIDER } from './config.js';
import { fetchHistorical as fmpFetchHistorical } from './providers/fmp.js';
import { fetchHistorical as ssiFetchHistorical } from './providers/ssi.js';
import { SSI_WS_ENABLED } from './config.js';
import * as ssiStream from './providers/ssi-stream.js';

const $ = (s) => document.querySelector(s);
const symbolsInput = $('#symbols');
const fetchBtn = $('#fetchBtn');
const statusEl = $('#status');
const tbody = document.querySelector('#resultsTable tbody');

function setStatus(text) { statusEl.textContent = text; }

function formatNumber(n) { return n === null || n === undefined ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function formatPct(n) { if (n === null || n === undefined) return '—'; const cls = n >= 0 ? 'positive' : 'negative'; return `<span class="pct ${cls}">${n >= 0 ? '+' : ''}${n.toFixed(2)}%</span>`; }

async function fetchHistorical(symbol) {
  // choose provider (only FMP implemented for now)
  if (PROVIDER === 'fmp') {
    return await fmpFetchHistorical(symbol, 400);
  }
  if (PROVIDER === 'ssi') {
    return await ssiFetchHistorical(symbol, 400);
  }
  // fallback: try FMP as default
  return await fmpFetchHistorical(symbol, 400);
}

function computeChanges(historical) {
  if (!historical || historical.length === 0) return { current: null, d1: null, w1: null, m1: null, y1: null };
  // historical expected sorted newest first
  const latest = historical[0];
  const current = latest.close;

  const getByOffset = (offset) => {
    if (historical.length > offset) return historical[offset].close;
    return null;
  };

  // offsets approximations: 1D=1, 1W=5, 1M=21, 1Y=252
  const prev1 = getByOffset(1);
  const prev5 = getByOffset(5);
  const prev21 = getByOffset(21);
  const prev252 = getByOffset(252);

  const pct = (now, past) => (now !== null && past) ? ((now - past) / past) * 100 : null;

  return {
    current,
    d1: pct(current, prev1),
    w1: pct(current, prev5),
    m1: pct(current, prev21),
    y1: pct(current, prev252),
  };
}

async function fetchAndRender(symbol) {
  try {
    setStatus(`Loading ${symbol}...`);
    const hist = await fetchHistorical(symbol);
    const c = computeChanges(hist);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${symbol.toUpperCase()}</td>
      <td>${formatNumber(c.current)}</td>
      <td>${formatPct(c.d1)}</td>
      <td>${formatPct(c.w1)}</td>
      <td>${formatPct(c.m1)}</td>
      <td>${formatPct(c.y1)}</td>
    `;
    tbody.appendChild(tr);
    // attach data attribute for live updates
    tr.dataset.symbol = symbol.toUpperCase();
  } catch (e) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${symbol.toUpperCase()}</td><td colspan="5">Error: ${e.message}</td>`;
    tbody.appendChild(tr);
  }
}

async function onFetch() {
  const raw = symbolsInput.value || '';
  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (symbols.length === 0) return;
  tbody.innerHTML = '';
  setStatus('Fetching…');
  // If SSI streaming enabled, connect and subscribe after initial render
  if (PROVIDER === 'ssi' && SSI_WS_ENABLED) {
    try {
      await ssiStream.connect();
      ssiStream.onMessage((msg) => {
        // Expect message containing symbol and last/price fields — adapt if FastConnect differs
        if (!msg) return;
        const sym = (msg.symbol || msg.ticker || msg.s)?.toString().toUpperCase();
        const price = msg.price ?? msg.p ?? msg.last;
        if (!sym || typeof price === 'undefined') return;
        const row = tbody.querySelector(`tr[data-symbol="${sym}"]`);
        if (!row) return;
        const currentCell = row.children[1];
        if (currentCell) currentCell.textContent = formatNumber(price);
        // Leave percent calculations to periodic refresh or implement incremental if payload includes change
      });
    } catch (e) {
      console.warn('SSI stream failed to connect:', e);
    }
  }

  // sequential fetch to be conservative with rate limits
  for (const sym of symbols) {
    // small delay to avoid hitting strict free limits
    await fetchAndRender(sym);
    await new Promise(r => setTimeout(r, 500));
  }

  // subscribe to symbols on WS if active
  if (PROVIDER === 'ssi' && SSI_WS_ENABLED) {
    try { ssiStream.subscribe(symbols.map(s => s.toUpperCase())); } catch (e) { console.warn('WS subscribe failed', e); }
  }

  setStatus('Done');
}

fetchBtn.addEventListener('click', onFetch);

// auto run for default symbols
window.addEventListener('load', () => { setTimeout(onFetch, 200); });
