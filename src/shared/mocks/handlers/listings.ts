import { http, HttpResponse } from "msw";
import type { ImpactStats, ListingCategory, ListingSort } from "@/shared/types/api";
import { db } from "../db";
import { distanceKm, RULES } from "../rules";
import { apiUrl, paginate, readPaging } from "../utils";
import { handle, notFound } from "./context";
import { toListingDetail, toListingSummary } from "./serialize";

/** Seed figures for the platform before this demo's data (design wireframe 1). */
const BASELINE = { mealsRescued: 12474, partnerBusinesses: 80 };

const CATEGORIES: ListingCategory[] = ["Bakery", "Meals", "Groceries", "Beverages", "Other"];

export const listingHandlers = [
  // GET /listings: search (design doc 6.2 and 5.5)
  http.get(
    apiUrl("/listings"),
    handle(({ request }) => {
      const url = new URL(request.url);
      const p = url.searchParams;
      const now = new Date();
      const lat = p.has("lat") ? Number(p.get("lat")) : null;
      const lng = p.has("lng") ? Number(p.get("lng")) : null;
      const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
      const radiusKm = Math.min(
        RULES.radiusMaxKm,
        Number(p.get("radiusKm")) || RULES.radiusDefaultKm,
      );
      const category = p.get("category") as ListingCategory | null;
      const maxPrice = p.has("maxPrice") ? Number(p.get("maxPrice")) : null;
      const pickupFrom = p.get("pickupFrom") ? new Date(p.get("pickupFrom")!) : null;
      const pickupTo = p.get("pickupTo") ? new Date(p.get("pickupTo")!) : null;
      const q = p.get("q")?.trim().toLowerCase() ?? "";
      const sort = (p.get("sort") as ListingSort | null) ?? (hasLocation ? "distance" : "pickup");
      const verified = new Set(
        db.organizations.filter((o) => o.status === "Verified").map((o) => o.id),
      );
      const orgName = new Map(db.organizations.map((o) => [o.id, o.name.toLowerCase()]));

      const results = db.listings
        // Lazy filter on the current time as well as status (decision D10)
        .filter(
          (l) => (l.status === "Active" || l.status === "SoldOut") && new Date(l.pickupEnd) > now,
        )
        .filter((l) => verified.has(l.organizationId))
        .filter((l) => !category || !CATEGORIES.includes(category) || l.category === category)
        .filter((l) => maxPrice === null || l.price <= maxPrice)
        // Pickup window overlaps the requested time range
        .filter((l) => !pickupFrom || new Date(l.pickupEnd) > pickupFrom)
        .filter((l) => !pickupTo || new Date(l.pickupStart) < pickupTo)
        .filter(
          (l) =>
            !q ||
            l.title.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            orgName.get(l.organizationId)!.includes(q),
        )
        .map((l) => ({
          listing: l,
          distance: hasLocation ? distanceKm(lat, lng, l.latitude, l.longitude) : undefined,
        }))
        .filter((r) => r.distance === undefined || r.distance <= radiusKm)
        .sort((a, b) => {
          // Available listings first, sold out last
          const soldOut =
            Number(a.listing.status === "SoldOut") - Number(b.listing.status === "SoldOut");
          if (soldOut !== 0) return soldOut;
          if (sort === "distance" && a.distance !== undefined && b.distance !== undefined)
            return a.distance - b.distance;
          if (sort === "price") return a.listing.price - b.listing.price;
          return new Date(a.listing.pickupEnd).getTime() - new Date(b.listing.pickupEnd).getTime();
        })
        .map((r) => toListingSummary(r.listing, r.distance));

      const { page, pageSize } = readPaging(url);
      return HttpResponse.json(paginate(results, page, pageSize));
    }),
  ),

  // GET /listings/{id}
  http.get(
    apiUrl("/listings/:id"),
    handle(({ params }) => {
      const listing = db.listings.find((l) => l.id === params.id);
      return listing ? HttpResponse.json(toListingDetail(listing)) : notFound("Listing");
    }),
  ),

  // GET /stats/impact (public)
  http.get(
    apiUrl("/stats/impact"),
    handle(() => {
      const now = new Date();
      const collected = db.reservations
        .filter((r) => r.status === "Collected")
        .reduce((sum, r) => sum + r.quantity, 0);
      const stats: ImpactStats = {
        mealsRescued: BASELINE.mealsRescued + collected,
        partnerBusinesses:
          BASELINE.partnerBusinesses +
          db.organizations.filter((o) => o.status === "Verified").length,
        activeListings: db.listings.filter(
          (l) => l.status === "Active" && new Date(l.pickupEnd) > now,
        ).length,
      };
      return HttpResponse.json(stats);
    }),
  ),
];
