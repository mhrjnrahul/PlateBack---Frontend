import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, MapPin, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { NotFoundPage } from "@/app/router/NotFoundPage";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Badge } from "@/shared/ui/badge";
import { ErrorState } from "@/shared/ui/states";
import { listingQuery } from "../api/listings-api";
import { ListingImage } from "../components/ListingImage";
import { ReservePanel } from "../components/ReservePanel";

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
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-surface" />
        <div className="h-96 animate-pulse rounded-xl bg-surface" />
        <span className="sr-only" role="status">
          Loading listing
        </span>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;

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

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <ListingImage
            category={listing.category}
            imageUrl={listing.imageUrl}
            className="aspect-[16/9] w-full rounded-xl"
          />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{listing.category}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{listing.organization.name}</span>
              {listing.organization.isVerified && (
                <Badge variant="success">
                  <BadgeCheck aria-hidden="true" />
                  Verified business
                </Badge>
              )}
            </p>
            <p className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
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
              </span>
            </p>
          </div>

          {listing.description && <p className="max-w-2xl text-lg">{listing.description}</p>}

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

        <aside aria-label="Reserve" className="lg:sticky lg:top-24 lg:self-start">
          <ReservePanel listing={listing} />
        </aside>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
