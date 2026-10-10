/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, for example "/api/v1" or "https://api.example.com/api/v1". */
  readonly VITE_API_BASE_URL?: string;
  /** "true" serves the API from the in-browser mock (MSW) instead of a real backend. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
