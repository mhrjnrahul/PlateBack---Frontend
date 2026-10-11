import { http, HttpResponse } from "msw";
import type { OrganizationStatus, ReviewDecisionRequest } from "@/shared/types/api";
import { db } from "../db";
import { apiUrl, paginate, problem, readPaging } from "../utils";
import { currentUser, handle, notFound, readJson, unauthenticated } from "./context";
import { notifyOwners } from "./organizations";

const STATUSES: OrganizationStatus[] = ["Pending", "Verified", "Rejected", "Suspended"];

/** Admin-only endpoints. Returns the admin user, or an error response. */
function requireAdmin(request: Request) {
  const user = currentUser(request);
  if (!user) return { error: unauthenticated() };
  if (user.role !== "Admin")
    return { error: problem(403, "NOT_ORG_MEMBER", "Forbidden", "Admins only.") };
  return { error: null };
}

export const adminHandlers = [
  // GET /admin/organizations?status=Pending
  http.get(
    apiUrl("/admin/organizations"),
    handle(({ request }) => {
      const { error } = requireAdmin(request);
      if (error) return error;
      const url = new URL(request.url);
      const status = url.searchParams.get("status") as OrganizationStatus | null;
      const orgs = db.organizations
        .filter((o) => !status || !STATUSES.includes(status) || o.status === status)
        // Oldest first: the review queue is first come, first served
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const { page, pageSize } = readPaging(url);
      return HttpResponse.json(paginate(orgs, page, pageSize));
    }),
  ),

  // POST /admin/organizations/{id}/verify | reject | suspend
  http.post(
    apiUrl("/admin/organizations/:id/:decision"),
    handle(async ({ request, params }) => {
      const { error } = requireAdmin(request);
      if (error) return error;
      const org = db.organizations.find((o) => o.id === params.id);
      if (!org) return notFound("Organization");
      const decision = String(params.decision);
      const { reason } = await readJson<ReviewDecisionRequest>(request);

      if (decision === "verify") {
        if (org.status === "Verified")
          return problem(
            409,
            "VALIDATION_ERROR",
            "Already verified",
            "This business is already verified.",
          );
        org.status = "Verified";
        org.verifiedAt = new Date().toISOString();
        org.rejectionReason = null;
        notifyOwners(
          org.id,
          "OrganizationVerified",
          "Your business is verified",
          `${org.name} can now publish listings.`,
        );
      } else if (decision === "reject" || decision === "suspend") {
        if (!reason?.trim()) {
          return problem(400, "VALIDATION_ERROR", "Validation failed", undefined, {
            reason: ["A reason is required."],
          });
        }
        org.status = decision === "reject" ? "Rejected" : "Suspended";
        org.rejectionReason = reason.trim();
        if (decision === "suspend") {
          // Suspended businesses disappear from search; open listings are cancelled
          for (const l of db.listings)
            if (l.organizationId === org.id && (l.status === "Active" || l.status === "SoldOut"))
              l.status = "Cancelled";
        }
        notifyOwners(
          org.id,
          "OrganizationRejected",
          decision === "reject" ? "Business not approved" : "Business suspended",
          `${org.name}: ${reason.trim()}`,
        );
      } else {
        return notFound("Action");
      }
      return HttpResponse.json(org);
    }),
  ),
];
