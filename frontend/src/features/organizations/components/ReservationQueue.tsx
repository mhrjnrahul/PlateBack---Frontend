import { ReservationStatusBadge } from "@/features/reservations/components/ReservationCard";
import type { OrganizationReservation } from "@/shared/types/api";
import { initials } from "@/shared/lib/people";

/** Today's reservations; no-shows appear after the window closes (wireframe 5, note 5). */
export function ReservationQueue({ reservations }: { reservations: OrganizationReservation[] }) {
  return (
    <section aria-labelledby="queue" className="rounded-xl border p-5">
      <h2 id="queue" className="text-xl font-semibold">
        Reservations for today
      </h2>
      {reservations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No reservations yet today.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {reservations.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold ring-1 ring-border"
              >
                {initials(r.customerName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.customerName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {r.listingTitle} × {r.quantity}
                </p>
              </div>
              <ReservationStatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
