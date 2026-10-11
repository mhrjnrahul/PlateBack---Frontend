import { MapPin } from "lucide-react";
import { Link } from "react-router";
import { formatDistance, formatPickupWindow, formatPrice } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { ListingSummary } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { ListingImage } from "./ListingImage";

function StockBadge({ listing }: { listing: ListingSummary }) {
  if (listing.status === "SoldOut" || listing.quantityAvailable === 0) {
    return <Badge variant="neutral">Sold out</Badge>;
  }
  return (
    <Badge variant={listing.quantityAvailable <= 3 ? "warning" : "success"}>
      {listing.quantityAvailable} left
    </Badge>
  );
}

/**
 * A listing in a grid or list. The whole card is one link (the title), with
 * the rest of the card as its click area (design doc 3.3, note 4).
 */
export function ListingCard({
  listing,
  layout = "vertical",
  headingLevel = "h3",
}: {
  listing: ListingSummary;
  layout?: "vertical" | "horizontal";
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        layout === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          layout === "vertical" ? "aspect-[16/9]" : "w-28 sm:w-32",
        )}
      >
        <ListingImage
          category={listing.category}
          imageUrl={listing.imageUrl}
          className="size-full"
        />
        <div className="absolute top-2 left-2">
          <StockBadge listing={listing} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Heading className="leading-snug font-semibold">
          <Link
            to={`/listings/${listing.id}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {listing.title}
          </Link>
        </Heading>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>{listing.organization.name}</span>
          {listing.distanceKm != null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {formatDistance(listing.distanceKm)}
              </span>
            </>
          )}
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatPrice(listing.price)}</span>
          {listing.originalPrice > listing.price && (
            <span className="text-sm text-muted-foreground line-through">
              <span className="sr-only">was</span> {formatPrice(listing.originalPrice)}
            </span>
          )}
        </p>
        <p className="text-sm">{formatPickupWindow(listing.pickupStart, listing.pickupEnd)}</p>
      </div>
    </article>
  );
}

/** Same footprint as ListingCard, shown while results load. */
export function ListingCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[16/9] animate-pulse bg-surface" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}
