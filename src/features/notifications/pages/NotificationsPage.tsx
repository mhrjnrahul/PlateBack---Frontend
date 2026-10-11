import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState } from "@/shared/ui/states";
import { notificationsQuery, useMarkAllNotificationsRead } from "../api/notifications-api";
import { NotificationList } from "../components/NotificationList";

/** In-app notifications, created by the outbox and delivered live (wireframe M6). */
export function NotificationsPage() {
  usePageTitle("Notifications");
  const { data, isPending, isError, error, refetch } = useQuery(notificationsQuery(50));
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="page-container max-w-3xl py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {data.unreadCount === 0 ? "You're all caught up." : `${data.unreadCount} unread`}
            </p>
          )}
        </div>
        {data && data.unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mt-6">
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : isPending ? (
          <div className="h-64 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
        ) : data.items.length === 0 ? (
          <EmptyState title="No notifications yet">
            Reservation updates and new listings nearby appear here.
          </EmptyState>
        ) : (
          <div className="rounded-xl border px-2">
            <NotificationList notifications={data.items} />
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Delivered in the app, and by email when email is enabled.
      </p>
    </div>
  );
}
