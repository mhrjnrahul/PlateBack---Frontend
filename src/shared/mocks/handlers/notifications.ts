import { http, HttpResponse } from "msw";
import type { NotificationPage } from "@/shared/types/api";
import { db } from "../db";
import { apiUrl, paginate, readPaging } from "../utils";
import { currentUser, handle, notFound, unauthenticated } from "./context";

export const notificationHandlers = [
  // GET /notifications: newest first, with the unread count
  http.get(
    apiUrl("/notifications"),
    handle(({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const mine = db.notifications
        .filter((n) => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: n.isRead,
          createdAt: n.createdAt,
          data: n.data,
        }));
      const { page, pageSize } = readPaging(new URL(request.url));
      const body: NotificationPage = {
        ...paginate(mine, page, pageSize),
        unreadCount: mine.filter((n) => !n.isRead).length,
      };
      return HttpResponse.json(body);
    }),
  ),

  http.post(
    apiUrl("/notifications/read-all"),
    handle(({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      for (const n of db.notifications) if (n.userId === user.id) n.isRead = true;
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.post(
    apiUrl("/notifications/:id/read"),
    handle(({ request, params }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const notification = db.notifications.find((n) => n.id === params.id && n.userId === user.id);
      if (!notification) return notFound("Notification");
      notification.isRead = true;
      return new HttpResponse(null, { status: 204 });
    }),
  ),
];
