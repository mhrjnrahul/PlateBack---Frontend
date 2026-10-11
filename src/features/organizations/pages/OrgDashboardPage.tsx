import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Plus } from "lucide-react";
import { Link, useParams } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import type { Organization } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/states";
import {
  organizationListingsQuery,
  organizationQuery,
  organizationReservationsQuery,
  organizationStatsQuery,
} from "../api/organizations-api";
import { MealsChart } from "../components/MealsChart";
import { OrgListingsTable } from "../components/OrgListingsTable";
import { PickupCounter } from "../components/PickupCounter";
import { ReservationQueue } from "../components/ReservationQueue";

function StatusBanner({ org }: { org: Organization }) {
  if (org.status === "Pending") {
    return (
      <Alert variant="warning" title="Waiting for verification">
        An admin checks every new business before it can publish listings. This usually takes less
        than a day; you'll get a notification when it's done.
      </Alert>
    );
  }
  if (org.status === "Rejected" || org.status === "Suspended") {
    return (
      <Alert variant="danger" title={org.status === "Rejected" ? "Not approved" : "Suspended"}>
        {org.rejectionReason ?? "Contact support for details."}
      </Alert>
    );
  }
  return null;
}

/** Run the day: listings, stock, handover (wireframe 5). */
export function OrgDashboardPage() {
  const { orgId = "" } = useParams();
  const org = useQuery(organizationQuery(orgId));
  const verified = org.data?.status === "Verified";
  const stats = useQuery({ ...organizationStatsQuery(orgId), enabled: verified });
  const listings = useQuery({ ...organizationListingsQuery(orgId), enabled: verified });
  const reservations = useQuery({ ...organizationReservationsQuery(orgId), enabled: verified });
  usePageTitle(org.data ? `${org.data.name} dashboard` : "Business dashboard");

  if (org.isError) {
    return (
      <div className="page-container py-10">
        <ErrorState error={org.error} onRetry={() => void org.refetch()} />
      </div>
    );
  }
  if (org.isPending) {
    return (
      <div className="page-container py-10">
        <div className="h-64 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
      </div>
    );
  }

  const kpis = [
    { label: "Active listings", value: stats.data?.activeListings },
    { label: "Portions reserved", value: stats.data?.portionsReserved },
    { label: "Collected today", value: stats.data?.collectedToday },
    { label: "Meals rescued this month", value: stats.data?.mealsRescuedThisMonth },
  ];

  return (
    <div className="page-container space-y-8 py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{org.data.name}</h1>
          {verified && (
            <Badge variant="success">
              <BadgeCheck aria-hidden="true" />
              Verified
            </Badge>
          )}
        </div>
        {verified && (
          <Button asChild>
            <Link to={`/org/${orgId}/listings/new`}>
              <Plus aria-hidden="true" />
              New listing
            </Link>
          </Button>
        )}
      </div>

      <StatusBanner org={org.data} />

      {verified && (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
              <div
                key={kpi.label}
                className={i === 3 ? "rounded-xl bg-primary-tint p-5" : "rounded-xl border p-5"}
              >
                {/* Muted grey is below 4.5:1 on the green tint, so the tinted card uses ink */}
                <dt className={i === 3 ? "text-sm" : "text-sm text-muted-foreground"}>
                  {kpi.label}
                </dt>
                <dd className="mt-1 text-3xl font-bold tabular-nums">{kpi.value ?? "–"}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="min-w-0 space-y-8">
              <section aria-labelledby="listings-heading" className="space-y-3">
                <h2 id="listings-heading" className="text-lg font-semibold">
                  Your listings
                </h2>
                {listings.isError ? (
                  <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
                ) : listings.isPending ? (
                  <div className="h-48 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
                ) : (
                  <OrgListingsTable
                    orgId={orgId}
                    listings={listings.data.items}
                    canPublish={verified}
                  />
                )}
              </section>
              {stats.data && <MealsChart days={stats.data.mealsRescuedByDay} />}
            </div>
            {/* At the counter on a phone, the code field comes first (wireframe M5) */}
            <div className="order-first space-y-6 lg:order-none">
              <PickupCounter orgId={orgId} />
              <ReservationQueue reservations={reservations.data?.items ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
