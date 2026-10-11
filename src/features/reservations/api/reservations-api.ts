import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { listingKeys } from "@/features/listings/api/listings-api";
import { notificationKeys } from "@/features/notifications/api/notifications-api";
import { api } from "@/shared/api-client/client";
import type {
  Page,
  Reservation,
  ReservationScope,
  ReservationWithListing,
} from "@/shared/types/api";

export const reservationKeys = {
  all: ["reservations"] as const,
  mine: (scope: ReservationScope) => [...reservationKeys.all, "mine", scope] as const,
};

export function myReservationsQuery(scope: ReservationScope) {
  return queryOptions({
    queryKey: reservationKeys.mine(scope),
    queryFn: ({ signal }) =>
      api.get<Page<ReservationWithListing>>("/reservations/mine", {
        query: { status: scope, pageSize: 50 },
        signal,
      }),
  });
}

/** Stock, my reservations and notifications all change after reserving or cancelling. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: listingKeys.all }),
      queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    ]);
}

export function useReserve(listingId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (quantity: number) =>
      api.post<Reservation>(`/listings/${listingId}/reservations`, { quantity }),
    // A 409 means the stock changed: refresh it either way.
    onSettled: refresh,
  });
}

export function useCancelReservation() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (reservationId: string) =>
      api.post<Reservation>(`/reservations/${reservationId}/cancel`),
    onSettled: refresh,
  });
}
