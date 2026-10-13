import { Clock } from "lucide-react";
import { Link } from "react-router";
import { formatDistance, formatPickupWindow } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { ListingSummary } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Price } from "@/shared/ui/price";
import { Skeleton } from "@/shared/ui/skeleton";
import { ListingImage } from "./ListingImage";
import { PickupCountdown } from "./PickupCountdown";

/** "3 left" (urgency colour at 2 or fewer), or "Sold out". */
export function StockChip({
  listing,
}: {
  listing: Pick<ListingSummary, "status" | "quantityAvailable">;
}) {
  if (listing.status === "SoldOut" || listing.quantityAvailable === 0) {
    return <Badge variant="neutral">Sold out</Badge>;
  }
  return (
    <Badge variant={listing.quantityAvailable <= 2 ? "warning" : "outline"}>
      {listing.quantityAvailable} left
    </Badge>
  );
}

/**
 * A listing in a grid or list. Below sm it is a compact row (96 px image on
 * the left); from sm up a vertical card with a 4:3 image. The whole card is
 * one link whose accessible name is the title; the rest of the card is its
 * click area (design doc 3.3, note 4).
 */
export function ListingCard({
  listing,
  headingLevel = "h3",
  countdown = false,
  layout = "responsive",
  className,
}: {
  listing: ListingSummary;
  headingLevel?: "h2" | "h3";
  /** Adds a live "Window closes in" line (landing hero). */
  countdown?: boolean;
  /** "row" keeps the compact row at every width (narrow columns). */
  layout?: "responsive" | "row";
  className?: string;
}) {
  const Heading = headingLevel;
  const card = layout === "responsive";
  const place =
    listing.distanceKm != null
      ? `${listing.organization.name} · ${formatDistance(listing.distanceKm)}`
      : listing.organization.name;

  return (
    <article
      className={cn(
        "relative flex min-w-0 gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary",
        card && "sm:flex-col sm:gap-0 sm:p-0",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        className,
      )}
    >
      <ListingImage
        category={listing.category}
        imageUrl={listing.imageUrl}
        className={cn(
          "size-24 shrink-0 rounded-md",
          card && "sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none sm:rounded-t-xl",
        )}
      />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", card && "sm:p-4")}>
        <Heading className="text-base leading-snug font-semibold">
          <Link
            to={`/listings/${listing.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {listing.title}
          </Link>
        </Heading>
        <p className="truncate text-sm text-muted-foreground">{place}</p>
        <Price price={listing.price} mrp={listing.originalPrice} savings="percent" size="sm" />
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <StockChip listing={listing} />
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Clock aria-hidden="true" className="size-4" />
            {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
          </span>
        </div>
        {countdown && <PickupCountdown start={listing.pickupStart} end={listing.pickupEnd} />}
      </div>
    </article>
  );
}

/** Same footprint as ListingCard (row below sm, card from sm), while results load. */
export function ListingCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border p-3 sm:flex-col sm:gap-0 sm:p-0">
      <Skeleton className="size-24 shrink-0 sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none sm:rounded-t-xl" />
      <div className="flex-1 space-y-2 sm:p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
