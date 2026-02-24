# Stock Monitor

Lightweight static site that fetches stock prices from a configurable provider and shows current price plus percent change over 1 day, 1 week, 1 month and 1 year.

Notes:
- Default provider: Financial Modeling Prep (FMP). Edit `config.js` to change provider or update `API_KEY`.
- The site is static — you can serve it with any static server (VS Code Live Server, `python -m http.server`, etc.).

Quick start:

```powershell
cd stock-monitor
# serve (python) and open http://localhost:8000
python -m http.server 8000
```

Configure provider and key in `config.js`.

Using SSI FastConnect
- To use SSI FastConnect set `PROVIDER = 'ssi'` in `config.js` and populate one of the endpoint templates:
	- `SSI_QUOTE_URL_TEMPLATE` — template URL to fetch a quote for a symbol (use `{symbol}` placeholder)
	- `SSI_HISTORICAL_URL_TEMPLATE` — template URL to fetch historical data (use `{symbol}` and optionally `{timeseries}`)
	- or set `SSI_BASE` and the adapter will try sensible defaults.

Example `config.js` values (replace with actual FastConnect endpoints and key):

```js
export const PROVIDER = 'ssi';
export const SSI_API_KEY = 'your-key-here';
export const SSI_QUOTE_URL_TEMPLATE = 'https://fastconnect.ssi.com.vn/api/v1/market/quote/{symbol}?apikey={apiKey}';
export const SSI_HISTORICAL_URL_TEMPLATE = 'https://fastconnect.ssi.com.vn/api/v1/market/historical/{symbol}?timeseries={timeseries}&apikey={apiKey}';
```

The adapter will pass responses through — you may need to adjust `providers/ssi.js` if the FastConnect response shape differs.

AccessToken (recommended)
- FastConnect supports an `AccessToken` flow. Instead of embedding an API key in the browser, you can set `SSI_CONSUMER_ID` and `SSI_CONSUMER_SECRET` in `config.js` and the adapter will POST to `/api/v2/Market/AccessToken` to obtain a short-lived token. Add these to `config.js` and set `PROVIDER = 'ssi'`.

Security note: Do NOT commit real secrets into the repository. For production, implement a small server-side proxy that stores `SSI_CONSUMER_SECRET` server-side and issues tokens to the client.
# StockMonitorVN2.0
