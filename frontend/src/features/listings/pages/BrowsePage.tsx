import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useNow } from "@/shared/hooks/use-now";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { EmptyState, ErrorState } from "@/shared/ui/states";
import { listingsQuery } from "../api/listings-api";
import {
  activeFilters,
  locationLabel,
  readFilters,
  SORT_OPTIONS,
  toSearchParams,
  writeFilters,
  type BrowseFilters,
} from "../browse-filters";
import { BrowseFilterPanel } from "../components/BrowseFilterPanel";
import { ListingCard, ListingCardSkeleton } from "../components/ListingCard";
import { Pagination } from "../components/Pagination";
import { Select } from "@/shared/ui/select";
import { useLiveConnected } from "@/shared/live/live-status";
import { LiveDot } from "@/shared/ui/live-dot";
import { PageHeader } from "@/shared/ui/page-header";

const PAGE_SIZE = 12;

/** Everything the chips can remove; location and sort stay. */
const clearAll = { q: "", category: "", time: "", maxPrice: "", radiusKm: 5, page: 1 } as const;

/** The customer dashboard: find a suitable nearby listing in a few seconds (wireframe 2). */
export function BrowsePage() {
  usePageTitle("Browse listings");
  const id = useId();
  const live = useLiveConnected();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramString = searchParams.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(paramString)), [paramString]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The search box follows the URL (back button, Reset) but can run ahead of it while typing.
  const [query, setQuery] = useState(filters.q);
  const [urlQuery, setUrlQuery] = useState(filters.q);
  if (filters.q !== urlQuery) {
    setUrlQuery(filters.q);
    setQuery(filters.q);
  }

  // Rounded to the minute so the query key only changes once a minute.
  const minute = Math.floor(useNow(30_000).getTime() / 60_000);
  const apiParams = useMemo(
    () => toSearchParams(filters, new Date(minute * 60_000), PAGE_SIZE),
    [filters, minute],
  );
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    listingsQuery(apiParams),
  );

  function update(patch: Partial<BrowseFilters>) {
    // Changing any filter goes back to page 1
    setSearchParams(writeFilters({ ...filters, page: 1, ...patch }));
  }

  // Search as you type, 300 ms after the last key (design doc 3.3, note 1)
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = window.setTimeout(() => {
      setSearchParams((current) => writeFilters({ ...readFilters(current), q: query, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery, setSearchParams]);

  const resultText = data
    ? `${data.total} ${data.total === 1 ? "listing" : "listings"} within ${filters.radiusKm} km of ${locationLabel(filters)}`
    : "Loading listings";
  const chips = activeFilters(filters);
  const activeFilterCount = chips.filter((c) => c.key !== "q").length;

  return (
    <div className="page-container py-8 md:py-10">
      <PageHeader title="Browse listings" />
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* The results heading doubles as the count; announced politely when it changes */}
        <h2
          id={`${id}-results`}
          aria-live="polite"
          className="text-base font-normal text-muted-foreground"
        >
          {resultText}
        </h2>
        <LiveDot detail={live ? "stock updates instantly" : "stock updates every 15 seconds"} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor={`${id}-q`} className="sr-only">
            Search listings
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={`${id}-q`}
            type="search"
            placeholder="Search bread, thali, bakery..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <label htmlFor={`${id}-sort`} className="sr-only">
            Sort by
          </label>
          <div className="flex-1">
            <Select
              id={`${id}-sort`}
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as BrowseFilters["sort"] })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          {/* Filters become a bottom sheet below md (design doc 3.2) */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal aria-hidden="true" />
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85dvh] overflow-y-auto rounded-t-xl"
              aria-describedby={undefined}
            >
              <SheetTitle className="px-4 pt-4 text-lg">Filters</SheetTitle>
              <div className="px-4">
                <BrowseFilterPanel filters={filters} onChange={update} />
              </div>
              <div className="sticky bottom-0 border-t bg-background p-4">
                <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                  Show {data?.total ?? ""} results
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="sr-only">Active filters:</span>
          {chips.map((chip) => (
            <Button
              key={chip.key}
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => update(chip.clear)}
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <X aria-hidden="true" />
            </Button>
          ))}
          <Button
            variant="link"
            size="sm"
            className="h-auto px-1"
            onClick={() => setSearchParams(writeFilters({ ...filters, ...clearAll }))}
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr]">
        <aside aria-label="Filters" className="hidden md:block">
          <div className="sticky top-24 space-y-4 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                Reset
              </Button>
            </div>
            <BrowseFilterPanel filters={filters} onChange={update} />
          </div>
        </aside>

        <section aria-labelledby={`${id}-results`} className="min-w-0 space-y-6">
          {isError ? (
            <ErrorState
              error={error}
              onRetry={() => void refetch()}
              title="Could not load listings"
            />
          ) : isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState
              title="Nothing nearby right now"
              action={
                filters.radiusKm < 25 ? (
                  <Button variant="outline" onClick={() => update({ radiusKm: 25 })}>
                    Search within 25 km
                  </Button>
                ) : undefined
              }
            >
              Try a bigger radius, another area, or fewer filters. New listings appear through the
              afternoon.
            </EmptyState>
          ) : (
            <div className={isFetching ? "opacity-70 transition-opacity" : undefined}>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((listing) => (
                  <li key={listing.id} className="grid">
                    <ListingCard listing={listing} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data && (
            <Pagination
              page={filters.page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPageChange={(page) => {
                setSearchParams(writeFilters({ ...filters, page }));
                window.scrollTo({ top: 0 });
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
