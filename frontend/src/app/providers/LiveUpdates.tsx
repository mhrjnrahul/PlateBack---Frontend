import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/session/auth-context";
import { listingKeys } from "@/features/listings/api/listings-api";
import { notificationKeys } from "@/features/notifications/api/notifications-api";
import { organizationKeys } from "@/features/organizations/api/organizations-api";
import { reservationKeys } from "@/features/reservations/api/reservations-api";
import { currentAccessToken } from "@/shared/api-client/client";
import { setLiveConnected } from "@/shared/live/live-status";

/** The API's SignalR hub; the dev server proxies it like /api. */
const HUB_URL = import.meta.env.VITE_LIVE_HUB_URL ?? "/hubs/live";

/** Retry quickly at first, then every 30 seconds for as long as the page is open. */
const RETRY_DELAYS_MS = [0, 2_000, 5_000, 10_000];
const retryDelay = (attempt: number) => RETRY_DELAYS_MS[attempt] ?? 30_000;

/**
 * Keeps one SignalR connection open and refetches whatever the API says has
 * changed (decision D12). Messages only carry ids, so the data itself still
 * comes through the normal, permission-checked endpoints. Off with the mock
 * API, which has no hub; pages then keep polling.
 */
export function LiveUpdates() {
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  // Reconnect when the signed-in user or their businesses change, so the hub
  // knows who is listening. Joined into a string to keep the effect stable.
  const userId = user?.id ?? null;
  const organizationIds = user?.memberships.map((m) => m.organizationId).join(",") ?? "";

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCKS === "true" || status === "loading") return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => currentAccessToken() ?? "",
        // WebSockets first; the others are fallbacks for strict proxies.
        transport:
          HttpTransportType.WebSockets |
          HttpTransportType.ServerSentEvents |
          HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: ({ previousRetryCount }) => retryDelay(previousRetryCount),
      })
      // Failures are handled below (polling carries on), and leaving a page
      // mid-connect is normal, so SignalR's own console errors are only noise.
      .configureLogging(LogLevel.None)
      .build();

    connection.on("ListingsChanged", () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
    });
    connection.on("OrganizationChanged", ({ organizationId }: { organizationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.detail(organizationId) });
    });
    connection.on("NotificationsChanged", () => {
      // A new notification means a reservation changed too (collected, no-show...).
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: reservationKeys.all });
    });

    /** Staff join their businesses' groups; the hub checks membership. */
    const watchOrganizations = async () => {
      for (const id of organizationIds.split(",").filter(Boolean)) {
        // A failed join (an expired token, removed from the business) only
        // means that business's pages keep polling.
        await connection.invoke("WatchOrganization", id).catch(() => undefined);
      }
    };

    connection.onreconnecting(() => setLiveConnected(false));
    connection.onreconnected(async () => {
      setLiveConnected(true);
      await watchOrganizations();
      // Pushes sent while disconnected are lost: catch up once.
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    connection.onclose(() => setLiveConnected(false));

    // Automatic reconnect only covers a connection that once worked, so the
    // first start is retried here (the API may still be starting up).
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let starting: Promise<void> = Promise.resolve();
    const start = (attempt: number) => {
      starting = connection
        .start()
        .then(async () => {
          if (stopped) return;
          setLiveConnected(true);
          await watchOrganizations();
        })
        .catch(() => {
          setLiveConnected(false);
          // Polling carries on meanwhile.
          if (!stopped) retryTimer = setTimeout(() => start(attempt + 1), retryDelay(attempt + 1));
        });
    };
    start(0);

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      setLiveConnected(false);
      // Stopping mid-start rejects start(); wait for it so nothing is left open.
      void starting.finally(() => {
        if (connection.state !== HubConnectionState.Disconnected) void connection.stop();
      });
    };
  }, [queryClient, status, userId, organizationIds]);

  return null;
}
