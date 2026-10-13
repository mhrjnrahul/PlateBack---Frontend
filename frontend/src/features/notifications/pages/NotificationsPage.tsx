import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState } from "@/shared/ui/states";
import { notificationsQuery, useMarkAllNotificationsRead } from "../api/notifications-api";
import { NotificationList } from "../components/NotificationList";
import { PageHeader } from "@/shared/ui/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

/** In-app notifications, created by the outbox and delivered live (wireframe M6). */
export function NotificationsPage() {
  usePageTitle("Notifications");
  const { data, isPending, isError, error, refetch } = useQuery(notificationsQuery(50));
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="page-container max-w-3xl py-8 md:py-10">
      <PageHeader
        title="Notifications"
        description={
          data && (data.unreadCount === 0 ? "You're all caught up." : `${data.unreadCount} unread`)
        }
        actions={
          data &&
          data.unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              Mark all as read
            </Button>
          )
        }
      />

      <div className="mt-6">
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : data.items.length === 0 ? (
          <EmptyState title="Nothing here yet">
            We'll let you know when a reservation changes or a pickup window is about to open.
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
