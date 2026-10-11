import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { notificationsQuery } from "@/features/notifications/api/notifications-api";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { formatPrice } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { ReservationWithListing } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState } from "@/shared/ui/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { myReservationsQuery } from "../api/reservations-api";
import { ActiveReservationCard, HistoryReservationRow } from "../components/ReservationCard";

function ImpactCard({ history }: { history: ReservationWithListing[] | undefined }) {
  const collected = history?.filter((r) => r.status === "Collected") ?? [];
  const meals = collected.reduce((sum, r) => sum + r.quantity, 0);
  const saved = collected.reduce(
    (sum, r) => sum + (r.listing.originalPrice - r.listing.price) * r.quantity,
    0,
  );
  return (
    <section aria-labelledby="impact" className="rounded-xl bg-primary-tint p-5">
      <h2 id="impact" className="font-semibold">
        Your impact
      </h2>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-primary tabular-nums">{meals}</span>
        <span>meals rescued</span>
      </p>
      <p className="mt-1 text-sm">{formatPrice(saved)} saved compared with the original prices</p>
    </section>
  );
}

/** Reliability and what a low score means, so limits never feel arbitrary (note 6). */
function ReliabilityCard({ score }: { score: number }) {
  const low = score < 60;
  return (
    <section aria-labelledby="reliability" className="rounded-xl border p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="reliability" className="font-semibold">
          Reliability
        </h2>
        <p className="font-semibold tabular-nums">{score} / 100</p>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface ring-1 ring-border ring-inset"
      >
        <div
          className={cn("h-full rounded-full", low ? "bg-highlight" : "bg-primary")}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={cn("mt-3 text-sm", low ? "font-medium text-urgency" : "text-muted-foreground")}>
        {low
          ? "Your score is below 60, so you can hold 1 active reservation at a time. Collecting food raises it again."
          : "Collecting raises your score (+2). Late cancellations (-5) and no-shows (-20) lower it. Below 60 you can hold only 1 reservation."}
      </p>
    </section>
  );
}

function NotificationsPreview() {
  const { data } = useQuery(notificationsQuery(20));
  return (
    <section aria-labelledby="notifications-preview" className="rounded-xl border p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="notifications-preview" className="font-semibold">
          Notifications
        </h2>
        <Link
          to="/me/notifications"
          className="text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          See all
        </Link>
      </div>
      {data && data.items.length > 0 ? (
        <div className="-mx-2 mt-2">
          <NotificationList notifications={data.items.slice(0, 3)} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No notifications yet.</p>
      )}
    </section>
  );
}

/** Collect food with the least friction; see impact and reliability (wireframe 4). */
export function MyReservationsPage() {
  usePageTitle("My reservations");
  const { user, reloadUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "history" ? "history" : "active";
  const active = useQuery(myReservationsQuery("active"));
  const history = useQuery(myReservationsQuery("history"));

  // The reliability score changes as reservations are collected or missed.
  useEffect(() => {
    void reloadUser().catch(() => undefined);
  }, [reloadUser]);

  return (
    <div className="page-container py-8 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight">My reservations</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setSearchParams(value === "history" ? { tab: "history" } : {}, { replace: true })
          }
        >
          <TabsList aria-label="Reservations">
            <TabsTrigger value="active">
              Active{active.data ? ` (${active.data.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {active.isError ? (
              <ErrorState error={active.error} onRetry={() => void active.refetch()} />
            ) : active.isPending ? (
              <div className="h-56 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
            ) : active.data.items.length === 0 ? (
              <EmptyState
                title="No active reservations"
                action={
                  <Button asChild>
                    <Link to="/browse">Find food nearby</Link>
                  </Button>
                }
              >
                Reserve surplus food nearby and your pickup code will appear here.
              </EmptyState>
            ) : (
              active.data.items.map((r) => <ActiveReservationCard key={r.id} reservation={r} />)
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.isError ? (
              <ErrorState error={history.error} onRetry={() => void history.refetch()} />
            ) : history.isPending ? (
              <div className="h-56 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
            ) : history.data.items.length === 0 ? (
              <EmptyState title="No past reservations yet" />
            ) : (
              <ul className="divide-y rounded-xl border px-4">
                {history.data.items.map((r) => (
                  <HistoryReservationRow key={r.id} reservation={r} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <ImpactCard history={history.data?.items} />
          {user && <ReliabilityCard score={user.reliabilityScore} />}
          <NotificationsPreview />
        </div>
      </div>
    </div>
  );
}
