/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, for example "/api/v1" or "https://api.example.com/api/v1". */
  readonly VITE_API_BASE_URL?: string;
  /** Currency symbol shown before amounts. Default "Rs". */
  readonly VITE_CURRENCY_SYMBOL?: string;
  /** "false" turns off the in-browser mock API (MSW); any other value or unset keeps it on. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
