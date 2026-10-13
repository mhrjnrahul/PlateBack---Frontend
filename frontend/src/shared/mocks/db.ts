import type {
  ListingCategory,
  ListingStatus,
  MemberRole,
  Notification,
  OrganizationReviewItem,
  Reservation,
  UserRole,
} from "@/shared/types/api";
import { createSeedData } from "./data/seed";
import { MOCK_DB_KEY } from "./storage-keys";

/*
 * In-memory "database" behind the mock API. Rows are stored like the real
 * tables (design doc 5.2): foreign keys as ids, and handlers join them into
 * API responses. In the browser, changes are saved to localStorage (see
 * saveDb) so they survive a reload; tests reset to the seed after each test.
 */

export type MockUser = {
  id: string;
  email: string;
  /** Every seeded user can log in with "password123". */
  password: string;
  displayName: string;
  role: UserRole;
  reliabilityScore: number;
  isSuspended: boolean;
};

export type MockMembership = {
  userId: string;
  organizationId: string;
  role: MemberRole;
};

/** Organization row, including the owner details the admin review shows. */
export type MockOrganization = OrganizationReviewItem;

export type MockListing = {
  id: string;
  organizationId: string;
  title: string;
  category: ListingCategory;
  description: string;
  allergenNotes: string;
  price: number;
  originalPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  pickupStart: string;
  pickupEnd: string;
  address: string;
  latitude: number;
  longitude: number;
  status: ListingStatus;
  imageUrl: string | null;
  createdAt: string;
};

export type MockReservation = Reservation & { userId: string };

export type MockNotification = Notification & { userId: string };

export type MockDb = {
  users: MockUser[];
  memberships: MockMembership[];
  organizations: MockOrganization[];
  listings: MockListing[];
  reservations: MockReservation[];
  notifications: MockNotification[];
};

/** The live mock data. Handlers read and change it directly. */
export const db: MockDb = createSeedData();

/** Puts the seed data back (used between tests). */
export function resetDb(now = new Date()) {
  Object.assign(db, createSeedData(now));
}

// ---------- Saving demo data in the browser ----------

/** Bump when the seed shape changes, so old saved data is ignored. */
const STORAGE_VERSION = 1;
/** Saved data older than this is replaced by a fresh seed (pickup windows move with time). */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

const canPersist = () => typeof localStorage !== "undefined" && import.meta.env.MODE !== "test";

/** Saves the current data, so demo changes survive a page reload. */
export function saveDb() {
  if (!canPersist()) return;
  try {
    localStorage.setItem(
      MOCK_DB_KEY,
      JSON.stringify({ version: STORAGE_VERSION, savedAt: Date.now(), data: db }),
    );
  } catch {
    // Storage full or blocked: the demo still works, it just won't survive a reload.
  }
}

/** Loads saved demo data if it is recent and from this version of the seed. */
export function loadDb() {
  if (!canPersist()) return;
  try {
    const saved = JSON.parse(localStorage.getItem(MOCK_DB_KEY) ?? "null") as {
      version: number;
      savedAt: number;
      data: MockDb;
    } | null;
    if (saved?.version === STORAGE_VERSION && Date.now() - saved.savedAt < MAX_AGE_MS) {
      Object.assign(db, saved.data);
    }
  } catch {
    // Corrupt or unavailable: keep the fresh seed.
  }
}
