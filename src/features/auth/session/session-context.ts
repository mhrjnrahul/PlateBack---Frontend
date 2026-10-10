import { createContext, useContext } from "react";

/**
 * Temporary session model until login is built (step 9).
 *
 * Mirrors the design document's two-level roles: a global role (customer or
 * admin) plus an optional organization membership (owner or staff).
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  organization?: {
    id: string;
    name: string;
    memberRole: "owner" | "staff";
  };
};

/** Which navigation a user sees. */
export type NavRole = "visitor" | "customer" | "business" | "admin";

export type SessionContextValue = {
  user: SessionUser | null;
  navRole: NavRole;
  signInAs: (user: SessionUser) => void;
  signOut: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function getNavRole(user: SessionUser | null): NavRole {
  if (!user) return "visitor";
  if (user.role === "admin") return "admin";
  if (user.organization) return "business";
  return "customer";
}

/** The signed-in user and helpers. Must be used inside <SessionProvider>. */
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
