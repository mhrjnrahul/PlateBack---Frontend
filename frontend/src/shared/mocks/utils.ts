import { delay, HttpResponse } from "msw";
import { API_BASE_URL } from "@/shared/api-client/client";
import type { ErrorCode, Page, ProblemDetails } from "@/shared/types/api";

/** Full mock URL for an API path, for example apiUrl("/listings/:id"). */
export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

/** Simulated network latency, so loading states are visible. None in tests. */
export function mockDelay() {
  return delay(import.meta.env.MODE === "test" ? 0 : 400);
}

/** An RFC 9457 error response, shaped like the real API's (design doc 6.4). */
export function problem(
  status: number,
  code: ErrorCode,
  title: string,
  detail?: string,
  errors?: Record<string, string[]>,
) {
  const body: ProblemDetails = {
    type: `urn:plateback:error:${code.toLowerCase().replaceAll("_", "-")}`,
    title,
    status,
    code,
    ...(detail && { detail }),
    ...(errors && { errors }),
  };
  return HttpResponse.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

/** Reads page and pageSize from a URL, with the API's defaults (20) and maximum (50). */
export function readPaging(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
  return { page, pageSize };
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export function newId() {
  return crypto.randomUUID();
}
