import type {
  MockDb,
  MockListing,
  MockNotification,
  MockOrganization,
  MockReservation,
  MockUser,
} from "../db";

/*
 * Seed data based on the wireframes: businesses around Kathmandu, Lalitpur
 * and Bhaktapur, with pickup windows relative to "now" so the data never
 * goes stale. Ids are readable strings so they are easy to follow in the
 * dev tools; the dev role switcher uses the same user and organization ids.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const PASSWORD = "password123";

export function createSeedData(now = new Date()): MockDb {
  const t = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

  const users: MockUser[] = [
    user("user-maya", "Maya Rai", "maya@example.com", 90),
    user("user-arjun", "Arjun Shrestha", "arjun@sunrisebakery.example", 100),
    user("user-bikash", "Bikash Karki", "bikash@example.com", 100),
    user("user-sita", "Sita Tamang", "sita@example.com", 96),
    user("user-binod", "Binod Khadka", "binod@example.com", 72),
    user("user-ramesh", "Ramesh Shrestha", "r.shrestha@mail.example", 100),
    user("user-anita", "Anita Gurung", "anita@valleygreens.example", 100),
    user("user-suman", "Suman Thapa", "suman@durbarsweets.example", 100),
    { ...user("user-admin", "Platform Admin", "admin@plateback.example", 100), role: "Admin" },
  ];

  const organizations: MockOrganization[] = [
    org(
      "org-sunrise",
      "Sunrise Bakery",
      "Thamel Rd 12, Kathmandu",
      27.7154,
      85.3123,
      "Verified",
      "Arjun Shrestha",
      "arjun@sunrisebakery.example",
      "Bakery",
      t(-60 * DAY),
    ),
    org(
      "org-greenleaf",
      "Green Leaf Cafe",
      "Jhamsikhel, Lalitpur",
      27.6795,
      85.3088,
      "Verified",
      "Nisha Joshi",
      "nisha@greenleaf.example",
      "Cafe",
      t(-45 * DAY),
    ),
    org(
      "org-corner",
      "Corner Bakehouse",
      "Durbar Square, Bhaktapur",
      27.6722,
      85.428,
      "Verified",
      "Prakash Maharjan",
      "prakash@cornerbakehouse.example",
      "Bakery",
      t(-40 * DAY),
    ),
    org(
      "org-freshfields",
      "Fresh Fields",
      "New Baneshwor, Kathmandu",
      27.689,
      85.342,
      "Verified",
      "Kiran Adhikari",
      "kiran@freshfields.example",
      "Grocer",
      t(-30 * DAY),
    ),
    org(
      "org-momo",
      "Himalayan Momo House",
      "Boudha, Kathmandu",
      27.7215,
      85.362,
      "Verified",
      "Tenzin Lama",
      "tenzin@momohouse.example",
      "Restaurant",
      t(-25 * DAY),
    ),
    org(
      "org-chiya",
      "Chiya Corner",
      "Mangal Bazaar, Lalitpur",
      27.673,
      85.325,
      "Verified",
      "Rita Shakya",
      "rita@chiyacorner.example",
      "Cafe",
      t(-20 * DAY),
    ),
    // Review queue for the admin (wireframe 7)
    org(
      "org-hilltop",
      "Hilltop Kitchen",
      "Kupondole, Lalitpur",
      27.6866,
      85.3165,
      "Pending",
      "Ramesh Shrestha",
      "r.shrestha@mail.example",
      "Restaurant",
      t(-3 * HOUR),
    ),
    org(
      "org-valleygreens",
      "Valley Greens",
      "Lazimpat, Kathmandu",
      27.7225,
      85.3205,
      "Pending",
      "Anita Gurung",
      "anita@valleygreens.example",
      "Grocer",
      t(-5 * HOUR),
    ),
    org(
      "org-durbar",
      "Durbar Sweets",
      "Taumadhi, Bhaktapur",
      27.6714,
      85.4298,
      "Pending",
      "Suman Thapa",
      "suman@durbarsweets.example",
      "Bakery",
      t(-26 * HOUR),
    ),
    {
      ...org(
        "org-quickbite",
        "Quick Bite Express",
        "Kalanki, Kathmandu",
        27.6934,
        85.2817,
        "Rejected",
        "Deepak Rana",
        "deepak@quickbite.example",
        "Restaurant",
        t(-10 * DAY),
      ),
      rejectionReason: "Could not confirm the business address.",
    },
    org(
      "org-oldmill",
      "Old Mill Pastries",
      "Pulchowk, Lalitpur",
      27.6782,
      85.3167,
      "Suspended",
      "Hari Bista",
      "hari@oldmill.example",
      "Bakery",
      t(-50 * DAY),
    ),
  ];

  const memberships = [
    { userId: "user-arjun", organizationId: "org-sunrise", role: "Owner" as const },
    { userId: "user-ramesh", organizationId: "org-hilltop", role: "Owner" as const },
    { userId: "user-anita", organizationId: "org-valleygreens", role: "Owner" as const },
    { userId: "user-suman", organizationId: "org-durbar", role: "Owner" as const },
  ];

  const orgById = new Map(organizations.map((o) => [o.id, o]));

  /** A listing at its organization's address. Windows are hours from now. */
  function listing(
    id: string,
    organizationId: string,
    fields: Pick<
      MockListing,
      | "title"
      | "category"
      | "description"
      | "allergenNotes"
      | "price"
      | "originalPrice"
      | "quantityTotal"
      | "quantityAvailable"
    >,
    startInHours: number,
    lengthHours: number,
    status: MockListing["status"] = fields.quantityAvailable === 0 ? "SoldOut" : "Active",
  ): MockListing {
    const o = orgById.get(organizationId)!;
    return {
      id,
      organizationId,
      ...fields,
      pickupStart: t(startInHours * HOUR),
      pickupEnd: t((startInHours + lengthHours) * HOUR),
      address: o.address,
      latitude: o.latitude,
      longitude: o.longitude,
      status,
      // Photos are optional: a missing file falls back to the category illustration.
      imageUrl: `/images/listings/${id.replace(/^listing-(old-)?/, "")}.jpg`,
      createdAt: t((startInHours - 4) * HOUR),
    };
  }

  const listings: MockListing[] = [
    listing(
      "listing-pastry",
      "org-sunrise",
      {
        title: "Mixed pastry box",
        category: "Bakery",
        description:
          "A mix of croissants, danishes and rolls baked today. Contents vary. Best eaten within 24 hours.",
        allergenNotes: "Contains gluten, milk and eggs; may contain nuts.",
        price: 240,
        originalPrice: 800,
        quantityTotal: 10,
        quantityAvailable: 3,
      },
      1,
      2,
    ),
    listing(
      "listing-croissant",
      "org-sunrise",
      {
        title: "Croissant trio",
        category: "Bakery",
        description: "Three butter croissants from this morning's batch.",
        allergenNotes: "Contains gluten, milk and eggs.",
        price: 150,
        originalPrice: 360,
        quantityTotal: 12,
        quantityAvailable: 8,
      },
      0.5,
      2,
    ),
    listing(
      "listing-sourdough",
      "org-sunrise",
      {
        title: "Sourdough loaf",
        category: "Bakery",
        description: "One large sourdough loaf, baked today.",
        allergenNotes: "Contains gluten.",
        price: 220,
        originalPrice: 450,
        quantityTotal: 6,
        quantityAvailable: 4,
      },
      1,
      2,
    ),
    listing(
      "listing-thali",
      "org-greenleaf",
      {
        title: "Veg thali set",
        category: "Meals",
        description: "Rice, dal, two vegetable curries, pickle and papad. Packed to take away.",
        allergenNotes: "Contains milk; may contain mustard and nuts.",
        price: 150,
        originalPrice: 400,
        quantityTotal: 10,
        quantityAvailable: 7,
      },
      -0.5,
      2,
    ),
    listing(
      "listing-bread",
      "org-corner",
      {
        title: "Bread & rolls bag",
        category: "Bakery",
        description: "A bag of today's bread and rolls. Free; please bring your own bag.",
        allergenNotes: "Contains gluten; may contain sesame.",
        price: 0,
        originalPrice: 300,
        quantityTotal: 6,
        quantityAvailable: 2,
      },
      1.5,
      1,
    ),
    listing(
      "listing-salad",
      "org-freshfields",
      {
        title: "Salad bowls x2",
        category: "Meals",
        description: "Two fresh salad bowls with seasonal vegetables and a lemon dressing.",
        allergenNotes: "May contain sesame and mustard.",
        price: 200,
        originalPrice: 500,
        quantityTotal: 8,
        quantityAvailable: 5,
      },
      2.5,
      1,
    ),
    listing(
      "listing-momo",
      "org-momo",
      {
        title: "Momo platter",
        category: "Meals",
        description: "Twenty steamed vegetable momos with tomato achar.",
        allergenNotes: "Contains gluten and sesame.",
        price: 180,
        originalPrice: 380,
        quantityTotal: 6,
        quantityAvailable: 4,
      },
      2,
      1,
    ),
    listing(
      "listing-surprise",
      "org-corner",
      {
        title: "Surprise bag",
        category: "Other",
        description: "A surprise selection of what is left at closing: bread, pastries or cakes.",
        allergenNotes: "Contains gluten, milk and eggs; may contain nuts.",
        price: 250,
        originalPrice: 600,
        quantityTotal: 5,
        quantityAvailable: 5,
      },
      3,
      1.5,
    ),
    listing(
      "listing-chiya",
      "org-chiya",
      {
        title: "Milk tea and cookies",
        category: "Beverages",
        description: "A flask of milk tea (serves 2) with a box of homemade cookies.",
        allergenNotes: "Contains milk, gluten and eggs.",
        price: 40,
        originalPrice: 80,
        quantityTotal: 15,
        quantityAvailable: 11,
      },
      0.25,
      2,
    ),
    listing(
      "listing-juice",
      "org-greenleaf",
      {
        title: "Fresh juice bottles",
        category: "Beverages",
        description: "Two bottles of cold-pressed orange and carrot juice.",
        allergenNotes: "None known.",
        price: 100,
        originalPrice: 240,
        quantityTotal: 8,
        quantityAvailable: 0,
      },
      1,
      2,
    ),
    listing(
      "listing-vegbox",
      "org-freshfields",
      {
        title: "Fruit and veg box",
        category: "Groceries",
        description: "Seasonal fruit and vegetables that are a little bruised but perfectly good.",
        allergenNotes: "None known.",
        price: 120,
        originalPrice: 350,
        quantityTotal: 10,
        quantityAvailable: 8,
      },
      24,
      1,
    ),
    // Past listings, only referenced by reservation history
    listing(
      "listing-old-cinnamon",
      "org-sunrise",
      {
        title: "Cinnamon rolls",
        category: "Bakery",
        description: "Four cinnamon rolls.",
        allergenNotes: "Contains gluten, milk and eggs.",
        price: 140,
        originalPrice: 320,
        quantityTotal: 8,
        quantityAvailable: 0,
      },
      -50,
      2,
      "Expired",
    ),
    listing(
      "listing-old-dalbhat",
      "org-momo",
      {
        title: "Dal bhat for two",
        category: "Meals",
        description: "Dal bhat with seasonal vegetables.",
        allergenNotes: "May contain mustard.",
        price: 200,
        originalPrice: 450,
        quantityTotal: 6,
        quantityAvailable: 1,
      },
      -98,
      2,
      "Expired",
    ),
    listing(
      "listing-old-bagels",
      "org-corner",
      {
        title: "Bagel bag",
        category: "Bakery",
        description: "Six plain bagels.",
        allergenNotes: "Contains gluten; may contain sesame.",
        price: 120,
        originalPrice: 280,
        quantityTotal: 6,
        quantityAvailable: 0,
      },
      -170,
      2,
      "Expired",
    ),
  ];

  const listingById = new Map(listings.map((l) => [l.id, l]));

  function reservation(
    id: string,
    userId: string,
    listingId: string,
    quantity: number,
    status: MockReservation["status"],
    pickupCode: string,
    extra: Partial<MockReservation> = {},
  ): MockReservation {
    const l = listingById.get(listingId)!;
    return {
      id,
      userId,
      listingId,
      quantity,
      status,
      pickupCode,
      reservedAt: new Date(new Date(l.pickupStart).getTime() - 3 * HOUR).toISOString(),
      expiresAt: l.pickupEnd,
      collectedAt: status === "Collected" ? l.pickupStart : null,
      cancelledAt: null,
      lateCancel: false,
      ...extra,
    };
  }

  const reservations: MockReservation[] = [
    // Maya: active reservations (wireframe 4)
    reservation("res-maya-pastry", "user-maya", "listing-pastry", 1, "Reserved", "K7M2-9QXA"),
    reservation("res-maya-vegbox", "user-maya", "listing-vegbox", 2, "Reserved", "R4TW-8HNE"),
    // Maya: history (12 meals collected so far)
    reservation(
      "res-maya-cinnamon",
      "user-maya",
      "listing-old-cinnamon",
      2,
      "Collected",
      "C9PB-3KDA",
    ),
    reservation(
      "res-maya-dalbhat",
      "user-maya",
      "listing-old-dalbhat",
      2,
      "Collected",
      "D2XM-7QRT",
    ),
    reservation("res-maya-bagels", "user-maya", "listing-old-bagels", 2, "Collected", "B6HN-4WJY"),
    reservation(
      "res-maya-cancelled",
      "user-maya",
      "listing-old-cinnamon",
      1,
      "Cancelled",
      "E3VK-9PAU",
      { cancelledAt: t(-52 * HOUR) },
    ),
    // Sunrise Bakery counter queue for today (wireframe 5)
    reservation("res-bikash-pastry", "user-bikash", "listing-pastry", 2, "Reserved", "M8QA-2ZCE"),
    reservation(
      "res-sita-croissant",
      "user-sita",
      "listing-croissant",
      1,
      "Collected",
      "S5JD-6TRK",
      { collectedAt: t(-20 * 60 * 1000) },
    ),
    reservation(
      "res-binod-sourdough",
      "user-binod",
      "listing-sourdough",
      2,
      "Reserved",
      "N7WF-3GHP",
    ),
  ];

  const notifications: MockNotification[] = [
    notification(
      "n-1",
      "user-maya",
      "ReservationConfirmed",
      "Reservation confirmed",
      "Mixed pastry box from Sunrise Bakery. Show code K7M2-9QXA at pickup.",
      false,
      t(-2 * 60 * 1000),
      { reservationId: "res-maya-pastry" },
    ),
    notification(
      "n-2",
      "user-maya",
      "PickupWindowOpening",
      "Pickup window opens in 1 hour",
      "Sunrise Bakery, Thamel Rd 12.",
      false,
      t(-10 * 60 * 1000),
      { reservationId: "res-maya-pastry" },
    ),
    notification(
      "n-3",
      "user-maya",
      "NewListingNearby",
      "New listing nearby",
      "Fresh Fields posted Salad bowls x2.",
      false,
      t(-40 * 60 * 1000),
      { listingId: "listing-salad" },
    ),
    notification(
      "n-4",
      "user-maya",
      "ListingCancelled",
      "Reservation cancelled by business",
      "Corner Bakehouse cancelled a listing you reserved.",
      true,
      t(-1 * DAY),
      {},
    ),
    notification(
      "n-5",
      "user-maya",
      "ReservationCollected",
      "Thanks for rescuing food!",
      "Collected: Bagel bag from Corner Bakehouse.",
      true,
      t(-2 * DAY),
      { reservationId: "res-maya-bagels" },
    ),
    notification(
      "n-6",
      "user-arjun",
      "ReservationConfirmed",
      "New reservation",
      "Maya Rai reserved 1 x Mixed pastry box.",
      false,
      t(-2 * 60 * 1000),
      { reservationId: "res-maya-pastry", organizationId: "org-sunrise" },
    ),
  ];

  return { users, memberships, organizations, listings, reservations, notifications };

  function user(
    id: string,
    displayName: string,
    email: string,
    reliabilityScore: number,
  ): MockUser {
    return {
      id,
      email,
      password: PASSWORD,
      displayName,
      role: "Customer",
      reliabilityScore,
      isSuspended: false,
    };
  }

  function org(
    id: string,
    name: string,
    address: string,
    latitude: number,
    longitude: number,
    status: MockOrganization["status"],
    ownerName: string,
    ownerEmail: string,
    type: string,
    createdAt: string,
  ): MockOrganization {
    return {
      id,
      name,
      address,
      latitude,
      longitude,
      timeZone: "Asia/Kathmandu",
      status,
      createdAt,
      verifiedAt: status === "Verified" || status === "Suspended" ? createdAt : null,
      rejectionReason: null,
      ownerName,
      ownerEmail,
      phone: "+977 98XXXXXXXX",
      type,
    };
  }

  function notification(
    id: string,
    userId: string,
    type: MockNotification["type"],
    title: string,
    body: string,
    isRead: boolean,
    createdAt: string,
    data: Record<string, string>,
  ): MockNotification {
    return { id, userId, type, title, body, isRead, createdAt, data };
  }
}
