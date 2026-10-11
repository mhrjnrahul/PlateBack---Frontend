import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { DEFAULT_AREA } from "@/shared/lib/areas";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/states";
import { impactQuery, listingsQuery } from "../api/listings-api";
import { ListingCard, ListingCardSkeleton } from "../components/ListingCard";
import { LocationSearch } from "../components/LocationSearch";

const numberFormat = new Intl.NumberFormat("en-IN");

/** Three real listings near the default area, with live stock and countdowns. */
function HeroListings() {
  const { data, isPending, isError } = useQuery(
    listingsQuery({ lat: DEFAULT_AREA.lat, lng: DEFAULT_AREA.lng, radiusKm: 5, pageSize: 3 }),
  );
  if (isError || data?.items.length === 0) return null;
  return (
    <section aria-labelledby="hero-listings" className="hidden md:block">
      <h2 id="hero-listings" className="mb-3 text-sm font-semibold text-muted-foreground">
        Available now in {DEFAULT_AREA.label}
      </h2>
      <ul className="space-y-3">
        {isPending
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <ListingCardSkeleton />
              </li>
            ))
          : data.items.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} layout="row" countdown />
              </li>
            ))}
      </ul>
    </section>
  );
}

/** One line of numbers, shown only once loaded (no dashes or zeros while loading). */
function ImpactLine() {
  const { data } = useQuery(impactQuery());
  if (!data) return null;
  return (
    <p className="page-container border-y py-5 text-muted-foreground">
      <strong className="font-semibold text-foreground tabular-nums">
        {numberFormat.format(data.mealsRescued)}
      </strong>{" "}
      meals rescued so far, from{" "}
      <strong className="font-semibold text-foreground tabular-nums">
        {numberFormat.format(data.partnerBusinesses)}
      </strong>{" "}
      local businesses.{" "}
      <strong className="font-semibold text-foreground tabular-nums">
        {numberFormat.format(data.activeListings)}
      </strong>{" "}
      listings are live right now.
    </p>
  );
}

function LastCall() {
  const { data, isPending, isError } = useQuery(listingsQuery({ sort: "pickup", pageSize: 4 }));
  if (isError) return null; // the rest of the page still works
  return (
    <section aria-labelledby="last-call" className="page-container py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="last-call" className="font-display text-2xl font-semibold tracking-tight">
            Last call
          </h2>
          <p className="mt-1 text-muted-foreground">Pickup windows that close soonest.</p>
        </div>
        <Link
          to="/browse"
          className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          See all listings
        </Link>
      </div>
      {!isPending && data.items.length === 0 ? (
        <EmptyState
          headingLevel="h3"
          title="Nothing left for today"
          className="mt-6"
          action={
            <Button asChild variant="outline">
              <Link to="/browse?time=tomorrow">See tomorrow's listings</Link>
            </Button>
          }
        >
          Businesses usually post their surplus in the afternoon. Check back later.
        </EmptyState>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isPending
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i}>
                  <ListingCardSkeleton />
                </li>
              ))
            : data.items.map((listing) => (
                <li key={listing.id} className="grid">
                  <ListingCard listing={listing} />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

const steps = [
  {
    title: "Find food nearby",
    text: "See what bakeries, cafes and restaurants near you have left today, and what it costs.",
  },
  {
    title: "Reserve it",
    text: "Pick how many you want. They're held for you until the pickup window ends.",
  },
  {
    title: "Show your code, pay, collect",
    text: "Show your pickup code at the counter and pay there. No card needed.",
  },
];

export function LandingPage() {
  usePageTitle("Good food shouldn't go to waste");
  const { user } = useAuth();
  const businessHref = user
    ? user.memberships.length
      ? `/org/${user.memberships[0]!.organizationId}`
      : "/org/new"
    : "/register?next=business";

  return (
    <>
      <section className="page-container grid items-start gap-10 py-10 md:grid-cols-[1fr_24rem] md:py-16 lg:grid-cols-[1fr_28rem] lg:gap-16">
        <div className="space-y-6 md:pt-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Reserve tonight's leftover food from bakeries and cafes near you, and pay at pickup.
          </h1>
          <LocationSearch />
          <p className="text-muted-foreground">
            Have food left at closing?{" "}
            <Link
              to={businessHref}
              className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
            >
              List your surplus
            </Link>
          </p>
        </div>
        <HeroListings />
      </section>

      <ImpactLine />
      <LastCall />

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 border-t">
        <div className="page-container py-12 md:py-16">
          <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((step, i) => (
              <li key={step.title} className="py-6 first:pt-0 md:px-8 md:py-0 md:first:pl-0">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl font-semibold text-primary tabular-nums"
                >
                  {i + 1}
                </span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="for-businesses"
        aria-labelledby="business-heading"
        className="scroll-mt-20 bg-surface"
      >
        <div className="page-container py-12 md:py-16">
          <h2 id="business-heading" className="font-display text-2xl font-semibold tracking-tight">
            Run a bakery, cafe or restaurant?
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Post what's left at the end of the day in under a minute, see how much has been
            reserved, and check pickup codes at the counter. Free for businesses.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to={businessHref}>
              List your surplus
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
