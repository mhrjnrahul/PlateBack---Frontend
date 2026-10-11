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
            className="flex gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
          >
            {/* Unread dot: primary on white 6.47:1; the bold title and "Unread:" carry the meaning */}
            <span
              aria-hidden="true"
              className={cn(
                "mt-2 size-2 shrink-0 rounded-full",
                n.isRead ? "bg-transparent" : "bg-primary",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className={cn("min-w-0", !n.isRead && "font-semibold")}>
                  {!n.isRead && <span className="sr-only">Unread:</span>} {n.title}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatRelative(n.createdAt)}
                </span>
              </span>
              <span className="block text-sm text-muted-foreground">{n.body}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
