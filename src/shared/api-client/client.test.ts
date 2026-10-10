import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, isApiError } from "./api-error";
import { api, setAccessTokenProvider } from "./client";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200, type = "application/json") {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": type } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  setAccessTokenProvider(() => null);
});

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: String(url), init: init! };
}

describe("api client", () => {
  it("returns parsed JSON on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "1", title: "Bread" }));
    await expect(api.get("/listings/1")).resolves.toEqual({ id: "1", title: "Bread" });
    expect(lastCall().url).toBe("/api/v1/listings/1");
    expect(lastCall().init.method).toBe("GET");
  });

  it("builds the query string and leaves out empty values", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await api.get("/listings", {
      query: { lat: 27.7, radiusKm: 5, category: undefined, q: "", maxPrice: null, page: 2 },
    });
    expect(lastCall().url).toBe("/api/v1/listings?lat=27.7&radiusKm=5&page=2");
  });

  it("sends a JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "r1" }, 201));
    await api.post("/listings/1/reservations", { quantity: 1 });
    const { init } = lastCall();
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"quantity":1}');
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("adds the bearer token when signed in", async () => {
    setAccessTokenProvider(() => "token-123");
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.get("/users/me");
    expect((lastCall().init.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-123",
    );
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.post("/notifications/read-all")).resolves.toBeUndefined();
  });

  it("turns a ProblemDetails response into an ApiError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: "urn:plateback:error:sold-out",
          title: "No longer available",
          status: 409,
          detail: "Only 0 units remain for this listing.",
          code: "SOLD_OUT",
        },
        409,
        "application/problem+json",
      ),
    );

    const error = await api.post("/listings/1/reservations", { quantity: 1 }).catch((e) => e);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      status: 409,
      code: "SOLD_OUT",
      message: "Only 0 units remain for this listing.",
    });
  });

  it("keeps field errors from a validation error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: "about:blank",
          title: "Validation failed",
          status: 400,
          code: "VALIDATION_ERROR",
          errors: { title: ["Title must be 3-80 characters."] },
        },
        400,
      ),
    );
    const error = (await api.post("/organizations/o1/listings", {}).catch((e) => e)) as ApiError;
    expect(error.fieldErrors).toEqual({ title: ["Title must be 3-80 characters."] });
  });

  it("handles an error response that is not JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("Bad gateway", { status: 502, statusText: "Bad Gateway" }),
    );
    await expect(api.get("/listings")).rejects.toMatchObject({
      status: 502,
      code: "UNKNOWN_ERROR",
    });
  });

  it("reports a network failure as status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.get("/listings")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("passes cancellations through unchanged", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(api.get("/listings")).rejects.toMatchObject({ name: "AbortError" });
  });
});
