import { Link } from "react-router";
import { StockBar } from "@/features/listings/components/StockBar";
import { isApiError } from "@/shared/api-client/api-error";
import { formatPickupWindow } from "@/shared/lib/format";
import type { ListingStatus, ListingSummary } from "@/shared/types/api";
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
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/states";
import { toast } from "@/shared/ui/toaster";
import { useCancelListing } from "../api/organizations-api";

const statusBadge: Record<
  ListingStatus,
  { label: string; variant: "success" | "neutral" | "danger" | "warning" }
> = {
  Active: { label: "Active", variant: "success" },
  SoldOut: { label: "Sold out", variant: "warning" },
  Expired: { label: "Ended", variant: "neutral" },
  Cancelled: { label: "Cancelled", variant: "danger" },
};

function CancelListingButton({ orgId, listing }: { orgId: string; listing: ListingSummary }) {
  const cancel = useCancelListing(orgId);
  const reserved = listing.quantityTotal - listing.quantityAvailable;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          aria-label={`Cancel ${listing.title}`}
        >
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel “{listing.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The listing disappears from search.{" "}
            {reserved > 0
              ? `${reserved} reserved ${reserved === 1 ? "portion is" : "portions are"} cancelled too, and those customers are notified.`
              : "Nobody has reserved it yet."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep listing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              cancel.mutate(listing.id, {
                onSuccess: () => toast("Listing cancelled."),
                onError: (e) =>
                  toast.error(isApiError(e) ? e.message : "Could not cancel the listing."),
              })
            }
          >
            Cancel listing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Today's listings with live stock (wireframe 5, note 3). */
export function OrgListingsTable({
  orgId,
  listings,
  canPublish,
}: {
  orgId: string;
  listings: ListingSummary[];
  canPublish: boolean;
}) {
  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        action={
          canPublish ? (
            <Button asChild>
              <Link to={`/org/${orgId}/listings/new`}>Create your first listing</Link>
            </Button>
          ) : undefined
        }
      >
        Post tonight's surplus and it appears in search straight away.
      </EmptyState>
    );
  }
  return (
    <div className="relative overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">Your listings</caption>
        <thead className="border-b bg-surface text-left text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Listing
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Stock
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Pickup
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {listings.map((listing) => {
            const badge = statusBadge[listing.status];
            const cancellable = listing.status === "Active" || listing.status === "SoldOut";
            return (
              <tr key={listing.id}>
                <th scope="row" className="px-4 py-3 text-left font-semibold">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {listing.title}
                  </Link>
                </th>
                <td className="w-40 px-4 py-3">
                  <StockBar
                    available={listing.quantityAvailable}
                    total={listing.quantityTotal}
                    showLabel={false}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
                    {listing.quantityAvailable} of {listing.quantityTotal} left
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatPickupWindow(listing.pickupStart, listing.pickupEnd)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {cancellable && <CancelListingButton orgId={orgId} listing={listing} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
