import { Bell } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

/** Link to the notifications page. The unread count is added with the mock API. */
export function NotificationsButton() {
  return (
    <Button asChild variant="ghost" size="icon">
      <Link to="/me/notifications" aria-label="Notifications">
        <Bell aria-hidden="true" className="size-5" />
      </Link>
    </Button>
  );
}
