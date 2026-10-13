import { createContext, useContext } from "react";
import type { CurrentUser, LoginRequest, RegisterRequest } from "@/shared/types/api";

/** "loading" while the saved session is restored on startup. */
export type AuthStatus = "loading" | "authenticated" | "anonymous";

/** Which navigation a user sees. */
export type NavRole = "visitor" | "customer" | "business" | "admin";

export type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  navRole: NavRole;
  login: (body: LoginRequest) => Promise<CurrentUser>;
  register: (body: RegisterRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  /** Re-reads /users/me (reliability score and memberships change over time). */
  reloadUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Two-level roles (design decision D8): a global role (Customer or Admin)
 * plus memberships in organizations. A member of an organization gets the
 * business navigation and can still reserve food like any customer.
 */
export function getNavRole(user: CurrentUser | null): NavRole {
  if (!user) return "visitor";
  if (user.role === "Admin") return "admin";
  if (user.memberships.length > 0) return "business";
  return "customer";
}

/** The organization a business user works for (the first membership). */
export function primaryOrganizationId(user: CurrentUser | null) {
  return user?.memberships[0]?.organizationId ?? null;
}

/** Where each role starts after logging in. */
export function homeFor(user: CurrentUser) {
  if (user.role === "Admin") return "/admin/organizations";
  if (user.memberships[0]) return `/org/${user.memberships[0].organizationId}`;
  return "/browse";
}

/** The signed-in user and auth actions. Must be used inside <AuthProvider>. */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
