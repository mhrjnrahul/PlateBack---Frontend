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

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ""}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetails;
    if (problem && typeof problem.code === "string") return ApiError.fromProblem(problem);
  } catch {
    // Body was not JSON; fall through to a generic error.
  }
  return new ApiError(response.status, "UNKNOWN_ERROR", response.statusText || "Request failed");
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      // Sends the httpOnly refresh-token cookie to /auth endpoints.
      credentials: "include",
    });
  } catch (error) {
    // Let React Query see cancellations as cancellations.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Check your connection.");
  }

  if (!response.ok) throw await toApiError(response);
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
