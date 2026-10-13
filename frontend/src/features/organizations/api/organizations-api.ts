import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { listingKeys } from "@/features/listings/api/listings-api";
import { api } from "@/shared/api-client/client";
import type {
  CreateOrganizationRequest,
  ListingDetail,
  ListingInput,
  ListingSummary,
  Organization,
  OrganizationReservation,
  OrganizationStats,
  Page,
} from "@/shared/types/api";

export const organizationKeys = {
  all: ["organizations"] as const,
  detail: (id: string) => [...organizationKeys.all, id] as const,
  stats: (id: string) => [...organizationKeys.all, id, "stats"] as const,
  listings: (id: string) => [...organizationKeys.all, id, "listings"] as const,
  reservations: (id: string) => [...organizationKeys.all, id, "reservations"] as const,
};

const LIVE_MS = 15_000;

export function organizationQuery(id: string) {
  return queryOptions({
    queryKey: organizationKeys.detail(id),
    queryFn: ({ signal }) => api.get<Organization>(`/organizations/${id}`, { signal }),
  });
}

export function organizationStatsQuery(id: string) {
  return queryOptions({
    queryKey: organizationKeys.stats(id),
    queryFn: ({ signal }) => api.get<OrganizationStats>(`/organizations/${id}/stats`, { signal }),
    refetchInterval: LIVE_MS,
  });
}

export function organizationListingsQuery(id: string) {
  return queryOptions({
    queryKey: organizationKeys.listings(id),
    queryFn: ({ signal }) =>
      api.get<Page<ListingSummary>>(`/organizations/${id}/listings`, {
        query: { pageSize: 50 },
        signal,
      }),
    refetchInterval: LIVE_MS,
  });
}

export function organizationReservationsQuery(id: string) {
  return queryOptions({
    queryKey: organizationKeys.reservations(id),
    queryFn: ({ signal }) =>
      api.get<Page<OrganizationReservation>>(`/organizations/${id}/reservations`, {
        query: { pageSize: 50 },
        signal,
      }),
    refetchInterval: LIVE_MS,
  });
}

/** Everything on the dashboard (and public stock) changes together. */
function useRefreshOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId) }),
      queryClient.invalidateQueries({ queryKey: listingKeys.all }),
    ]);
}

export function useVerifyPickup(orgId: string) {
  const refresh = useRefreshOrganization(orgId);
  return useMutation({
    mutationFn: (pickupCode: string) =>
      api.post<OrganizationReservation>("/reservations/verify", { pickupCode }),
    onSuccess: refresh,
  });
}

export function useCancelListing(orgId: string) {
  const refresh = useRefreshOrganization(orgId);
  return useMutation({
    mutationFn: (listingId: string) => api.post<ListingDetail>(`/listings/${listingId}/cancel`),
    onSuccess: refresh,
  });
}

export function useCreateListing(orgId: string) {
  const refresh = useRefreshOrganization(orgId);
  return useMutation({
    mutationFn: (input: ListingInput) =>
      api.post<ListingDetail>(`/organizations/${orgId}/listings`, input),
    onSuccess: refresh,
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (input: CreateOrganizationRequest) =>
      api.post<Organization>("/organizations", input),
  });
}
