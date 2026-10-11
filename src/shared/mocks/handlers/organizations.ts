import { http, HttpResponse } from "msw";
import type {
  CreateOrganizationRequest,
  ListingCategory,
  ListingInput,
  Organization,
  OrganizationStats,
} from "@/shared/types/api";
import { db, type MockListing, type MockOrganization } from "../db";
import { memberIds, notify, RULES } from "../rules";
import { apiUrl, newId, paginate, problem, readPaging } from "../utils";
import {
  currentUser,
  forbidden,
  handle,
  isMember,
  notFound,
  readJson,
  unauthenticated,
} from "./context";
import { toListingDetail, toListingSummary, toOrganizationReservation } from "./serialize";

const CATEGORIES: ListingCategory[] = ["Bakery", "Meals", "Groceries", "Beverages", "Other"];
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function toOrganization(org: MockOrganization): Organization {
  const {
    id,
    name,
    address,
    latitude,
    longitude,
    timeZone,
    status,
    createdAt,
    verifiedAt,
    rejectionReason,
  } = org;
  return {
    id,
    name,
    address,
    latitude,
    longitude,
    timeZone,
    status,
    createdAt,
    verifiedAt,
    rejectionReason,
  };
}

/** Listing rules shared by create and update (design doc 5.4 and 5.6). */
function validateListing(input: Partial<ListingInput>, minQuantity = 1) {
  const errors: Record<string, string[]> = {};
  const add = (field: string, message: string) => (errors[field] ??= []).push(message);
  const title = input.title?.trim() ?? "";
  if (title.length < 3 || title.length > 80) add("title", "Title must be 3-80 characters.");
  if (!input.category || !CATEGORIES.includes(input.category))
    add("category", "Choose a category.");
  if (
    !Number.isInteger(input.quantityTotal) ||
    input.quantityTotal! < minQuantity ||
    input.quantityTotal! > 200
  ) {
    add(
      "quantityTotal",
      minQuantity > 1
        ? `Quantity must be ${minQuantity}-200 (already reserved: ${minQuantity}).`
        : "Quantity must be 1-200.",
    );
  }
  if (typeof input.originalPrice !== "number" || input.originalPrice < 0)
    add("originalPrice", "Enter the original price.");
  if (typeof input.price !== "number" || input.price < 0)
    add("price", "Enter a price (0 for free).");
  else if (typeof input.originalPrice === "number" && input.price > input.originalPrice)
    add("price", "Price cannot be more than the original price.");
  const start = new Date(input.pickupStart ?? "");
  const end = new Date(input.pickupEnd ?? "");
  if (Number.isNaN(start.getTime())) add("pickupStart", "Enter the pickup start time.");
  if (Number.isNaN(end.getTime())) add("pickupEnd", "Enter the pickup end time.");
  else if (end <= new Date()) add("pickupEnd", "The pickup window must end in the future.");
  else if (!Number.isNaN(start.getTime())) {
    const minutes = (end.getTime() - start.getTime()) / MINUTE;
    if (minutes < RULES.windowMinMinutes || minutes > RULES.windowMaxHours * 60) {
      add("pickupEnd", "The pickup window must be between 15 minutes and 12 hours.");
    }
  }
  if ((input.allergenNotes?.trim().length ?? 0) < 3)
    add("allergenNotes", "Allergen information is required.");
  if (!input.address?.trim()) add("address", "Enter the pickup address.");
  return errors;
}

/** The caller must belong to the organization. Returns an error response or null. */
function memberCheck(request: Request, organizationId: string) {
  const user = currentUser(request);
  if (!user) return { user: null, error: unauthenticated() };
  if (!db.organizations.some((o) => o.id === organizationId))
    return { user, error: notFound("Organization") };
  if (!isMember(user.id, organizationId))
    return { user, error: forbidden("You are not a member of this organization.") };
  return { user, error: null };
}

export const organizationHandlers = [
  // POST /organizations: create a business (starts Pending, caller becomes Owner)
  http.post(
    apiUrl("/organizations"),
    handle(async ({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const body = await readJson<CreateOrganizationRequest>(request);
      const errors: Record<string, string[]> = {};
      if ((body.name?.trim().length ?? 0) < 2) errors.name = ["Enter the business name."];
      if (!body.type?.trim()) errors.type = ["Choose the type of business."];
      if (!body.address?.trim()) errors.address = ["Enter the address."];
      if (typeof body.latitude !== "number" || typeof body.longitude !== "number")
        errors.location = ["Set the location."];
      if (Object.keys(errors).length)
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, errors);

      const org: MockOrganization = {
        id: newId(),
        name: body.name!.trim(),
        address: body.address!.trim(),
        latitude: body.latitude!,
        longitude: body.longitude!,
        timeZone: "Asia/Kathmandu",
        status: "Pending",
        createdAt: new Date().toISOString(),
        verifiedAt: null,
        rejectionReason: null,
        ownerName: user.displayName,
        ownerEmail: user.email,
        phone: body.phone?.trim() || null,
        type: body.type!.trim(),
      };
      db.organizations.push(org);
      db.memberships.push({ userId: user.id, organizationId: org.id, role: "Owner" });
      for (const admin of db.users.filter((u) => u.role === "Admin")) {
        notify(
          admin.id,
          "OrganizationVerified",
          "New business to review",
          `${org.name} is waiting for verification.`,
          { organizationId: org.id },
        );
      }
      return HttpResponse.json(toOrganization(org), { status: 201 });
    }),
  ),

  // GET /organizations/mine
  http.get(
    apiUrl("/organizations/mine"),
    handle(({ request }) => {
      const user = currentUser(request);
      if (!user) return unauthenticated();
      const ids = new Set(
        db.memberships.filter((m) => m.userId === user.id).map((m) => m.organizationId),
      );
      return HttpResponse.json(db.organizations.filter((o) => ids.has(o.id)).map(toOrganization));
    }),
  ),

  // GET /organizations/{id}: public if verified, full for members
  http.get(
    apiUrl("/organizations/:id"),
    handle(({ request, params }) => {
      const org = db.organizations.find((o) => o.id === params.id);
      const user = currentUser(request);
      if (!org || (org.status !== "Verified" && !(user && isMember(user.id, org.id))))
        return notFound("Organization");
      return HttpResponse.json(toOrganization(org));
    }),
  ),

  // GET /organizations/{id}/stats: dashboard KPIs and the 14-day chart
  http.get(
    apiUrl("/organizations/:id/stats"),
    handle(({ request, params }) => {
      const orgId = String(params.id);
      const { error } = memberCheck(request, orgId);
      if (error) return error;
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const listings = db.listings.filter((l) => l.organizationId === orgId);
      const listingIds = new Set(listings.map((l) => l.id));
      const reservations = db.reservations.filter((r) => listingIds.has(r.listingId));
      const collectedOn = (day: Date) =>
        reservations
          .filter(
            (r) =>
              r.status === "Collected" &&
              r.collectedAt &&
              new Date(r.collectedAt).toDateString() === day.toDateString(),
          )
          .reduce((sum, r) => sum + r.quantity, 0);

      // Demo history: a steady pattern per day, plus what was really collected
      const mealsRescuedByDay = Array.from({ length: 14 }, (_, i) => {
        const day = new Date(startOfToday.getTime() - (13 - i) * DAY);
        const pattern = [6, 9, 7, 11, 14, 10, 8, 12, 16, 13, 11, 15, 17, 0][i]!;
        return { date: day.toISOString().slice(0, 10), count: pattern + collectedOn(day) };
      });
      const stats: OrganizationStats = {
        activeListings: listings.filter((l) => l.status === "Active" && new Date(l.pickupEnd) > now)
          .length,
        portionsReserved: reservations
          .filter((r) => r.status === "Reserved")
          .reduce((sum, r) => sum + r.quantity, 0),
        collectedToday: collectedOn(now),
        mealsRescuedThisMonth:
          130 + mealsRescuedByDay.slice(-now.getDate()).reduce((sum, d) => sum + d.count, 0),
        mealsRescuedByDay,
      };
      return HttpResponse.json(stats);
    }),
  ),

  // GET /organizations/{orgId}/listings?status=
  http.get(
    apiUrl("/organizations/:orgId/listings"),
    handle(({ request, params }) => {
      const orgId = String(params.orgId);
      const { error } = memberCheck(request, orgId);
      if (error) return error;
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const now = Date.now();
      const listings = db.listings
        .filter((l) => l.organizationId === orgId && (!status || l.status === status))
        // Open listings first (soonest pickup), then past ones (most recent first)
        .sort((a, b) => {
          const aOpen = new Date(a.pickupEnd).getTime() > now;
          const bOpen = new Date(b.pickupEnd).getTime() > now;
          if (aOpen !== bOpen) return aOpen ? -1 : 1;
          const diff = new Date(a.pickupStart).getTime() - new Date(b.pickupStart).getTime();
          return aOpen ? diff : -diff;
        })
        .map((l) => toListingSummary(l));
      const { page, pageSize } = readPaging(url);
      return HttpResponse.json(paginate(listings, page, pageSize));
    }),
  ),

  // POST /organizations/{orgId}/listings: publish (verified organizations only)
  http.post(
    apiUrl("/organizations/:orgId/listings"),
    handle(async ({ request, params }) => {
      const orgId = String(params.orgId);
      const { error } = memberCheck(request, orgId);
      if (error) return error;
      const org = db.organizations.find((o) => o.id === orgId)!;
      if (org.status !== "Verified") {
        return problem(
          403,
          "ORG_NOT_VERIFIED",
          "Organization not verified",
          "Your business must be verified by an admin before it can publish listings.",
        );
      }
      const input = await readJson<ListingInput>(request);
      const errors = validateListing(input);
      if (Object.keys(errors).length)
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, errors);

      const listing: MockListing = {
        id: newId(),
        organizationId: orgId,
        title: input.title!.trim(),
        category: input.category!,
        description: input.description?.trim() ?? "",
        allergenNotes: input.allergenNotes!.trim(),
        price: input.price!,
        originalPrice: input.originalPrice!,
        quantityTotal: input.quantityTotal!,
        quantityAvailable: input.quantityTotal!,
        pickupStart: new Date(input.pickupStart!).toISOString(),
        pickupEnd: new Date(input.pickupEnd!).toISOString(),
        address: input.address!.trim(),
        latitude: input.latitude ?? org.latitude,
        longitude: input.longitude ?? org.longitude,
        status: "Active",
        imageUrl: null,
        createdAt: new Date().toISOString(),
      };
      db.listings.push(listing);
      return HttpResponse.json(toListingDetail(listing), { status: 201 });
    }),
  ),

  // PUT /listings/{id}: edit; quantity cannot drop below what is already reserved
  http.put(
    apiUrl("/listings/:id"),
    handle(async ({ request, params }) => {
      const listing = db.listings.find((l) => l.id === params.id);
      if (!listing) return notFound("Listing");
      const { error } = memberCheck(request, listing.organizationId);
      if (error) return error;
      const input = await readJson<ListingInput>(request);
      const taken = listing.quantityTotal - listing.quantityAvailable;
      const errors = validateListing(input, Math.max(1, taken));
      if (Object.keys(errors).length)
        return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, errors);
      Object.assign(listing, {
        title: input.title!.trim(),
        category: input.category,
        description: input.description?.trim() ?? "",
        allergenNotes: input.allergenNotes!.trim(),
        price: input.price,
        originalPrice: input.originalPrice,
        quantityTotal: input.quantityTotal,
        quantityAvailable: input.quantityTotal! - taken,
        pickupStart: new Date(input.pickupStart!).toISOString(),
        pickupEnd: new Date(input.pickupEnd!).toISOString(),
        address: input.address!.trim(),
      });
      if (listing.status === "SoldOut" && listing.quantityAvailable > 0) listing.status = "Active";
      return HttpResponse.json(toListingDetail(listing));
    }),
  ),

  // POST /listings/{id}/cancel: cancels its reservations and notifies customers
  http.post(
    apiUrl("/listings/:id/cancel"),
    handle(({ request, params }) => {
      const listing = db.listings.find((l) => l.id === params.id);
      if (!listing) return notFound("Listing");
      const { error } = memberCheck(request, listing.organizationId);
      if (error) return error;
      if (listing.status === "Cancelled" || listing.status === "Expired") {
        return problem(
          409,
          "WINDOW_CLOSED",
          "Listing not active",
          "Only active listings can be cancelled.",
        );
      }
      listing.status = "Cancelled";
      const org = db.organizations.find((o) => o.id === listing.organizationId)!;
      for (const r of db.reservations.filter(
        (r) => r.listingId === listing.id && r.status === "Reserved",
      )) {
        r.status = "Cancelled";
        r.cancelledAt = new Date().toISOString();
        notify(
          r.userId,
          "ListingCancelled",
          "Reservation cancelled by business",
          `${org.name} cancelled ${listing.title}. Sorry about that.`,
          { listingId: listing.id },
        );
      }
      return HttpResponse.json(toListingDetail(listing));
    }),
  ),

  // GET /organizations/{orgId}/reservations: the counter queue
  http.get(
    apiUrl("/organizations/:orgId/reservations"),
    handle(({ request, params }) => {
      const orgId = String(params.orgId);
      const { error } = memberCheck(request, orgId);
      if (error) return error;
      const url = new URL(request.url);
      const listingId = url.searchParams.get("listingId");
      const status = url.searchParams.get("status");
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const listings = new Map(
        db.listings.filter((l) => l.organizationId === orgId).map((l) => [l.id, l]),
      );
      const order = { Reserved: 0, Collected: 1, NoShow: 2, Cancelled: 3 } as const;
      const queue = db.reservations
        .filter((r) => listings.has(r.listingId))
        .filter((r) => !listingId || r.listingId === listingId)
        .filter((r) => !status || r.status === status)
        // Today's pickups (window ends today or later)
        .filter((r) => new Date(listings.get(r.listingId)!.pickupEnd) >= startOfToday)
        .sort(
          (a, b) =>
            order[a.status] - order[b.status] ||
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
        )
        .map(toOrganizationReservation);
      const { page, pageSize } = readPaging(url);
      return HttpResponse.json(paginate(queue, page, pageSize));
    }),
  ),
];

/** Used by admin handlers when an organization is verified, rejected or suspended. */
export function notifyOwners(
  organizationId: string,
  type: "OrganizationVerified" | "OrganizationRejected",
  title: string,
  body: string,
) {
  for (const userId of memberIds(organizationId))
    notify(userId, type, title, body, { organizationId });
}

export { toOrganization };
