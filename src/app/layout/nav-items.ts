import { getNavRole, type SessionUser } from "@/features/auth/session/session-context";

/** A link in the header, account menu or footer. */
export type NavItem = {
  label: string;
  to: string;
};

/** Main header links for the current user's role. */
export function getMainNavItems(user: SessionUser | null): NavItem[] {
  switch (getNavRole(user)) {
    case "visitor":
      return [
        { label: "Browse", to: "/browse" },
        { label: "How it works", to: "/#how-it-works" },
        { label: "For businesses", to: "/#for-businesses" },
      ];
    case "customer":
      return [
        { label: "Browse", to: "/browse" },
        { label: "My reservations", to: "/me/reservations" },
      ];
    case "business": {
      const orgId = user?.organization?.id ?? "";
      return [
        { label: "Dashboard", to: `/org/${orgId}` },
        { label: "New listing", to: `/org/${orgId}/listings/new` },
        { label: "Browse", to: "/browse" },
      ];
    }
    case "admin":
      return [
        { label: "Organizations", to: "/admin/organizations" },
        { label: "Browse", to: "/browse" },
      ];
  }
}

/** Links in the account menu (signed-in users only). */
export function getAccountMenuItems(user: SessionUser): NavItem[] {
  switch (getNavRole(user)) {
    case "business": {
      const orgId = user.organization?.id ?? "";
      return [
        { label: "Business dashboard", to: `/org/${orgId}` },
        { label: "My reservations", to: "/me/reservations" },
        { label: "Notifications", to: "/me/notifications" },
      ];
    }
    case "admin":
      return [
        { label: "Organizations", to: "/admin/organizations" },
        { label: "Notifications", to: "/me/notifications" },
      ];
    default:
      return [
        { label: "My reservations", to: "/me/reservations" },
        { label: "Notifications", to: "/me/notifications" },
      ];
  }
}

/** Footer links; sign-up and log-in links are only for visitors. */
export function getFooterNavItems(user: SessionUser | null): NavItem[] {
  const items: NavItem[] = [
    { label: "Browse listings", to: "/browse" },
    { label: "How it works", to: "/#how-it-works" },
  ];
  if (!user) {
    items.push({ label: "List your surplus", to: "/register" }, { label: "Log in", to: "/login" });
  }
  return items;
}
