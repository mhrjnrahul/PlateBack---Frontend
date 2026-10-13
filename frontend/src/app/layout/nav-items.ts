import {
  Bell,
  CalendarCheck,
  LayoutDashboard,
  PlusCircle,
  ScanLine,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getNavRole, primaryOrganizationId } from "@/features/auth/session/auth-context";
import type { CurrentUser } from "@/shared/types/api";

/** A link in the header, account menu or footer. */
export type NavItem = {
  label: string;
  to: string;
};

/** A tab in the mobile bottom tab bar. */
export type TabItem = NavItem & { icon: LucideIcon };

/** Main header links for the current user's role. */
export function getMainNavItems(user: CurrentUser | null): NavItem[] {
  const orgId = primaryOrganizationId(user);
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
    case "business":
      return [
        { label: "Dashboard", to: `/org/${orgId}` },
        { label: "Pickup", to: `/org/${orgId}/pickup` },
        { label: "New listing", to: `/org/${orgId}/listings/new` },
        { label: "Browse", to: "/browse" },
      ];
    case "admin":
      return [
        { label: "Organizations", to: "/admin/organizations" },
        { label: "Browse", to: "/browse" },
      ];
  }
}

/** Links in the account menu (signed-in users only). */
export function getAccountMenuItems(user: CurrentUser): NavItem[] {
  const orgId = primaryOrganizationId(user);
  const common = [
    { label: "My reservations", to: "/me/reservations" },
    { label: "Notifications", to: "/me/notifications" },
  ];
  switch (getNavRole(user)) {
    case "business":
      return [
        { label: "Business dashboard", to: `/org/${orgId}` },
        { label: "Pickup counter", to: `/org/${orgId}/pickup` },
        ...common,
      ];
    case "admin":
      return [
        { label: "Organizations", to: "/admin/organizations" },
        { label: "Notifications", to: "/me/notifications" },
      ];
    default:
      return [...common, { label: "List your business", to: "/org/new" }];
  }
}

/** Footer links; sign-up and log-in links are only for visitors. */
export function getFooterNavItems(user: CurrentUser | null): NavItem[] {
  const items: NavItem[] = [
    { label: "Browse listings", to: "/browse" },
    { label: "How it works", to: "/#how-it-works" },
  ];
  if (!user) {
    items.push(
      { label: "List your surplus", to: "/register?next=business" },
      { label: "Log in", to: "/login" },
    );
  }
  return items;
}

/** Mobile tab bar per role; visitors get none. */
export function getTabItems(user: CurrentUser | null): TabItem[] {
  const orgId = primaryOrganizationId(user);
  switch (getNavRole(user)) {
    case "customer":
      return [
        { label: "Browse", to: "/browse", icon: Search },
        { label: "Reservations", to: "/me/reservations", icon: CalendarCheck },
        { label: "Notifications", to: "/me/notifications", icon: Bell },
      ];
    case "business":
      return [
        { label: "Dashboard", to: `/org/${orgId}`, icon: LayoutDashboard },
        { label: "Pickup", to: `/org/${orgId}/pickup`, icon: ScanLine },
        { label: "New listing", to: `/org/${orgId}/listings/new`, icon: PlusCircle },
        { label: "Browse", to: "/browse", icon: Search },
      ];
    case "admin":
      return [
        { label: "Review", to: "/admin/organizations", icon: ShieldCheck },
        { label: "Browse", to: "/browse", icon: Search },
        { label: "Notifications", to: "/me/notifications", icon: Bell },
      ];
    default:
      return [];
  }
}
