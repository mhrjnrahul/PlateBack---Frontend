import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Plus } from "lucide-react";
import { Link, useParams } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { cn } from "@/shared/lib/utils";
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
import { PageHeader } from "@/shared/ui/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

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
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const kpis = [
    { label: "Active listings", value: stats.data?.activeListings },
    { label: "Portions reserved", value: stats.data?.portionsReserved },
    { label: "Collected today", value: stats.data?.collectedToday },
    {
      label: "Meals rescued this month",
      value: stats.data?.mealsRescuedThisMonth,
      highlight: true,
    },
  ];

  return (
    <div className="page-container space-y-8 py-8 md:py-10">
      <PageHeader
        title={org.data.name}
        badge={
          verified && (
            <Badge variant="success">
              <BadgeCheck aria-hidden="true" />
              Verified
            </Badge>
          )
        }
        actions={
          verified && (
            <Button asChild>
              <Link to={`/org/${orgId}/listings/new`}>
                <Plus aria-hidden="true" />
                New listing
              </Link>
            </Button>
          )
        }
      />

      <StatusBanner org={org.data} />

      {verified && (
        <>
          {/* One strip, cells split by 1 px gaps; only the monthly total is highlighted */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={cn("p-5", kpi.highlight ? "bg-success-tint" : "bg-card")}
              >
                {/* Muted grey is too light on the green tint, so that cell uses ink */}
                <dt className={cn("text-sm", !kpi.highlight && "text-muted-foreground")}>
                  {kpi.label}
                </dt>
                <dd
                  className={cn(
                    "mt-1 text-3xl font-bold tabular-nums",
                    kpi.highlight && "text-primary",
                  )}
                >
                  {kpi.value ?? "–"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="min-w-0 space-y-8">
              <section aria-labelledby="listings-heading" className="space-y-3">
                <h2 id="listings-heading" className="text-xl font-semibold">
                  Your listings
                </h2>
                {listings.isError ? (
                  <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
                ) : listings.isPending ? (
                  <Skeleton className="h-48 rounded-xl" />
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
              <div className="space-y-2">
                <PickupCounter orgId={orgId} />
                <Link
                  to={`/org/${orgId}/pickup`}
                  className="inline-block text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
                >
                  Open the counter on its own
                </Link>
              </div>
              <ReservationQueue reservations={reservations.data?.items ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
