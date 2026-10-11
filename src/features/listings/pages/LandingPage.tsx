import { useQuery } from "@tanstack/react-query";
import { CalendarClock, HandPlatter, Search, Store } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";
import { impactQuery, listingsQuery } from "../api/listings-api";
import { ListingCard, ListingCardSkeleton } from "../components/ListingCard";
import { LocationSearch } from "../components/LocationSearch";

const numberFormat = new Intl.NumberFormat("en-US");

function ImpactStats() {
  const { data } = useQuery(impactQuery());
  const stats = [
    { value: data?.mealsRescued, label: "meals rescued" },
    { value: data?.partnerBusinesses, label: "partner businesses" },
    { value: data?.activeListings, label: "listings live right now" },
  ];
  return (
    <section aria-label="Impact so far" className="border-y bg-primary-tint/60">
      <dl className="page-container grid gap-6 py-8 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-3 sm:justify-center">
            <dt className="order-2">{s.label}</dt>
            <dd className="order-1 text-3xl font-bold text-primary tabular-nums">
              {s.value === undefined ? "–" : numberFormat.format(s.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LastCall() {
  const { data, isPending, isError } = useQuery(listingsQuery({ sort: "pickup", pageSize: 4 }));
  if (isError) return null; // the rest of the page still works
  return (
    <section aria-labelledby="last-call" className="page-container py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="last-call" className="text-2xl font-bold tracking-tight">
            Last call near you
          </h2>
          <p className="mt-1 text-muted-foreground">Pickup windows that end soonest.</p>
        </div>
        <Link
          to="/browse"
          className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          See all listings
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => <ListingCardSkeleton key={i} />)
          : data.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Search,
    title: "Find surplus nearby",
    text: "See what bakeries, cafes and restaurants near you have left today.",
  },
  {
    icon: CalendarClock,
    title: "Reserve in a few taps",
    text: "Choose a quantity and reserve. The food is held for you until the window ends.",
  },
  {
    icon: HandPlatter,
    title: "Show your code & collect",
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
      <section className="page-container grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            Good food shouldn't <span className="text-primary">go to waste.</span>
          </h1>
          <p className="max-w-xl text-xl text-muted-foreground">
            Reserve end-of-day surplus from bakeries, cafes and restaurants near you. Pay at pickup.
            Collect in the window.
          </p>
          <LocationSearch />
        </div>
        {/* Decorative illustration; the headline carries the message (wireframe 1, note 3) */}
        <div
          aria-hidden="true"
          className="relative hidden aspect-[4/3] overflow-hidden rounded-xl bg-primary-tint md:block"
        >
          <div className="absolute -top-10 -right-10 size-64 rounded-full bg-primary/15" />
          <div className="absolute -bottom-16 -left-8 size-72 rounded-full bg-highlight/25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-48 items-center justify-center rounded-full border-[14px] border-primary bg-background shadow-lg">
              <div className="size-16 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </section>

      <ImpactStats />
      <LastCall />

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 bg-surface">
        <div className="page-container py-12 md:py-16">
          <h2 id="how-heading" className="text-2xl font-bold tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border bg-card p-6">
                <step.icon aria-hidden="true" className="size-8 text-primary" />
                <h3 className="mt-4 font-semibold">
                  <span className="text-primary">{i + 1}.</span> {step.title}
                </h3>
                <p className="mt-1 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="for-businesses" aria-labelledby="business-heading" className="scroll-mt-20">
        <div className="page-container grid items-center gap-8 py-12 md:grid-cols-[1fr_auto] md:py-16">
          <div className="flex gap-4">
            <Store aria-hidden="true" className="mt-1 size-10 shrink-0 text-primary" />
            <div>
              <h2 id="business-heading" className="text-2xl font-bold tracking-tight">
                Run a bakery, cafe or restaurant?
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Post tonight's surplus in under a minute, see exactly how much is reserved, and
                verify pickups at the counter. Free for businesses to join.
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="outline">
            <Link to={businessHref}>List your surplus</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
