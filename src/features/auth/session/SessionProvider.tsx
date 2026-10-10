import { useCallback, useMemo, useState, type ReactNode } from "react";
import { getNavRole, SessionContext, type SessionUser } from "./session-context";

const STORAGE_KEY = "plateback.dev-session";

/** In development, remember the chosen user across reloads. */
function loadStoredUser(): SessionUser | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: SessionUser | null) {
  if (!import.meta.env.DEV) return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session still works in memory.
  }
}

/** Holds the current user. Replaced by real authentication in step 9. */
export function SessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  /** Lets tests start as a given user. */
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    initialUser !== undefined ? initialUser : loadStoredUser(),
  );

  const signInAs = useCallback((next: SessionUser) => {
    setUser(next);
    storeUser(next);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    storeUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, navRole: getNavRole(user), signInAs, signOut }),
    [user, signInAs, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
