import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "react-router";
import { notificationsQuery } from "@/features/notifications/api/notifications-api";
import { Button } from "@/shared/ui/button";

/** Bell link to notifications, with the unread count (polled every 30 s). */
export function NotificationsButton() {
  const { data } = useQuery(notificationsQuery(20));
  const unread = data?.unreadCount ?? 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        to="/me/notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell aria-hidden="true" className="size-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[0.6875rem] leading-4 font-bold text-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
