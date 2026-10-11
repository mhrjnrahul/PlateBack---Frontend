import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/shared/api-client/client";
import type {
  ImpactStats,
  ListingDetail,
  ListingSearchParams,
  ListingSummary,
  Page,
} from "@/shared/types/api";

/** Query keys for listings; invalidate `listingKeys.all` after any stock change. */
export const listingKeys = {
  all: ["listings"] as const,
  search: (params: ListingSearchParams) => [...listingKeys.all, "search", params] as const,
  detail: (id: string) => [...listingKeys.all, "detail", id] as const,
  impact: ["stats", "impact"] as const,
};

/** Live stock is polled while a page is open (the polling fallback of decision D12). */
export const LIVE_REFRESH_MS = 15_000;

export function listingsQuery(params: ListingSearchParams) {
  return queryOptions({
    queryKey: listingKeys.search(params),
    queryFn: ({ signal }) => api.get<Page<ListingSummary>>("/listings", { query: params, signal }),
    // Keep showing the old results while new filters load (no flash of empty).
    placeholderData: keepPreviousData,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function listingQuery(id: string) {
  return queryOptions({
    queryKey: listingKeys.detail(id),
    queryFn: ({ signal }) => api.get<ListingDetail>(`/listings/${id}`, { signal }),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function impactQuery() {
  return queryOptions({
    queryKey: listingKeys.impact,
    queryFn: ({ signal }) => api.get<ImpactStats>("/stats/impact", { signal }),
    staleTime: 5 * 60_000, // cached 5 minutes on the server too (design doc 6.2)
  });
}
