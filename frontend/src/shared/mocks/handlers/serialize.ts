import type {
  ListingDetail,
  ListingSummary,
  OrganizationReservation,
  Reservation,
  ReservationWithListing,
} from "@/shared/types/api";
import { db, type MockListing, type MockReservation } from "../db";
import { RULES } from "../rules";

/* Turn stored rows into API responses (joins, and leaving out private fields). */

function organizationSummary(organizationId: string) {
  const org = db.organizations.find((o) => o.id === organizationId)!;
  return { id: org.id, name: org.name, isVerified: org.status === "Verified" };
}

export function toListingSummary(listing: MockListing, distanceKm?: number): ListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    category: listing.category,
    organization: organizationSummary(listing.organizationId),
    price: listing.price,
    originalPrice: listing.originalPrice,
    quantityTotal: listing.quantityTotal,
    quantityAvailable: listing.quantityAvailable,
    pickupStart: listing.pickupStart,
    pickupEnd: listing.pickupEnd,
    status: listing.status,
    distanceKm: distanceKm === undefined ? null : Math.round(distanceKm * 10) / 10,
    imageUrl: listing.imageUrl,
  };
}

export function toListingDetail(listing: MockListing): ListingDetail {
  return {
    ...toListingSummary(listing),
    description: listing.description,
    allergenNotes: listing.allergenNotes,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    maxPerUser: RULES.maxPerListing,
  };
}

/** A reservation without the private userId column. */
export function toReservation(r: MockReservation): Reservation {
  return {
    id: r.id,
    listingId: r.listingId,
    quantity: r.quantity,
    status: r.status,
    pickupCode: r.pickupCode,
    reservedAt: r.reservedAt,
    expiresAt: r.expiresAt,
    collectedAt: r.collectedAt,
    cancelledAt: r.cancelledAt,
    lateCancel: r.lateCancel,
  };
}

export function toReservationWithListing(reservation: MockReservation): ReservationWithListing {
  const listing = db.listings.find((l) => l.id === reservation.listingId)!;
  const org = db.organizations.find((o) => o.id === listing.organizationId)!;
  return {
    ...toReservation(reservation),
    listing: {
      title: listing.title,
      category: listing.category,
      price: listing.price,
      originalPrice: listing.originalPrice,
      pickupStart: listing.pickupStart,
      pickupEnd: listing.pickupEnd,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      imageUrl: listing.imageUrl,
      organizationId: org.id,
      organizationName: org.name,
    },
  };
}

export function toOrganizationReservation(reservation: MockReservation): OrganizationReservation {
  const listing = db.listings.find((l) => l.id === reservation.listingId)!;
  const customer = db.users.find((u) => u.id === reservation.userId)!;
  return {
    ...toReservation(reservation),
    customerName: customer.displayName,
    listingTitle: listing.title,
  };
}
