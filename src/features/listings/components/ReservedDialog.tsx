import { CircleCheck } from "lucide-react";
import { Link } from "react-router";
import { formatPickupWindow } from "@/shared/lib/format";
import type { ListingDetail, Reservation } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

/** Confirmation with the pickup code, shown right after reserving. */
export function ReservedDialog({
  reservation,
  listing,
  onClose,
}: {
  reservation: Reservation | null;
  listing: ListingDetail;
  onClose: () => void;
}) {
  return (
    <Dialog open={reservation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <CircleCheck aria-hidden="true" className="size-10 text-primary" />
          <DialogTitle className="text-xl">Reserved!</DialogTitle>
          <DialogDescription>
            {reservation?.quantity} × {listing.title} at {listing.organization.name}.
          </DialogDescription>
        </DialogHeader>
        {reservation && (
          <div className="rounded-xl bg-highlight-tint p-5 text-center">
            <p className="text-sm">Show this code at the counter</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-wider">
              {reservation.pickupCode}
            </p>
            <p className="mt-2 text-sm">
              {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
            </p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Keep browsing
          </Button>
          <Button asChild>
            <Link to="/me/reservations">See my reservations</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
