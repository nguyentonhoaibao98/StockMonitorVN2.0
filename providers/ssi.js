import {
  SSI_API_KEY,
  SSI_BASE,
  SSI_QUOTE_URL_TEMPLATE,
  SSI_HISTORICAL_URL_TEMPLATE,
  SSI_CONSUMER_ID,
  SSI_CONSUMER_SECRET,
  SSI_DAILY_OHLC_ENDPOINT,
  SSI_DAILY_STOCK_PRICE_ENDPOINT,
  SSI_TOKEN_TTL_MS,
} from '../config.js';

let _tokenCache = {
  token: null,
  expiresAt: 0,
};

async function getAccessToken() {
  // If API key is provided just return it as a bearer token-like value
  if (SSI_API_KEY && SSI_API_KEY.length > 0) return SSI_API_KEY;

  const now = Date.now();
  if (_tokenCache.token && _tokenCache.expiresAt > now + 5000) return _tokenCache.token;

  if (!SSI_CONSUMER_ID || !SSI_CONSUMER_SECRET) {
    throw new Error('SSI_CONSUMER_ID and SSI_CONSUMER_SECRET must be set in config.js to obtain AccessToken');
  }

  const url = `${SSI_BASE.replace(/\/$/,'')}/api/v2/Market/AccessToken`;
  const body = JSON.stringify({ consumerID: SSI_CONSUMER_ID, consumerSecret: SSI_CONSUMER_SECRET });

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`SSI AccessToken request failed ${res.status} ${txt}`);
  }
  const json = await res.json();
  const token = json?.data?.accessToken ?? json?.accessToken ?? null;
  if (!token) throw new Error('SSI AccessToken response did not include accessToken');

  // Some servers include expiry; otherwise use TTL fallback
  const ttl = SSI_TOKEN_TTL_MS || 55 * 60 * 1000;
  _tokenCache.token = token;
  _tokenCache.expiresAt = Date.now() + ttl;
  return token;
}

async function authFetch(url, opts = {}) {
  const token = await getAccessToken();
  const headers = Object.assign({}, opts.headers || {});
  // Prefer Bearer Authorization
  headers['Authorization'] = `Bearer ${token}`;
  headers['Accept'] = headers['Accept'] || 'application/json';
  return fetch(url, Object.assign({}, opts, { headers }));
}

function buildUrlFromTemplate(template, params = {}) {
  if (!template || template.length === 0) return null;
  let url = template;
  Object.keys(params).forEach((k) => {
    url = url.replace(new RegExp(`\\{${k}\\}`, 'g'), encodeURIComponent(params[k] ?? ''));
  });
  return url;
}

function defaultDailyOhlcUrl(symbol, fromDate, toDate, pageIndex = 1, pageSize = 100) {
  const base = SSI_DAILY_OHLC_ENDPOINT && SSI_DAILY_OHLC_ENDPOINT.length ? SSI_DAILY_OHLC_ENDPOINT : `${SSI_BASE.replace(/\\/$/,'')}/api/v2/Market/DailyOhlc`;
  const qs = new URLSearchParams();
  if (symbol) qs.set('symbol', symbol);
  if (fromDate) qs.set('fromDate', fromDate);
  if (toDate) qs.set('toDate', toDate);
  qs.set('pageIndex', String(pageIndex));
  qs.set('pageSize', String(pageSize));
  return `${base}?${qs.toString()}`;
}

function defaultDailyStockPriceUrl(symbol, fromDate, toDate, pageIndex = 1, pageSize = 100) {
  const base = SSI_DAILY_STOCK_PRICE_ENDPOINT && SSI_DAILY_STOCK_PRICE_ENDPOINT.length ? SSI_DAILY_STOCK_PRICE_ENDPOINT : `${SSI_BASE.replace(/\\/$/,'')}/api/v2/Market/DailyStockPrice`;
  const qs = new URLSearchParams();
  if (symbol) qs.set('Symbol', symbol);
  if (fromDate) qs.set('fromDate', fromDate);
  if (toDate) qs.set('toDate', toDate);
  qs.set('pageIndex', String(pageIndex));
  qs.set('pageSize', String(pageSize));
  return `${base}?${qs.toString()}`;
}

export async function fetchQuote(symbol) {
  // Try template first
  if (SSI_QUOTE_URL_TEMPLATE && SSI_QUOTE_URL_TEMPLATE.length) {
    const url = buildUrlFromTemplate(SSI_QUOTE_URL_TEMPLATE, { symbol });
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`SSI quote API ${res.status}`);
    return res.json();
  }
  // Fallback to DailyStockPrice for latest quote
  const today = new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
  const url = defaultDailyStockPriceUrl(symbol, null, null, 1, 1);
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`SSI quote API (fallback) ${res.status}`);
  const json = await res.json();
  return json;
}

export async function fetchHistorical(symbol, timeseries = 400) {
  if (SSI_HISTORICAL_URL_TEMPLATE && SSI_HISTORICAL_URL_TEMPLATE.length) {
    const url = buildUrlFromTemplate(SSI_HISTORICAL_URL_TEMPLATE, { symbol, timeseries });
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`SSI historical API ${res.status}`);
    const json = await res.json();
    return json?.data ?? json;
  }

  // Fallback: call DailyOhlc with a wide date range (consumer should supply valid dates)
  // Here we request pageSize = timeseries and rely on server ordering.
  const url = defaultDailyOhlcUrl(symbol, null, null, 1, timeseries);
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`SSI historical API (fallback) ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function fetchDailyOhlc(symbol, fromDate, toDate, pageIndex = 1, pageSize = 100) {
  const url = SSI_DAILY_OHLC_ENDPOINT && SSI_DAILY_OHLC_ENDPOINT.length
    ? buildUrlFromTemplate(SSI_DAILY_OHLC_ENDPOINT, { symbol, fromDate, toDate, pageIndex, pageSize })
    : defaultDailyOhlcUrl(symbol, fromDate, toDate, pageIndex, pageSize);
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`SSI DailyOhlc ${res.status}`);
  return (await res.json()).data ?? (await res.json());
}

export async function fetchDailyStockPrice(symbol, fromDate, toDate, pageIndex = 1, pageSize = 100) {
  const url = SSI_DAILY_STOCK_PRICE_ENDPOINT && SSI_DAILY_STOCK_PRICE_ENDPOINT.length
    ? buildUrlFromTemplate(SSI_DAILY_STOCK_PRICE_ENDPOINT, { symbol, fromDate, toDate, pageIndex, pageSize })
    : defaultDailyStockPriceUrl(symbol, fromDate, toDate, pageIndex, pageSize);
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`SSI DailyStockPrice ${res.status}`);
  return (await res.json()).data ?? (await res.json());
}
