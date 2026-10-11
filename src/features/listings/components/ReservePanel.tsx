import { Link, useLocation } from "react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth/session/auth-context";
import { useReserve } from "@/features/reservations/api/reservations-api";
import { isApiError } from "@/shared/api-client/api-error";
import { discountPercent, formatPickupWindow, formatPrice } from "@/shared/lib/format";
import type { ListingDetail, Reservation } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PickupCountdown } from "./PickupCountdown";
import { QuantityStepper } from "./QuantityStepper";
import { ReservedDialog } from "./ReservedDialog";
import { StockBar } from "./StockBar";

/** Why reserving is not possible right now, or null when it is. */
function blockedReason(listing: ListingDetail, now: Date) {
  if (listing.status === "Cancelled") return "Listing cancelled";
  if (listing.status === "Expired" || new Date(listing.pickupEnd) <= now) return "Listing ended";
  if (listing.status === "SoldOut" || listing.quantityAvailable === 0) return "Sold out";
  return null;
}

/**
 * Price, live stock, pickup window and the Reserve action (wireframe 3).
 * The server decides: stock shown here is never trusted, and a 409 answer
 * is shown inline while the stock figure refreshes.
 */
export function ReservePanel({ listing }: { listing: ListingDetail }) {
  const { user } = useAuth();
  const location = useLocation();
  const reserve = useReserve(listing.id);
  const [quantity, setQuantity] = useState(1);
  const [reserved, setReserved] = useState<Reservation | null>(null);

  const max = Math.max(1, Math.min(listing.quantityAvailable, listing.maxPerUser));
  const qty = Math.min(quantity, max);
  const blocked = blockedReason(listing, new Date());
  const discount = discountPercent(listing.originalPrice, listing.price);
  const error = reserve.error;

  function handleReserve() {
    reserve.mutate(qty, { onSuccess: (reservation) => setReserved(reservation) });
  }

  return (
    <div className="space-y-5 rounded-xl border-2 border-primary/30 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-4xl font-bold text-primary">{formatPrice(listing.price)}</p>
        {listing.originalPrice > listing.price && (
          <p className="text-muted-foreground line-through">
            <span className="sr-only">was</span> {formatPrice(listing.originalPrice)}
          </p>
        )}
        {discount > 0 && <Badge variant="warning">{discount}% off</Badge>}
      </div>

      <StockBar available={listing.quantityAvailable} total={listing.quantityTotal} />

      <div>
        <p className="text-sm text-muted-foreground">Pickup</p>
        <p className="font-semibold">
          {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
        </p>
        <PickupCountdown start={listing.pickupStart} end={listing.pickupEnd} className="mt-1" />
      </div>

      {!blocked && user && (
        <QuantityStepper
          value={qty}
          max={max}
          onChange={setQuantity}
          disabled={reserve.isPending}
          hint={`Max ${listing.maxPerUser} per person`}
        />
      )}

      {isApiError(error) && (
        <Alert
          variant="danger"
          live="assertive"
          title={error.status === 409 ? "Could not reserve" : "Something went wrong"}
        >
          {error.message} {error.code === "SOLD_OUT" && "The stock figure has been refreshed."}
        </Alert>
      )}

      {blocked ? (
        <Button size="lg" className="w-full" disabled>
          {blocked}
        </Button>
      ) : user ? (
        <Button size="lg" className="w-full" onClick={handleReserve} disabled={reserve.isPending}>
          {reserve.isPending ? "Reserving…" : `Reserve · ${formatPrice(listing.price * qty)}`}
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
            Log in to reserve
          </Link>
        </Button>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Pay at pickup. No card needed. Free cancellation until the window opens.
      </p>

      <ReservedDialog reservation={reserved} listing={listing} onClose={() => setReserved(null)} />
    </div>
  );
}
