import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Tag,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { NotFoundPage } from "@/app/router/NotFoundPage";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Badge } from "@/shared/ui/badge";
import { ErrorState } from "@/shared/ui/states";
import { listingQuery } from "../api/listings-api";
import { ListingImage } from "../components/ListingImage";
import { ReservePanel } from "../components/ReservePanel";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatPickupWindow } from "@/shared/lib/format";
import { mapSearchUrl } from "@/shared/lib/maps";
import { PageHeader } from "@/shared/ui/page-header";

/** Announces stock changes from live updates without moving focus (design doc 3.2). */
function useStockAnnouncement(available: number | undefined) {
  const [previous, setPrevious] = useState(available);
  const [message, setMessage] = useState("");
  if (available !== previous) {
    setPrevious(available);
    if (previous !== undefined && available !== undefined) {
      setMessage(
        available === 0 ? "This listing just sold out." : `Stock updated: ${available} left.`,
      );
    }
  }
  return message;
}

/** One entry of the facts list: small label with a 16 px icon, then the value. */
function Fact({
  icon: Icon,
  term,
  children,
  className,
}: {
  icon: LucideIcon;
  term: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {term}
      </dt>
      <dd className="mt-0.5 pl-5.5 font-medium">{children}</dd>
    </div>
  );
}

export function ListingDetailPage() {
  const { id = "" } = useParams();
  const { data: listing, isPending, isError, error, refetch } = useQuery(listingQuery(id));
  usePageTitle(listing?.title ?? "Listing");
  const announcement = useStockAnnouncement(listing?.quantityAvailable);

  if (isError && isApiError(error) && error.status === 404) return <NotFoundPage />;
  if (isError) {
    return (
      <div className="page-container py-10">
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          title="Could not load this listing"
        />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="page-container grid gap-8 py-10 lg:grid-cols-[1fr_24rem]" aria-busy="true">
        <Skeleton className="aspect-[4/3] rounded-xl sm:aspect-[16/9]" />
        <Skeleton className="h-96 rounded-xl" />
        <span className="sr-only" role="status">
          Loading listing
        </span>
      </div>
    );
  }

  const mapsUrl = mapSearchUrl(listing.latitude, listing.longitude);

  return (
    <div className="page-container py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/browse" className="underline-offset-4 hover:text-foreground hover:underline">
              Browse
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-foreground">
            {listing.title}
          </li>
        </ol>
      </nav>

      {/* Mobile order: image and title, reserve panel, details. From lg the
          panel moves to a sticky right column spanning both rows. */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_24rem] lg:grid-rows-[auto_1fr] lg:gap-x-8">
        <div className="min-w-0 space-y-6">
          <ListingImage
            category={listing.category}
            imageUrl={listing.imageUrl}
            className="aspect-[4/3] w-full rounded-xl sm:aspect-[16/9]"
          />

          <PageHeader
            title={listing.title}
            description={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground">{listing.organization.name}</span>
                {listing.organization.isVerified && (
                  <Badge variant="success">
                    <BadgeCheck aria-hidden="true" />
                    Verified business
                  </Badge>
                )}
              </span>
            }
          />
        </div>

        <aside
          aria-label="Reserve"
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <ReservePanel listing={listing} />
        </aside>

        <div className="min-w-0 space-y-6">
          {listing.description && <p className="max-w-2xl text-lg">{listing.description}</p>}

          <dl className="grid max-w-2xl gap-x-8 gap-y-4 sm:grid-cols-2">
            <Fact icon={Clock} term="Pickup">
              {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
            </Fact>
            <Fact icon={Package} term="Left">
              {listing.quantityAvailable === 0
                ? "Sold out"
                : `${listing.quantityAvailable} of ${listing.quantityTotal}`}
              {" · "}up to {listing.maxPerUser} per person
            </Fact>
            <Fact icon={MapPin} term="Where" className="sm:col-span-2">
              {listing.address} ·{" "}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Open in maps
                <ExternalLink aria-hidden="true" className="size-3.5" />{" "}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Fact>
            <Fact icon={Tag} term="Category">
              {listing.category}
            </Fact>
          </dl>

          {/* Always shown, in a highlighted block (wireframe 3, note 2) */}
          <section
            aria-labelledby="allergens"
            className="max-w-2xl rounded-xl border border-highlight/40 bg-highlight-tint p-4"
          >
            <h2 id="allergens" className="flex items-center gap-2 font-semibold">
              <TriangleAlert aria-hidden="true" className="size-5 text-urgency" />
              Allergens
            </h2>
            <p className="mt-1">{listing.allergenNotes}</p>
            <p className="mt-2 text-sm">
              The business is responsible for the accuracy of this information. Ask at the counter
              if you are unsure.
            </p>
          </section>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
