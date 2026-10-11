import { db, type MockListing, type MockUser } from "./db";
import { newId } from "./utils";
import type { NotificationType } from "@/shared/types/api";

/** Business-rule parameters (design doc 5.6). */
export const RULES = {
  maxPerListing: 2,
  maxActive: 3,
  maxActiveLowReliability: 1,
  lowReliabilityBelow: 60,
  collectBonus: 2,
  lateCancelPenalty: 5,
  noShowPenalty: 20,
  radiusDefaultKm: 5,
  radiusMaxKm: 25,
  windowMinMinutes: 15,
  windowMaxHours: 12,
} as const;

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 characters, no 0 1 I L O

/** A new unique pickup code like "K7M2-9QXA". */
export function newPickupCode() {
  const used = new Set(db.reservations.map((r) => r.pickupCode));
  for (;;) {
    const chars = Array.from(
      crypto.getRandomValues(new Uint32Array(8)),
      (n) => CODE_ALPHABET[n % 31],
    );
    const code = `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
    if (!used.has(code)) return code;
  }
}

/** "k7m2 9qxa" -> "K7M2-9QXA" */
export function normalizePickupCode(input: string) {
  const raw = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
}

export function clampReliability(score: number) {
  return Math.max(0, Math.min(100, score));
}

/** Active reservations a user may hold at once (1 when reliability is low). */
export function activeLimitFor(user: MockUser) {
  return user.reliabilityScore < RULES.lowReliabilityBelow
    ? RULES.maxActiveLowReliability
    : RULES.maxActive;
}

/** Great-circle distance in km (the Haversine formula from design doc 5.5). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function isOpenForReservations(listing: MockListing, now = new Date()) {
  return listing.status === "Active" && new Date(listing.pickupEnd) > now;
}

export function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  db.notifications.unshift({
    id: newId(),
    userId,
    type,
    title,
    body,
    isRead: false,
    createdAt: new Date().toISOString(),
    data,
  });
}

/** Owners and staff of an organization. */
export function memberIds(organizationId: string) {
  return db.memberships.filter((m) => m.organizationId === organizationId).map((m) => m.userId);
}

/**
 * The ExpireListingsJob (design doc 2.6), run lazily before every request:
 * listings past their window become Expired, uncollected reservations become
 * NoShow and the customer loses reliability.
 */
export function applyExpiry(now = new Date()) {
  for (const listing of db.listings) {
    if (
      (listing.status === "Active" || listing.status === "SoldOut") &&
      new Date(listing.pickupEnd) <= now
    ) {
      listing.status = "Expired";
    }
  }
  for (const reservation of db.reservations) {
    if (reservation.status === "Reserved" && new Date(reservation.expiresAt) <= now) {
      reservation.status = "NoShow";
      const user = db.users.find((u) => u.id === reservation.userId);
      if (user)
        user.reliabilityScore = clampReliability(user.reliabilityScore - RULES.noShowPenalty);
      notify(
        reservation.userId,
        "ReservationNoShow",
        "Reservation not collected",
        "The pickup window ended before the food was collected. Reliability -20.",
        { reservationId: reservation.id },
      );
    }
  }
}
