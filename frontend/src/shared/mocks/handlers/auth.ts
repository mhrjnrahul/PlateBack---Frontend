import { http, HttpResponse } from "msw";
import type { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from "@/shared/types/api";
import { db, type MockUser } from "../db";
import { MOCK_SESSION_KEY } from "../storage-keys";
import { apiUrl, newId, problem } from "../utils";
import { currentUser, handle, readJson, tokenFor, unauthenticated } from "./context";

const ACCESS_TOKEN_SECONDS = 15 * 60;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * The real API keeps the refresh token in an httpOnly cookie. A service
 * worker cannot fake that cookie, so the mock remembers the signed-in user in
 * localStorage instead (or in memory when storage is unavailable). The app's
 * code is the same either way: it just calls POST /auth/refresh.
 */
let memorySession: string | null = null;
function setSession(userId: string | null) {
  memorySession = userId;
  try {
    if (userId) localStorage.setItem(MOCK_SESSION_KEY, userId);
    else localStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // memory only
  }
}
function getSession() {
  try {
    // Storage is the source of truth when it works; memory is only a fallback.
    return localStorage.getItem(MOCK_SESSION_KEY);
  } catch {
    return memorySession;
  }
}

export function toCurrentUser(user: MockUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    reliabilityScore: user.reliabilityScore,
    isSuspended: user.isSuspended,
    memberships: db.memberships
      .filter((m) => m.userId === user.id)
      .map((m) => ({
        organizationId: m.organizationId,
        organizationName: db.organizations.find((o) => o.id === m.organizationId)!.name,
        role: m.role,
      })),
  };
}

function authResponse(user: MockUser): AuthResponse {
  setSession(user.id);
  return {
    accessToken: tokenFor(user.id),
    expiresIn: ACCESS_TOKEN_SECONDS,
    user: toCurrentUser(user),
  };
}

export const authHandlers = [
  http.post(
    apiUrl("/auth/login"),
    handle(async ({ request }) => {
      const { email, password } = await readJson<LoginRequest>(request);
      const user = db.users.find((u) => u.email.toLowerCase() === email?.trim().toLowerCase());
      if (!user || user.password !== password) {
        return problem(401, "UNAUTHENTICATED", "Login failed", "Email or password is incorrect.");
      }
      if (user.isSuspended) {
        return problem(
          403,
          "ACCOUNT_SUSPENDED",
          "Account suspended",
          "This account has been suspended. Contact support.",
        );
      }
      return HttpResponse.json(authResponse(user));
    }),
  ),

  http.post(
    apiUrl("/auth/register"),
    handle(async ({ request }) => {
      const body = await readJson<RegisterRequest>(request);
      const errors: Record<string, string[]> = {};
      const name = body.displayName?.trim() ?? "";
      const email = body.email?.trim().toLowerCase() ?? "";
      if (name.length < 2 || name.length > 60)
        errors.displayName = ["Enter your name (2-60 characters)."];
      if (!EMAIL.test(email)) errors.email = ["Enter a valid email address."];
      else if (db.users.some((u) => u.email.toLowerCase() === email))
        errors.email = ["An account with this email already exists."];
      if ((body.password?.length ?? 0) < 8) errors.password = ["Use at least 8 characters."];
      if (Object.keys(errors).length)
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, errors);

      const user: MockUser = {
        id: newId(),
        email,
        password: body.password!,
        displayName: name,
        role: "Customer",
        reliabilityScore: 100,
        isSuspended: false,
      };
      db.users.push(user);
      return HttpResponse.json(authResponse(user), { status: 201 });
    }),
  ),

  http.post(
    apiUrl("/auth/refresh"),
    handle(() => {
      const user = db.users.find((u) => u.id === getSession());
      if (!user || user.isSuspended) {
        setSession(null);
        return problem(401, "UNAUTHENTICATED", "Session expired", "Please log in again.");
      }
      return HttpResponse.json(authResponse(user));
    }),
  ),

  http.post(
    apiUrl("/auth/logout"),
    handle(() => {
      setSession(null);
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.get(
    apiUrl("/users/me"),
    handle(({ request }) => {
      const user = currentUser(request);
      return user ? HttpResponse.json(toCurrentUser(user)) : unauthenticated();
    }),
  ),
];
