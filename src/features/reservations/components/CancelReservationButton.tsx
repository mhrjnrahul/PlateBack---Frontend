import { useAuth } from "@/features/auth/session/auth-context";
import { isApiError } from "@/shared/api-client/api-error";
import type { ReservationWithListing } from "@/shared/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import { useCancelReservation } from "../api/reservations-api";

/**
 * Cancel with a confirmation. Cancelling after the window opens is a late
 * cancellation (-5 reliability), and the dialog says so before it happens.
 */
export function CancelReservationButton({ reservation }: { reservation: ReservationWithListing }) {
  const cancel = useCancelReservation();
  const { reloadUser } = useAuth();
  const isLate = new Date() >= new Date(reservation.listing.pickupStart);

  function handleConfirm() {
    cancel.mutate(reservation.id, {
      onSuccess: async (result) => {
        toast(
          result.lateCancel
            ? "Reservation cancelled (late cancellation, reliability -5)."
            : "Reservation cancelled.",
        );
        await reloadUser();
      },
      onError: (error) =>
        toast.error(isApiError(error) ? error.message : "Could not cancel. Please try again."),
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive-tint"
          disabled={cancel.isPending}
        >
          {cancel.isPending ? "Cancelling…" : "Cancel"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
          <AlertDialogDescription>
            {reservation.quantity} × {reservation.listing.title} goes back to{" "}
            {reservation.listing.organizationName} for someone else to collect.{" "}
            {isLate
              ? "The pickup window has already opened, so this counts as a late cancellation and lowers your reliability score by 5."
              : "Cancelling before the window opens is free."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep reservation</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Cancel reservation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
