import { describe, expect, it } from "vitest";
import { api } from "@/shared/api-client/client";
import { isApiError } from "@/shared/api-client/api-error";
import { db, resetDb } from "./db";

describe("mock database seed", () => {
  it("only references rows that exist", () => {
    const userIds = new Set(db.users.map((u) => u.id));
    const orgIds = new Set(db.organizations.map((o) => o.id));
    const listingIds = new Set(db.listings.map((l) => l.id));

    for (const m of db.memberships) {
      expect(userIds).toContain(m.userId);
      expect(orgIds).toContain(m.organizationId);
    }
    for (const l of db.listings) expect(orgIds).toContain(l.organizationId);
    for (const r of db.reservations) {
      expect(userIds).toContain(r.userId);
      expect(listingIds).toContain(r.listingId);
    }
    for (const n of db.notifications) expect(userIds).toContain(n.userId);
  });

  it("only has listings from verified organizations", () => {
    const verified = new Set(
      db.organizations.filter((o) => o.status === "Verified").map((o) => o.id),
    );
    for (const l of db.listings) expect(verified).toContain(l.organizationId);
  });

  it("keeps listing stock and windows valid (design doc 5.4 constraints)", () => {
    for (const l of db.listings) {
      expect(l.quantityAvailable).toBeGreaterThanOrEqual(0);
      expect(l.quantityAvailable).toBeLessThanOrEqual(l.quantityTotal);
      expect(l.price).toBeGreaterThanOrEqual(0);
      expect(l.price).toBeLessThanOrEqual(l.originalPrice);
      expect(new Date(l.pickupEnd).getTime()).toBeGreaterThan(new Date(l.pickupStart).getTime());
      if (l.status === "SoldOut") expect(l.quantityAvailable).toBe(0);
    }
  });

  it("uses unique pickup codes from the unambiguous alphabet (no 0, 1, I, L, O)", () => {
    const codes = db.reservations.map((r) => r.pickupCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  });

  it("has upcoming listings relative to now, so the data never goes stale", () => {
    const now = Date.now();
    const open = db.listings.filter(
      (l) => l.status === "Active" && new Date(l.pickupEnd).getTime() > now,
    );
    expect(open.length).toBeGreaterThanOrEqual(8);
  });

  it("resets to the seed after changes", () => {
    db.listings[0]!.quantityAvailable = 0;
    db.reservations.length = 0;
    resetDb();
    expect(db.listings[0]!.quantityAvailable).toBeGreaterThan(0);
    expect(db.reservations.length).toBeGreaterThan(0);
  });
});

describe("mock API", () => {
  it("answers unmocked endpoints with a 501 problem through the real client", async () => {
    const error = await api.get("/not-built-yet").catch((e) => e);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 501, code: "INTERNAL_ERROR" });
  });
});
