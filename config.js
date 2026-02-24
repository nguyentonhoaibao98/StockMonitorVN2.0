// Configuration for data provider
export const PROVIDER = 'fmp';
// Replace with your own key from https://financialmodelingprep.com
export const API_KEY = 'demo';
export const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

// SSI FastConnect configuration (set PROVIDER = 'ssi' to use)
// You should replace these with your FastConnect host and API key or endpoint templates.
export const SSI_BASE = 'https://fc-data.ssi.com.vn/v2.0';
export const SSI_API_KEY = '';
// Consumer credentials for AccessToken (get these from Iboard when creating a FastConnect key)
export const SSI_CONSUMER_ID = '';
export const SSI_CONSUMER_SECRET = '';
// WebSocket endpoint for market data hub
export const SSI_WS_URL = 'wss://fc-datahub.ssi.com.vn/v2.0';
// Enable WebSocket streaming (set true to attempt live updates). You must configure SSI_WS_AUTH_TOKEN or provide a server-side proxy if required.
export const SSI_WS_ENABLED = false;
export const SSI_WS_AUTH_TOKEN = '';
// Optional template for the subscribe message to send over WS. Use {symbols} placeholder.
// For example: '{"op":"subscribe","symbols":{symbols}}' or JSON array '["AAPL","MSFT"]'
export const SSI_WS_SUBSCRIBE_TEMPLATE = '';

// URL templates: use `{symbol}` where the ticker should go. You can include query params and {timeseries} placeholder.
// If left empty, the adapter will ask you to provide concrete endpoints per FastConnect docs.
export const SSI_QUOTE_URL_TEMPLATE = '';
export const SSI_HISTORICAL_URL_TEMPLATE = '';

// Optional explicit endpoints for FastConnect Market APIs (if you prefer explicit URLs)
// Example: `${SSI_BASE}/api/v2/Market/DailyOhlc` (the adapter will add query params)
export const SSI_DAILY_OHLC_ENDPOINT = '';
export const SSI_DAILY_STOCK_PRICE_ENDPOINT = '';

// Token cache TTL safeguard (ms) - adapter will respect token expiry from server when available
export const SSI_TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes
