import { http, HttpResponse } from "msw";
import type {
  CreateReservationRequest,
  ReservationScope,
  VerifyPickupRequest,
} from "@/shared/types/api";
import { db } from "../db";
import {
  activeLimitFor,
  clampReliability,
  isOpenForReservations,
  memberIds,
  newPickupCode,
  normalizePickupCode,
  notify,
  RULES,
} from "../rules";
import { apiUrl, newId, paginate, problem, readPaging } from "../utils";
import { currentUser, handle, isMember, notFound, readJson, unauthenticated } from "./context";
import { toOrganizationReservation, toReservation, toReservationWithListing } from "./serialize";

export const reservationHandlers = [
  // POST /listings/{id}/reservations: the critical path (design doc 4.4)
  http.post(
    apiUrl("/listings/:id/reservations"),
    handle(async ({ request, params }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      if (user.isSuspended) {
        return problem(
          403,
          "ACCOUNT_SUSPENDED",
          "Account suspended",
          "Your account cannot make reservations.",
        );
      }

      const { quantity } = await readJson<CreateReservationRequest>(request);
      if (!Number.isInteger(quantity) || quantity! < 1 || quantity! > RULES.maxPerListing) {
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, {
          quantity: [`Choose between 1 and ${RULES.maxPerListing}.`],
        });
      }
      const qty = quantity!;

      const listing = db.listings.find((l) => l.id === params.id);
      if (!listing) return notFound("Listing");
      const now = new Date();
      if (
        listing.status === "Cancelled" ||
        listing.status === "Expired" ||
        new Date(listing.pickupEnd) <= now
      ) {
        return problem(
          409,
          "WINDOW_CLOSED",
          "Pickup window closed",
          "This listing is no longer open for reservations.",
        );
      }

      const active = db.reservations.filter((r) => r.userId === user.id && r.status === "Reserved");
      if (active.some((r) => r.listingId === listing.id)) {
        return problem(
          409,
          "LIMIT_REACHED",
          "Already reserved",
          "You already have a reservation for this listing.",
        );
      }
      const limit = activeLimitFor(user);
      if (active.length >= limit) {
        return problem(
          409,
          "LIMIT_REACHED",
          "Reservation limit reached",
          limit === 1
            ? "Your reliability score is below 60, so you can hold 1 active reservation at a time."
            : `You can hold up to ${limit} active reservations at a time.`,
        );
      }

      // The conditional UPDATE from design doc 5.5: only succeeds if enough stock is left
      if (!isOpenForReservations(listing, now) || listing.quantityAvailable < qty) {
        return problem(
          409,
          "SOLD_OUT",
          "No longer available",
          `Only ${listing.quantityAvailable} units remain for this listing.`,
        );
      }
      listing.quantityAvailable -= qty;
      if (listing.quantityAvailable === 0) listing.status = "SoldOut";

      const reservation = {
        id: newId(),
        userId: user.id,
        listingId: listing.id,
        quantity: qty,
        status: "Reserved" as const,
        pickupCode: newPickupCode(),
        reservedAt: now.toISOString(),
        expiresAt: listing.pickupEnd,
        collectedAt: null,
        cancelledAt: null,
        lateCancel: false,
      };
      db.reservations.push(reservation);

      const org = db.organizations.find((o) => o.id === listing.organizationId)!;
      notify(
        user.id,
        "ReservationConfirmed",
        "Reservation confirmed",
        `${listing.title} from ${org.name}. Show code ${reservation.pickupCode} at pickup.`,
        { reservationId: reservation.id },
      );
      for (const staffId of memberIds(org.id)) {
        notify(
          staffId,
          "ReservationConfirmed",
          "New reservation",
          `${user.displayName} reserved ${qty} x ${listing.title}.`,
          { reservationId: reservation.id, organizationId: org.id },
        );
      }
      return HttpResponse.json(toReservation(reservation), { status: 201 });
    }),
  ),

  // GET /reservations/mine?status=active|history
  http.get(
    apiUrl("/reservations/mine"),
    handle(({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const url = new URL(request.url);
      const scope = (url.searchParams.get("status") as ReservationScope | null) ?? "active";
      const mine = db.reservations
        .filter((r) => r.userId === user.id)
        .filter((r) => (scope === "active" ? r.status === "Reserved" : r.status !== "Reserved"))
        .map(toReservationWithListing)
        .sort((a, b) =>
          scope === "active"
            ? new Date(a.listing.pickupStart).getTime() - new Date(b.listing.pickupStart).getTime()
            : new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime(),
        );
      const { page, pageSize } = readPaging(url);
      return HttpResponse.json(paginate(mine, page, pageSize));
    }),
  ),

  // GET /reservations/{id}: the customer or the listing's organization
  http.get(
    apiUrl("/reservations/:id"),
    handle(({ request, params }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const reservation = db.reservations.find((r) => r.id === params.id);
      if (!reservation) return notFound("Reservation");
      const listing = db.listings.find((l) => l.id === reservation.listingId)!;
      if (reservation.userId !== user.id && !isMember(user.id, listing.organizationId)) {
        return notFound("Reservation"); // hidden, not forbidden (design doc 6.4)
      }
      return HttpResponse.json(toReservationWithListing(reservation));
    }),
  ),

  // POST /reservations/{id}/cancel
  http.post(
    apiUrl("/reservations/:id/cancel"),
    handle(({ request, params }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const reservation = db.reservations.find((r) => r.id === params.id && r.userId === user.id);
      if (!reservation) return notFound("Reservation");
      if (reservation.status === "Collected") {
        return problem(
          409,
          "ALREADY_COLLECTED",
          "Already collected",
          "This reservation was already collected.",
        );
      }
      if (reservation.status !== "Reserved") {
        return problem(
          409,
          "WINDOW_CLOSED",
          "Cannot cancel",
          "This reservation is no longer active.",
        );
      }

      const now = new Date();
      const listing = db.listings.find((l) => l.id === reservation.listingId)!;
      reservation.status = "Cancelled";
      reservation.cancelledAt = now.toISOString();
      // Cancelling after the window opened is a late cancellation (-5)
      reservation.lateCancel = now >= new Date(listing.pickupStart);
      if (reservation.lateCancel)
        user.reliabilityScore = clampReliability(user.reliabilityScore - RULES.lateCancelPenalty);

      // Stock goes back only while the listing is still open
      if (
        new Date(listing.pickupEnd) > now &&
        (listing.status === "Active" || listing.status === "SoldOut")
      ) {
        listing.quantityAvailable += reservation.quantity;
        listing.status = "Active";
      }
      for (const staffId of memberIds(listing.organizationId)) {
        notify(
          staffId,
          "ReservationCancelled",
          "Reservation cancelled",
          `${user.displayName} cancelled ${reservation.quantity} x ${listing.title}.`,
          { reservationId: reservation.id, organizationId: listing.organizationId },
        );
      }
      return HttpResponse.json(toReservation(reservation));
    }),
  ),

  // POST /reservations/verify: handover at the counter (flow D)
  http.post(
    apiUrl("/reservations/verify"),
    handle(async ({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const { pickupCode } = await readJson<VerifyPickupRequest>(request);
      if (!pickupCode?.trim()) {
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, {
          pickupCode: ["Enter the customer's pickup code."],
        });
      }

      const code = normalizePickupCode(pickupCode);
      const reservation = db.reservations.find((r) => r.pickupCode === code);
      const listing = reservation && db.listings.find((l) => l.id === reservation.listingId);
      // A code from another organization fails exactly like an unknown code
      if (!reservation || !listing || !isMember(user.id, listing.organizationId)) {
        return problem(
          404,
          "NOT_FOUND",
          "Code not found",
          "No reservation with this code for your organization.",
        );
      }
      if (reservation.status === "Collected") {
        return problem(
          409,
          "CODE_ALREADY_USED",
          "Code already used",
          "This code was already used for a pickup.",
        );
      }
      if (reservation.status !== "Reserved") {
        return problem(
          409,
          "WINDOW_CLOSED",
          "Reservation not active",
          `This reservation is ${reservation.status === "NoShow" ? "a no-show" : "cancelled"}.`,
        );
      }

      reservation.status = "Collected";
      reservation.collectedAt = new Date().toISOString();
      const customer = db.users.find((u) => u.id === reservation.userId)!;
      customer.reliabilityScore = clampReliability(customer.reliabilityScore + RULES.collectBonus);
      notify(
        customer.id,
        "ReservationCollected",
        "Thanks for rescuing food!",
        `Collected: ${listing.title}.`,
        { reservationId: reservation.id },
      );
      return HttpResponse.json(toOrganizationReservation(reservation));
    }),
  ),
];
