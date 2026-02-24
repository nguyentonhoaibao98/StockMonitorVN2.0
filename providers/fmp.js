import { API_KEY, FMP_BASE } from '../config.js';

export async function fetchQuote(symbol) {
  const url = `${FMP_BASE}/quote/${encodeURIComponent(symbol)}?apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quote API ${res.status}`);
  const data = await res.json();
  // data is array with latest quote
  return (Array.isArray(data) && data[0]) ? data[0] : null;
}

export async function fetchHistorical(symbol, timeseries = 400) {
  const url = `${FMP_BASE}/historical-price-full/${encodeURIComponent(symbol)}?timeseries=${timeseries}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Historical API ${res.status}`);
  const data = await res.json();
  return data.historical ?? data.historicalPrice ?? null;
}
