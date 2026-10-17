import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isApiError } from "@/shared/api-client/api-error";
import { setAccessTokenProvider, setTokenRefresher } from "@/shared/api-client/client";
import type { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from "@/shared/types/api";
import { authApi } from "../api/auth-api";
import { AuthContext, getNavRole, type AuthStatus } from "./auth-context";

/*
 * The access token is kept in memory only (design doc 4.6): never in
 * localStorage, so a script injected into the page cannot read it later.
 * The session survives reloads through the refresh token instead.
 */
let accessToken: string | null = null;
setAccessTokenProvider(() => accessToken);

/**
 * "Was signed in on this device": not a token or anything secret, only a
 * hint, so visitors who never logged in don't send a refresh request (and get
 * a 401) on every page load.
 */
export const SESSION_HINT_KEY = "plateback.signed-in";
function setSessionHint(on: boolean) {
  try {
    if (on) localStorage.setItem(SESSION_HINT_KEY, "1");
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage blocked: the session just won't be restored after a reload.
  }
}
function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * One refresh at a time. The refresh token rotates on every use, so two calls
 * sent with the same cookie (React's double mount in development, or several
 * requests whose access token expired together) would look like a stolen
 * token to the API. Callers that arrive while one is running share it.
 */
let refreshing: Promise<AuthResponse> | null = null;
function refreshSession() {
  refreshing ??= authApi.refresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Only the API saying no (401) ends the session; a failed connection does not. */
function sessionEnded(error: unknown) {
  return isApiError(error) && error.status === 401;
}

type State = { status: AuthStatus; user: CurrentUser | null };
type SetState = (state: State) => void;

/** Stores the new token and user. Outside the component: it only touches module state. */
function signIn(auth: AuthResponse, setState: SetState) {
  accessToken = auth.accessToken;
  setSessionHint(true);
  setState({ status: "authenticated", user: auth.user });
  return auth.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Without a session hint there is nothing to restore: start signed out.
  const [state, setState] = useState<State>(() => ({
    status: hasSessionHint() ? "loading" : "anonymous",
    user: null,
  }));

  const signOutLocally = useCallback(() => {
    accessToken = null;
    setSessionHint(false);
    setState({ status: "anonymous", user: null });
    // Drop everything cached for the previous user.
    queryClient.clear();
  }, [queryClient]);

  // Restore the session on startup, and let the API client refresh expired tokens.
  useEffect(() => {
    let active = true;
    if (hasSessionHint()) {
      refreshSession()
        .then((auth) => active && signIn(auth, setState))
        .catch((error: unknown) => {
          // Keep the hint after a network failure (offline, API restarting,
          // or the page reloading mid-request): the next load tries again.
          if (sessionEnded(error)) setSessionHint(false);
          if (active) setState({ status: "anonymous", user: null });
        });
    }

    setTokenRefresher(async () => {
      try {
        signIn(await refreshSession(), setState);
        return true;
      } catch (error) {
        if (sessionEnded(error)) signOutLocally();
        return false;
      }
    });
    return () => {
      active = false;
      setTokenRefresher(null);
    };
  }, [signOutLocally]);

  const login = useCallback(
    async (body: LoginRequest) => signIn(await authApi.login(body), setState),
    [],
  );

  const register = useCallback(
    async (body: RegisterRequest) => signIn(await authApi.register(body), setState),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);

  const reloadUser = useCallback(async () => {
    const user = await authApi.me();
    setState({ status: "authenticated", user });
  }, []);

  const value = useMemo(
    () => ({ ...state, navRole: getNavRole(state.user), login, register, logout, reloadUser }),
    [state, login, register, logout, reloadUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
