import { http } from "msw";
import { apiUrl, problem } from "../utils";
import { adminHandlers } from "./admin";
import { authHandlers } from "./auth";
import { listingHandlers } from "./listings";
import { notificationHandlers } from "./notifications";
import { organizationHandlers } from "./organizations";
import { reservationHandlers } from "./reservations";
import { uploadHandlers } from "./uploads";

/** Every mock endpoint (design doc section 6.2). */
export const handlers = [
  ...authHandlers,
  // Reservation routes before listing routes: "/reservations/mine" and
  // "/reservations/verify" must not be read as "/reservations/:id".
  ...reservationHandlers,
  ...listingHandlers,
  ...organizationHandlers,
  ...notificationHandlers,
  ...adminHandlers,
  ...uploadHandlers,

  // Must stay last: any API path without a mock answers 501, so a missing
  // endpoint is obvious instead of silently hitting the network.
  http.all(apiUrl("/*"), ({ request }) =>
    problem(
      501,
      "INTERNAL_ERROR",
      "Not implemented in the mock API",
      `${request.method} ${new URL(request.url).pathname} has no mock handler yet.`,
    ),
  ),
];
