import { Navigation } from "lucide-react";
import { Link } from "react-router";
import { ListingImage } from "@/features/listings/components/ListingImage";
import { PickupCountdown } from "@/features/listings/components/PickupCountdown";
import { formatDateTime, formatPickupWindow } from "@/shared/lib/format";
import type { ReservationStatus, ReservationWithListing } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CancelReservationButton } from "./CancelReservationButton";

const statusBadge: Record<
  ReservationStatus,
  { label: string; variant: "success" | "neutral" | "danger" | "default" }
> = {
  Reserved: { label: "Reserved", variant: "success" },
  Collected: { label: "Collected", variant: "success" },
  Cancelled: { label: "Cancelled", variant: "neutral" },
  NoShow: { label: "No-show", variant: "danger" },
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { label, variant } = statusBadge[status];
  return <Badge variant={variant}>{label}</Badge>;
}

/** An active reservation with its pickup code (wireframe 4, notes 2-4). */
export function ActiveReservationCard({ reservation }: { reservation: ReservationWithListing }) {
  const { listing } = reservation;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
  return (
    <article className="overflow-hidden rounded-xl border-2 border-primary/30 bg-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <ListingImage
          category={listing.category}
          imageUrl={listing.imageUrl}
          className="hidden size-24 shrink-0 rounded-lg sm:flex"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">
              <Link
                to={`/listings/${reservation.listingId}`}
                className="underline-offset-4 hover:underline"
              >
                {listing.title}
              </Link>{" "}
              <span className="text-muted-foreground">× {reservation.quantity}</span>
            </h3>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.organizationName} · {listing.address}
          </p>
          <p className="font-semibold">
            {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
          </p>
          <PickupCountdown start={listing.pickupStart} end={listing.pickupEnd} />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        {/* Large, high-contrast and real text, so staff can read it from a phone (note 3) */}
        <div className="rounded-lg bg-highlight-tint px-4 py-2">
          <p className="text-xs font-semibold text-urgency">Pickup code</p>
          <p className="font-mono text-3xl font-bold tracking-wider">{reservation.pickupCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <Navigation aria-hidden="true" />
              Directions <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <CancelReservationButton reservation={reservation} />
        </div>
      </div>
    </article>
  );
}

/** A past reservation in the History tab. */
export function HistoryReservationRow({ reservation }: { reservation: ReservationWithListing }) {
  const { listing } = reservation;
  const when =
    reservation.status === "Collected" && reservation.collectedAt
      ? `Collected ${formatDateTime(reservation.collectedAt)}`
      : reservation.status === "Cancelled" && reservation.cancelledAt
        ? `Cancelled ${formatDateTime(reservation.cancelledAt)}${reservation.lateCancel ? " (late)" : ""}`
        : `Window ended ${formatDateTime(listing.pickupEnd)}`;
  return (
    <li className="flex items-center gap-4 py-4">
      <ListingImage
        category={listing.category}
        imageUrl={listing.imageUrl}
        className="size-14 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {listing.title}{" "}
          <span className="font-normal text-muted-foreground">× {reservation.quantity}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {listing.organizationName} · {when}
        </p>
      </div>
      <ReservationStatusBadge status={reservation.status} />
    </li>
  );
}
