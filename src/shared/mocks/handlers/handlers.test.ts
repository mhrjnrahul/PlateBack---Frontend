import { afterEach, describe, expect, it } from "vitest";
import { api, setAccessTokenProvider } from "@/shared/api-client/client";
import type {
  AuthResponse,
  CurrentUser,
  ListingDetail,
  ListingSummary,
  NotificationPage,
  OrganizationReservation,
  Page,
  Reservation,
  ReservationWithListing,
} from "@/shared/types/api";
import { db, resetDb } from "../db";

/** Sends the next requests as this seeded user (null = signed out). */
function as(userId: string | null) {
  setAccessTokenProvider(() => (userId ? `mock-access.${userId}` : null));
}
const fail = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (e: unknown) => e,
  );
const listing = (id: string) => db.listings.find((l) => l.id === id)!;

afterEach(() => as(null));

describe("GET /listings", () => {
  it("returns only open listings from verified businesses, available first", async () => {
    const page = await api.get<Page<ListingSummary>>("/listings", { query: { pageSize: 50 } });
    expect(page.total).toBe(11);
    expect(page.items.every((l) => l.organization.isVerified)).toBe(true);
    expect(page.items.at(-1)!.status).toBe("SoldOut");
    expect(page.items.map((l) => l.id)).not.toContain("listing-old-cinnamon");
  });

  it("filters by radius and sorts by distance", async () => {
    // Thamel, 2 km: Sunrise Bakery is about 0 km away; Bhaktapur is about 11 km away
    const page = await api.get<Page<ListingSummary>>("/listings", {
      query: { lat: 27.7154, lng: 85.3123, radiusKm: 2 },
    });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((l) => l.distanceKm! <= 2)).toBe(true);
    expect(page.items.some((l) => l.organization.name === "Corner Bakehouse")).toBe(false);
  });

  it("filters by category, max price and search text, and pages", async () => {
    const bakery = await api.get<Page<ListingSummary>>("/listings", {
      query: { category: "Bakery" },
    });
    expect(bakery.items.every((l) => l.category === "Bakery")).toBe(true);
    const free = await api.get<Page<ListingSummary>>("/listings", { query: { maxPrice: 0 } });
    expect(free.items.map((l) => l.title)).toEqual(["Bread & rolls bag"]);
    const momo = await api.get<Page<ListingSummary>>("/listings", { query: { q: "momo" } });
    expect(momo.items[0]!.organization.name).toBe("Himalayan Momo House");
    const paged = await api.get<Page<ListingSummary>>("/listings", {
      query: { pageSize: 4, page: 3 },
    });
    expect(paged).toMatchObject({ page: 3, pageSize: 4, total: 11 });
    expect(paged.items).toHaveLength(3);
  });

  it("returns a listing's detail, or 404", async () => {
    const detail = await api.get<ListingDetail>("/listings/listing-pastry");
    expect(detail).toMatchObject({ title: "Mixed pastry box", maxPerUser: 2 });
    expect(await fail(api.get("/listings/nope"))).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("POST /listings/{id}/reservations", () => {
  it("reserves stock and returns a pickup code", async () => {
    as("user-bikash");
    const before = listing("listing-thali").quantityAvailable;
    const reservation = await api.post<Reservation>("/listings/listing-thali/reservations", {
      quantity: 2,
    });
    expect(reservation).toMatchObject({ status: "Reserved", quantity: 2 });
    expect(reservation.pickupCode).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(listing("listing-thali").quantityAvailable).toBe(before - 2);
  });

  it("gives the last unit to exactly one customer (goal G1)", async () => {
    listing("listing-bread").quantityAvailable = 1;
    as("user-bikash");
    await api.post("/listings/listing-bread/reservations", { quantity: 1 });
    as("user-sita");
    expect(
      await fail(api.post("/listings/listing-bread/reservations", { quantity: 1 })),
    ).toMatchObject({
      status: 409,
      code: "SOLD_OUT",
    });
    expect(listing("listing-bread")).toMatchObject({ quantityAvailable: 0, status: "SoldOut" });
  });

  it("enforces the per-listing and active-reservation limits", async () => {
    as("user-maya"); // already holds the pastry box
    expect(
      await fail(api.post("/listings/listing-pastry/reservations", { quantity: 1 })),
    ).toMatchObject({ code: "LIMIT_REACHED" });

    as("user-binod"); // reliability 72, already has 1 active
    db.users.find((u) => u.id === "user-binod")!.reliabilityScore = 55; // below 60: limit 1
    expect(
      await fail(api.post("/listings/listing-momo/reservations", { quantity: 1 })),
    ).toMatchObject({ code: "LIMIT_REACHED" });
  });

  it("rejects bad quantities and signed-out users", async () => {
    as("user-bikash");
    expect(
      await fail(api.post("/listings/listing-momo/reservations", { quantity: 3 })),
    ).toMatchObject({
      status: 400,
      fieldErrors: { quantity: ["Choose between 1 and 2."] },
    });
    as(null);
    expect(
      await fail(api.post("/listings/listing-momo/reservations", { quantity: 1 })),
    ).toMatchObject({ status: 401 });
  });
});

describe("cancelling and collecting", () => {
  it("returns stock on cancel; a late cancel costs 5 reliability", async () => {
    as("user-maya");
    const stock = listing("listing-pastry").quantityAvailable;
    listing("listing-pastry").pickupStart = new Date(Date.now() - 60_000).toISOString(); // window open
    const cancelled = await api.post<Reservation>("/reservations/res-maya-pastry/cancel");
    expect(cancelled).toMatchObject({ status: "Cancelled", lateCancel: true });
    expect(listing("listing-pastry").quantityAvailable).toBe(stock + 1);
    const me = await api.get<CurrentUser>("/users/me");
    expect(me.reliabilityScore).toBe(85);
  });

  it("lets staff verify a code once, and only for their own business", async () => {
    as("user-sita"); // not staff anywhere
    expect(await fail(api.post("/reservations/verify", { pickupCode: "K7M2-9QXA" }))).toMatchObject(
      { status: 404 },
    );

    as("user-arjun"); // owner of Sunrise Bakery
    const collected = await api.post<OrganizationReservation>("/reservations/verify", {
      pickupCode: "k7m2 9qxa",
    });
    expect(collected).toMatchObject({ status: "Collected", customerName: "Maya Rai" });
    expect(db.users.find((u) => u.id === "user-maya")!.reliabilityScore).toBe(92);
    expect(await fail(api.post("/reservations/verify", { pickupCode: "K7M2-9QXA" }))).toMatchObject(
      { code: "CODE_ALREADY_USED" },
    );
  });

  it("expires listings and marks no-shows when the window has passed (job E)", async () => {
    resetDb(new Date(Date.now() - 30 * 60 * 60 * 1000)); // seed as if created 30 hours ago
    as("user-maya");
    const history = await api.get<Page<ReservationWithListing>>("/reservations/mine", {
      query: { status: "history" },
    });
    expect(history.items.find((r) => r.id === "res-maya-pastry")!.status).toBe("NoShow");
    expect(db.users.find((u) => u.id === "user-maya")!.reliabilityScore).toBe(50); // two no-shows: 90 - 40
  });
});

describe("organizations and listings", () => {
  it("publishes a valid listing and reports field errors", async () => {
    as("user-arjun");
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const input = {
      title: "Banana bread",
      category: "Bakery",
      description: "",
      quantityTotal: 5,
      originalPrice: 6,
      price: 2,
      pickupStart: start.toISOString(),
      pickupEnd: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      address: "Thamel Rd 12, Kathmandu",
      latitude: 27.7154,
      longitude: 85.3123,
      allergenNotes: "Contains gluten, eggs.",
    };
    const created = await api.post<ListingDetail>("/organizations/org-sunrise/listings", input);
    expect(created).toMatchObject({
      title: "Banana bread",
      status: "Active",
      quantityAvailable: 5,
    });

    const error = await fail(
      api.post("/organizations/org-sunrise/listings", {
        ...input,
        title: "x",
        price: 9,
        allergenNotes: "",
      }),
    );
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(Object.keys((error as { fieldErrors: object }).fieldErrors).sort()).toEqual([
      "allergenNotes",
      "price",
      "title",
    ]);
  });

  it("blocks businesses that are not verified yet", async () => {
    as("user-ramesh"); // owner of pending Hilltop Kitchen
    expect(await fail(api.post("/organizations/org-hilltop/listings", {}))).toMatchObject({
      status: 403,
      code: "ORG_NOT_VERIFIED",
    });
    as("user-maya");
    expect(await fail(api.get("/organizations/org-sunrise/stats"))).toMatchObject({ status: 403 });
  });
});

describe("auth, notifications and admin", () => {
  it("logs in with the demo password and rejects a wrong one", async () => {
    const ok = await api.post<AuthResponse>("/auth/login", {
      email: "MAYA@example.com",
      password: "password123",
    });
    expect(ok.user).toMatchObject({ displayName: "Maya Rai", role: "Customer" });
    expect(
      await fail(api.post("/auth/login", { email: "maya@example.com", password: "nope" })),
    ).toMatchObject({ status: 401 });
    const refreshed = await api.post<AuthResponse>("/auth/refresh");
    expect(refreshed.user.id).toBe("user-maya");
  });

  it("registers a new customer and refuses a duplicate email", async () => {
    const created = await api.post<AuthResponse>("/auth/register", {
      displayName: "Asha",
      email: "asha@example.com",
      password: "longpassword",
    });
    expect(created.user).toMatchObject({
      role: "Customer",
      reliabilityScore: 100,
      memberships: [],
    });
    expect(
      await fail(
        api.post("/auth/register", {
          displayName: "Asha",
          email: "asha@example.com",
          password: "longpassword",
        }),
      ),
    ).toMatchObject({
      fieldErrors: { email: ["An account with this email already exists."] },
    });
  });

  it("counts and clears unread notifications", async () => {
    as("user-maya");
    expect((await api.get<NotificationPage>("/notifications")).unreadCount).toBe(3);
    await api.post("/notifications/read-all");
    expect((await api.get<NotificationPage>("/notifications")).unreadCount).toBe(0);
  });

  it("lets only admins verify a business; rejecting needs a reason", async () => {
    as("user-maya");
    expect(await fail(api.post("/admin/organizations/org-hilltop/verify"))).toMatchObject({
      status: 403,
    });
    as("user-admin");
    expect(await fail(api.post("/admin/organizations/org-durbar/reject", {}))).toMatchObject({
      status: 400,
    });
    await api.post("/admin/organizations/org-hilltop/verify");
    expect(db.organizations.find((o) => o.id === "org-hilltop")!.status).toBe("Verified");
    expect(
      db.notifications.some((n) => n.userId === "user-ramesh" && n.type === "OrganizationVerified"),
    ).toBe(true);
  });
});
