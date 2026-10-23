import type { ProblemDetails } from "@/shared/types/api";
import { ApiError } from "./api-error";

/** Where requests go. The mock API (MSW) answers on the same path. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  /** Query parameters; null and undefined values are left out. */
  query?: Record<string, QueryValue>;
  /** Sent as JSON. */
  body?: unknown;
  /** Lets React Query cancel a request it no longer needs. */
  signal?: AbortSignal;
};

/** Returns the current access token, or null when signed out. Set by auth in step 9. */
let getAccessToken: () => string | null = () => null;

export function setAccessTokenProvider(provider: () => string | null) {
  getAccessToken = provider;
}

/** The current access token, for connections that are not plain fetches (SignalR). */
export function currentAccessToken() {
  return getAccessToken();
}

/**
 * Called once when a request fails with TOKEN_EXPIRED; should get a new
 * access token (POST /auth/refresh) and return true if it did. Set by auth.
 */
let refreshAccessToken: (() => Promise<boolean>) | null = null;

export function setTokenRefresher(refresher: (() => Promise<boolean>) | null) {
  refreshAccessToken = refresher;
}

/**
 * Absolute URL for an API path. A relative base ("/api/v1") is resolved
 * against the page's origin; browsers do that anyway, but Node's fetch (used
 * in tests) needs an absolute URL.
 */
function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetails;
    if (problem && typeof problem.code === "string") return ApiError.fromProblem(problem);
  } catch {
    // Body was not JSON; fall through to a generic error.
  }
  // A proxy or load balancer answering for an API that is down or restarting
  // (the dev server sends 502). Users see this, not "Bad Gateway".
  if ([502, 503, 504].includes(response.status)) {
    return new ApiError(
      response.status,
      "NETWORK_ERROR",
      "The server is not responding. Try again in a moment.",
    );
  }
  return new ApiError(response.status, "UNKNOWN_ERROR", response.statusText || "Request failed");
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  // FormData (file uploads) sets its own multipart Content-Type with the boundary.
  const isForm = options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: options.signal,
      // Sends the httpOnly refresh-token cookie to /auth endpoints.
      credentials: "include",
    });
  } catch (error) {
    // Let React Query see cancellations as cancellations.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Check your connection.");
  }

  if (!response.ok) {
    const error = await toApiError(response);
    // Access tokens live 15 minutes: refresh once and repeat the request.
    if (
      error.code === "TOKEN_EXPIRED" &&
      !isRetry &&
      refreshAccessToken &&
      (await refreshAccessToken())
    ) {
      return request<T>(method, path, options, true);
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Typed helpers for every HTTP method the API uses. */
export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
