import type { DefaultBodyType, HttpResponseResolver, PathParams } from "msw";
import { db, saveDb, type MockUser } from "../db";
import { applyExpiry } from "../rules";
import { mockDelay, problem } from "../utils";

/** Mock access tokens are "mock-access.<userId>" (the real API issues JWTs). */
export const tokenFor = (userId: string) => `mock-access.${userId}`;

/** The signed-in user from the Authorization header, or null. */
export function currentUser(request: Request): MockUser | null {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer mock-access\.(.+)$/.exec(header);
  return match ? (db.users.find((u) => u.id === match[1]) ?? null) : null;
}

export const unauthenticated = () =>
  problem(401, "UNAUTHENTICATED", "Not signed in", "Log in to continue.");

export const forbidden = (detail = "You do not have access to this.") =>
  problem(403, "NOT_ORG_MEMBER", "Forbidden", detail);

export const notFound = (what = "Resource") => problem(404, "NOT_FOUND", `${what} not found`);

export function isMember(userId: string, organizationId: string) {
  return db.memberships.some((m) => m.userId === userId && m.organizationId === organizationId);
}

/**
 * Wraps every mock handler: simulated latency, the lazy expiry job before
 * reading data (design decision D10), and saving changes afterwards.
 */
export function handle<Params extends PathParams, Body extends DefaultBodyType>(
  resolver: HttpResponseResolver<Params, Body>,
): HttpResponseResolver<Params, Body> {
  return async (info) => {
    await mockDelay();
    applyExpiry();
    const response = await resolver(info);
    saveDb();
    return response;
  };
}

/** Reads a JSON body, or {} when it is missing or invalid. */
export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}
