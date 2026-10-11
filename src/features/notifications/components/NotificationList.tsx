import { Link } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { formatRelative } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { Notification } from "@/shared/types/api";
import { useMarkNotificationRead } from "../api/notifications-api";

/**
 * Where a notification leads. Its data holds deep-link ids: notifications for
 * a business carry the organizationId, a customer's carry the reservation or
 * listing.
 */
function useNotificationHref() {
  const { user } = useAuth();
  return (n: Notification) => {
    if (n.data.organizationId) {
      return user?.role === "Admin" ? "/admin/organizations" : `/org/${n.data.organizationId}`;
    }
    if (n.data.reservationId) return "/me/reservations";
    if (n.data.listingId) return `/listings/${n.data.listingId}`;
    return "/me/notifications";
  };
}

/** Notifications with unread markers; choosing one marks it read (wireframe M6). */
export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const markRead = useMarkNotificationRead();
  const hrefFor = useNotificationHref();
  return (
    <ul className="divide-y">
      {notifications.map((n) => (
        <li key={n.id}>
          <Link
            to={hrefFor(n)}
            onClick={() => !n.isRead && markRead.mutate(n.id)}
            className="flex gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-1.5 size-2.5 shrink-0 rounded-full",
                n.isRead ? "border border-input" : "bg-highlight",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className={cn("block", !n.isRead && "font-semibold")}>
                {!n.isRead && <span className="sr-only">Unread:</span>} {n.title}
              </span>
              <span className="block text-sm text-muted-foreground">{n.body}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatRelative(n.createdAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
