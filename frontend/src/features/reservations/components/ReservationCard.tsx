import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Navigation,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import { PickupCountdown } from "@/features/listings/components/PickupCountdown";
import { formatDateTime, formatPickupWindow } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { ReservationStatus, ReservationWithListing } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Price } from "@/shared/ui/price";
import { CancelReservationButton } from "./CancelReservationButton";
import { mapDirectionsUrl } from "@/shared/lib/maps";

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

const statusText: Record<
  ReservationStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  Reserved: { label: "Reserved", icon: Clock, className: "text-primary" },
  Collected: { label: "Collected", icon: CircleCheck, className: "text-primary" },
  Cancelled: { label: "Cancelled", icon: CircleX, className: "text-muted-foreground" },
  NoShow: { label: "No-show", icon: CircleAlert, className: "text-destructive" },
};

/** Status as coloured text with an icon, for compact rows (the text carries the meaning). */
export function ReservationStatusText({ status }: { status: ReservationStatus }) {
  const { label, icon: Icon, className } = statusText[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}

/**
 * An active reservation, code first: the pickup code is what the customer
 * needs at the counter, so it leads (wireframe 4, notes 2-4).
 */
export function ActiveReservationCard({ reservation }: { reservation: ReservationWithListing }) {
  const { listing } = reservation;
  const mapsUrl = mapDirectionsUrl(listing.latitude, listing.longitude);
  return (
    <article className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Large, high-contrast and real text, so staff can read it from a phone (note 3) */}
        <div className="rounded-md border-2 border-foreground px-5 py-3 text-center sm:text-left">
          <p className="text-sm font-semibold text-muted-foreground">Pickup code</p>
          <p className="font-mono text-4xl font-bold tracking-wider whitespace-nowrap">
            {reservation.pickupCode}
          </p>
          <p className="text-sm text-muted-foreground">Show this at the counter</p>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* h2: the cards sit directly under the page title (the tabs are not headings) */}
          <h2 className="text-base font-semibold">
            <Link
              to={`/listings/${reservation.listingId}`}
              className="underline-offset-4 hover:underline"
            >
              {listing.title}
            </Link>{" "}
            <span className="font-normal text-muted-foreground">× {reservation.quantity}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {listing.organizationName} · {listing.address}
          </p>
          <p className="font-semibold">
            {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
          </p>
          <PickupCountdown start={listing.pickupStart} end={listing.pickupEnd} />
          {/* Total for the reserved quantity, paid at the counter */}
          <Price
            price={listing.price * reservation.quantity}
            mrp={listing.originalPrice * reservation.quantity}
            size="sm"
            className="pt-1"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <Button asChild variant="secondary">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation aria-hidden="true" />
            Directions <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
        <CancelReservationButton reservation={reservation} />
      </div>
    </article>
  );
}

/** A past reservation in the History tab: one compact line. */
export function HistoryReservationRow({ reservation }: { reservation: ReservationWithListing }) {
  const { listing } = reservation;
  const when =
    reservation.status === "Collected" && reservation.collectedAt
      ? formatDateTime(reservation.collectedAt)
      : reservation.status === "Cancelled" && reservation.cancelledAt
        ? `${formatDateTime(reservation.cancelledAt)}${reservation.lateCancel ? " (late)" : ""}`
        : formatDateTime(listing.pickupEnd);
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {listing.title}{" "}
          <span className="font-normal text-muted-foreground">× {reservation.quantity}</span>
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {listing.organizationName} · {when}
        </p>
      </div>
      <ReservationStatusText status={reservation.status} />
    </li>
  );
}
