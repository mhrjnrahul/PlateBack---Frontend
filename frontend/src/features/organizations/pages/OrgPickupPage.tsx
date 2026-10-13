import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { PageHeader } from "@/shared/ui/page-header";
import { organizationReservationsQuery } from "../api/organizations-api";
import { PickupCounter } from "../components/PickupCounter";
import { ReservationQueue } from "../components/ReservationQueue";

/**
 * The counter on its own, for staff holding a phone at the till: one large
 * code field, then today's queue. Same checks as on the dashboard.
 */
export function OrgPickupPage() {
  const { orgId = "" } = useParams();
  usePageTitle("Pickup counter");
  const reservations = useQuery(organizationReservationsQuery(orgId));

  return (
    <div className="page-container max-w-xl space-y-6 py-8 md:py-10">
      <PageHeader
        title="Pickup counter"
        description="Type the code the customer shows you. It's marked collected straight away."
      />
      <PickupCounter orgId={orgId} variant="page" />
      <ReservationQueue reservations={reservations.data?.items ?? []} />
      <p className="text-sm text-muted-foreground">
        <Link
          to={`/org/${orgId}`}
          className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          Back to the dashboard
        </Link>
      </p>
    </div>
  );
}
