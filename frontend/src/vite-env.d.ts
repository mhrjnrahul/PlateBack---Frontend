/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, for example "/api/v1" or "https://api.example.com/api/v1". */
  readonly VITE_API_BASE_URL?: string;
  /** Currency symbol shown before amounts. Default "Rs". */
  readonly VITE_CURRENCY_SYMBOL?: string;
  /** "true" runs the in-browser mock API (MSW) instead of the real one. Default off. */
  readonly VITE_USE_MOCKS?: string;
  /** URL of the API's SignalR hub. Default "/hubs/live". */
  readonly VITE_LIVE_HUB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
