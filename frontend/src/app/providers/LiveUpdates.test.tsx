import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/features/auth/session/auth-context";
import { isLiveConnected } from "@/shared/live/live-status";
import type { CurrentUser } from "@/shared/types/api";
import { LiveUpdates } from "./LiveUpdates";

/** A stand-in for the SignalR connection: records handlers and invocations. */
const hub = vi.hoisted(() => ({
  handlers: new Map<string, (message?: unknown) => void>(),
  invoke: vi.fn(() => Promise.resolve()),
  start: vi.fn(() => Promise.resolve()),
  stop: vi.fn(() => Promise.resolve()),
}));

vi.mock("@microsoft/signalr", () => {
  const connection = {
    state: "Connected",
    on: (name: string, handler: (message?: unknown) => void) => hub.handlers.set(name, handler),
    onreconnecting: () => undefined,
    onreconnected: () => undefined,
    onclose: () => undefined,
    start: hub.start,
    stop: hub.stop,
    invoke: hub.invoke,
  };
  class HubConnectionBuilder {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return connection;
    }
  }
  return {
    HubConnectionBuilder,
    HttpTransportType: { WebSockets: 1, ServerSentEvents: 2, LongPolling: 4 },
    HubConnectionState: { Disconnected: "Disconnected" },
    LogLevel: { None: 6 },
  };
});

const arjun: CurrentUser = {
  id: "user-arjun",
  email: "arjun@sunrisebakery.example",
  displayName: "Arjun",
  role: "Customer",
  reliabilityScore: 100,
  isSuspended: false,
  memberships: [
    { organizationId: "org-sunrise", organizationName: "Sunrise Bakery", role: "Owner" },
  ],
};

function renderLive() {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const auth = { status: "authenticated", user: arjun } as AuthContextValue;
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext value={auth}>
        <LiveUpdates />
      </AuthContext>
    </QueryClientProvider>,
  );
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { invalidatedKeys };
}

describe("LiveUpdates", () => {
  beforeEach(() => {
    // The tests run with the mock API, which turns live updates off.
    vi.stubEnv("VITE_USE_MOCKS", "false");
    hub.handlers.clear();
    hub.invoke.mockClear();
    hub.start.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("connects and joins the user's business group", async () => {
    renderLive();
    await waitFor(() => expect(isLiveConnected()).toBe(true));
    expect(hub.invoke).toHaveBeenCalledWith("WatchOrganization", "org-sunrise");
  });

  it("refetches whatever the API says has changed", async () => {
    const { invalidatedKeys } = renderLive();
    await waitFor(() => expect(hub.handlers.size).toBe(3));

    hub.handlers.get("ListingsChanged")?.({ listingIds: ["listing-croissant"] });
    expect(invalidatedKeys()).toContainEqual(["listings"]);

    hub.handlers.get("OrganizationChanged")?.({ organizationId: "org-sunrise" });
    expect(invalidatedKeys()).toContainEqual(["organizations", "org-sunrise"]);

    hub.handlers.get("NotificationsChanged")?.({});
    expect(invalidatedKeys()).toContainEqual(["notifications"]);
    expect(invalidatedKeys()).toContainEqual(["reservations"]);
  });

  it("falls back to polling when the hub cannot be reached", async () => {
    hub.start.mockRejectedValueOnce(new Error("Failed to fetch"));
    renderLive();
    await waitFor(() => expect(hub.start).toHaveBeenCalled());
    expect(isLiveConnected()).toBe(false);
  });
});
