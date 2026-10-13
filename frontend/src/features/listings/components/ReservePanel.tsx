import { Link, useLocation } from "react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth/session/auth-context";
import { useReserve } from "@/features/reservations/api/reservations-api";
import { isApiError } from "@/shared/api-client/api-error";
import { useHtmlFlag } from "@/shared/hooks/use-html-flag";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { formatMoney } from "@/shared/lib/money";
import type { ListingDetail, Reservation } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Price } from "@/shared/ui/price";
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
 * Price, live stock, pickup countdown and the Reserve action (wireframe 3).
 * From lg the controls sit in the side panel; below lg they move to a bar
 * fixed to the bottom of the screen (above the tab bar), so Reserve is always
 * in reach. Only one set of controls is rendered, so there is never a
 * duplicate button or live region.
 *
 * The server decides: stock shown here is never trusted, and a 409 answer is
 * shown inline while the stock figure refreshes.
 */
export function ReservePanel({ listing }: { listing: ListingDetail }) {
  const { user } = useAuth();
  const location = useLocation();
  const reserve = useReserve(listing.id);
  const [quantity, setQuantity] = useState(1);
  const [reserved, setReserved] = useState<Reservation | null>(null);
  const desktop = useMediaQuery("(width >= 64rem)");
  useHtmlFlag("data-reserve-bar", !desktop);

  const max = Math.max(1, Math.min(listing.quantityAvailable, listing.maxPerUser));
  const qty = Math.min(quantity, max);
  const blocked = blockedReason(listing, new Date());
  const error = reserve.error;
  const canReserve = !blocked && user;

  function handleReserve() {
    reserve.mutate(qty, { onSuccess: (reservation) => setReserved(reservation) });
  }

  const errorAlert = isApiError(error) && (
    <Alert
      variant="danger"
      live="assertive"
      title={error.status === 409 ? "Could not reserve" : "That didn't go through"}
    >
      {error.message} {error.code === "SOLD_OUT" && "The stock figure has been refreshed."}
    </Alert>
  );

  const action = blocked ? (
    <Button size="lg" className="w-full" disabled>
      {blocked}
    </Button>
  ) : user ? (
    <Button size="lg" className="w-full" onClick={handleReserve} disabled={reserve.isPending}>
      {reserve.isPending ? "Reserving…" : `Reserve · ${formatMoney(listing.price * qty)}`}
    </Button>
  ) : (
    <Button asChild size="lg" className="w-full">
      <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>Log in to reserve</Link>
    </Button>
  );

  return (
    <>
      <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <Price price={listing.price} mrp={listing.originalPrice} size="lg" savings="amount" />

        <div className="space-y-2">
          <StockBar available={listing.quantityAvailable} total={listing.quantityTotal} />
          <PickupCountdown start={listing.pickupStart} end={listing.pickupEnd} />
        </div>

        {desktop && (
          <div className="space-y-5">
            {canReserve && (
              <QuantityStepper
                value={qty}
                max={max}
                onChange={setQuantity}
                disabled={reserve.isPending}
                hint={`Max ${listing.maxPerUser} per person`}
              />
            )}
            {errorAlert}
            {action}
          </div>
        )}

        <p className="text-sm text-muted-foreground lg:text-center">
          Pay at pickup. No card needed. Free cancellation until the window opens.
        </p>
      </div>

      {/* Below lg: fixed bar, above the tab bar when there is one */}
      {!desktop && (
        <div className="fixed inset-x-0 bottom-[var(--tab-bar)] z-30 border-t bg-background">
          {errorAlert && <div className="page-container pt-3">{errorAlert}</div>}
          <div className="page-container flex h-[4.5rem] items-center gap-3">
            {canReserve && (
              <QuantityStepper
                compact
                value={qty}
                max={max}
                onChange={setQuantity}
                disabled={reserve.isPending}
              />
            )}
            <div className="min-w-0 flex-1">{action}</div>
          </div>
        </div>
      )}

      <ReservedDialog reservation={reserved} listing={listing} onClose={() => setReserved(null)} />
    </>
  );
}
