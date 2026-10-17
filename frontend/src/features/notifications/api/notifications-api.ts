import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api-client/client";
import { livePollInterval } from "@/shared/live/live-status";
import type { NotificationPage } from "@/shared/types/api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (pageSize: number) => [...notificationKeys.all, pageSize] as const,
};

/** Notifications arrive through the outbox (decision D11) and are pushed over SignalR; polled every 30 s without it. */
export function notificationsQuery(pageSize = 20) {
  return queryOptions({
    queryKey: notificationKeys.list(pageSize),
    queryFn: ({ signal }) =>
      api.get<NotificationPage>("/notifications", { query: { pageSize }, signal }),
    refetchInterval: () => livePollInterval(30_000),
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => api.post<void>("/notifications/read-all"),
    onSuccess: invalidate,
  });
}
