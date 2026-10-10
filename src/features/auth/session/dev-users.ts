import type { NavRole, SessionUser } from "./session-context";

/**
 * Sample users for the development role switcher. They match the people in
 * the wireframes; ids are aligned with the mock data in step 3.
 */
export const devUsers: Record<Exclude<NavRole, "visitor">, SessionUser> = {
  customer: {
    id: "user-maya",
    name: "Maya Rai",
    email: "maya@example.com",
    role: "customer",
  },
  business: {
    id: "user-arjun",
    name: "Arjun Shrestha",
    email: "arjun@sunrisebakery.example",
    role: "customer",
    organization: { id: "org-sunrise", name: "Sunrise Bakery", memberRole: "owner" },
  },
  admin: {
    id: "user-admin",
    name: "Platform Admin",
    email: "admin@plateback.example",
    role: "admin",
  },
};
