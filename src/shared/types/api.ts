/*
 * API contract types (design document, sections 5 and 6).
 *
 * JSON fields are camelCase, ids are GUID strings, timestamps are ISO 8601
 * UTC strings and enum values are PascalCase strings, matching the API
 * examples in section 6.3. In Week 4 these can be replaced by types generated
 * from the backend's OpenAPI document.
 */

// ---------- Shared ----------

/** ISO 8601 UTC timestamp, for example "2026-10-02T14:15:00Z". */
export type IsoDateTime = string;

/** Envelope for every paged list endpoint. */
export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

/** Error codes the API returns in ProblemDetails.code (section 6.4). */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "TOKEN_EXPIRED"
  | "NOT_ORG_MEMBER"
  | "ORG_NOT_VERIFIED"
  | "ACCOUNT_SUSPENDED"
  | "NOT_FOUND"
  | "SOLD_OUT"
  | "LIMIT_REACHED"
  | "WINDOW_CLOSED"
  | "ALREADY_COLLECTED"
  | "CODE_ALREADY_USED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** RFC 9457 error body plus our machine-readable code. */
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: ErrorCode;
  /** Field errors for VALIDATION_ERROR, keyed by field name. */
  errors?: Record<string, string[]>;
};

// ---------- Users and auth ----------

export type UserRole = "Customer" | "Admin";
export type MemberRole = "Owner" | "Staff";

export type Membership = {
  organizationId: string;
  organizationName: string;
  role: MemberRole;
};

/** GET /users/me */
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** 0-100; below 60 limits the user to one active reservation. */
  reliabilityScore: number;
  isSuspended: boolean;
  memberships: Membership[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  displayName: string;
  email: string;
  password: string;
};

/** Response of /auth/login, /auth/register and /auth/refresh. */
export type AuthResponse = {
  accessToken: string;
  /** Seconds until the access token expires (15 minutes). */
  expiresIn: number;
  user: CurrentUser;
};

// ---------- Organizations ----------

/** Body of POST /organizations (the caller becomes Owner; starts Pending). */
export type CreateOrganizationRequest = {
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
};

/** Body of POST /admin/organizations/{id}/reject and /suspend. */
export type ReviewDecisionRequest = {
  reason: string;
};

export type OrganizationStatus = "Pending" | "Verified" | "Rejected" | "Suspended";

/** Short form embedded in listings. */
export type OrganizationSummary = {
  id: string;
  name: string;
  isVerified: boolean;
};

export type Organization = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, for example "Asia/Kathmandu". */
  timeZone: string;
  status: OrganizationStatus;
  createdAt: IsoDateTime;
  verifiedAt?: IsoDateTime | null;
  rejectionReason?: string | null;
};

/** Admin review list item (GET /admin/organizations). */
export type OrganizationReviewItem = Organization & {
  ownerName: string;
  ownerEmail: string;
  phone?: string | null;
  type: string;
};

/** GET /organizations/{id}/stats */
export type OrganizationStats = {
  activeListings: number;
  portionsReserved: number;
  collectedToday: number;
  mealsRescuedThisMonth: number;
  /** Last 14 days, oldest first. */
  mealsRescuedByDay: { date: string; count: number }[];
};

/** GET /stats/impact (public, cached 5 minutes) */
export type ImpactStats = {
  mealsRescued: number;
  partnerBusinesses: number;
  activeListings: number;
};

// ---------- Listings ----------

export type ListingCategory = "Bakery" | "Meals" | "Groceries" | "Beverages" | "Other";
export type ListingStatus = "Active" | "SoldOut" | "Expired" | "Cancelled";

/** A listing as shown in search results and cards. */
export type ListingSummary = {
  id: string;
  title: string;
  category: ListingCategory;
  organization: OrganizationSummary;
  /** Price now; 0 means free. */
  price: number;
  originalPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  pickupStart: IsoDateTime;
  pickupEnd: IsoDateTime;
  status: ListingStatus;
  /** Only present when the search had a location. */
  distanceKm?: number | null;
  imageUrl?: string | null;
};

/** GET /listings/{id} */
export type ListingDetail = ListingSummary & {
  description: string;
  allergenNotes: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Units one user may reserve on this listing. */
  maxPerUser: number;
};

export type ListingSort = "distance" | "pickup" | "price";

/** Query parameters of GET /listings. */
export type ListingSearchParams = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: ListingCategory;
  maxPrice?: number;
  pickupFrom?: IsoDateTime;
  pickupTo?: IsoDateTime;
  q?: string;
  sort?: ListingSort;
  page?: number;
  pageSize?: number;
};

/** Body of POST /organizations/{orgId}/listings and PUT /listings/{id}. */
export type ListingInput = {
  title: string;
  category: ListingCategory;
  description: string;
  quantityTotal: number;
  originalPrice: number;
  price: number;
  pickupStart: IsoDateTime;
  pickupEnd: IsoDateTime;
  address: string;
  latitude: number;
  longitude: number;
  allergenNotes: string;
};

// ---------- Reservations ----------

export type ReservationStatus = "Reserved" | "Collected" | "Cancelled" | "NoShow";

export type Reservation = {
  id: string;
  listingId: string;
  quantity: number;
  status: ReservationStatus;
  /** 8 characters shown as "K7M2-9QXA". */
  pickupCode: string;
  reservedAt: IsoDateTime;
  /** End of the pickup window; the reservation becomes NoShow after it. */
  expiresAt: IsoDateTime;
  collectedAt?: IsoDateTime | null;
  cancelledAt?: IsoDateTime | null;
  /** True when cancelled after the pickup window opened (-5 reliability). */
  lateCancel: boolean;
};

/** Reservation with the listing details a customer needs (My reservations). */
export type ReservationWithListing = Reservation & {
  listing: Pick<
    ListingDetail,
    | "title"
    | "category"
    | "price"
    | "originalPrice"
    | "pickupStart"
    | "pickupEnd"
    | "address"
    | "latitude"
    | "longitude"
    | "imageUrl"
  > & { organizationName: string; organizationId: string };
};

/** Counter queue item for staff (GET /organizations/{orgId}/reservations). */
export type OrganizationReservation = Reservation & {
  customerName: string;
  listingTitle: string;
};

/** Filter of GET /reservations/mine: live reservations or past ones. */
export type ReservationScope = "active" | "history";

export type CreateReservationRequest = {
  quantity: number;
};

export type VerifyPickupRequest = {
  pickupCode: string;
};

// ---------- Notifications ----------

export type NotificationType =
  | "ReservationConfirmed"
  | "ReservationCancelled"
  | "ReservationCollected"
  | "ReservationNoShow"
  | "PickupWindowOpening"
  | "ListingCancelled"
  | "NewListingNearby"
  | "OrganizationVerified"
  | "OrganizationRejected";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: IsoDateTime;
  /** Deep-link targets, for example { reservationId }. */
  data: Record<string, string>;
};

/** GET /notifications adds the unread count to the page envelope. */
export type NotificationPage = Page<Notification> & {
  unreadCount: number;
};
