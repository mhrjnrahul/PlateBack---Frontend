import { useId, useRef, useState, type FormEvent } from "react";
import { isApiError } from "@/shared/api-client/api-error";
import type { OrganizationReservation } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { useVerifyPickup } from "../api/organizations-api";

/**
 * Staff type the customer's code; the server checks it belongs to this
 * organization and marks it Collected (flow D). Focus stays in the field so
 * the next customer can be served straight away.
 *
 * "panel" sits on the dashboard; "page" is the standalone pickup page, where
 * the page title already says what this is, so there is no second heading
 * and the field is larger.
 */
export function PickupCounter({
  orgId,
  variant = "panel",
}: {
  orgId: string;
  variant?: "panel" | "page";
}) {
  const page = variant === "page";
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [collected, setCollected] = useState<OrganizationReservation | null>(null);
  const verify = useVerifyPickup(orgId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      inputRef.current?.focus();
      return;
    }
    setCollected(null);
    verify.mutate(code, {
      onSuccess: (reservation) => {
        setCollected(reservation);
        setCode("");
      },
      onSettled: () => inputRef.current?.focus(),
    });
  }

  return (
    <section
      aria-labelledby={page ? `${id}-code` : `${id}-title`}
      className={cn(!page && "rounded-xl border bg-card p-5")}
    >
      {!page && (
        <h2 id={`${id}-title`} className="mb-3 text-xl font-semibold">
          Pickup counter
        </h2>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor={`${id}-code`} className="block text-sm font-semibold">
          Customer's pickup code
        </label>
        <div className={cn("flex gap-2", page && "flex-col sm:flex-row")}>
          <Input
            ref={inputRef}
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7M2-9QXA"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            className={cn(
              "font-mono text-lg tracking-wider uppercase placeholder:tracking-normal placeholder:normal-case",
              page && "h-14 text-2xl md:h-14 md:text-2xl",
            )}
          />
          <Button type="submit" size={page ? "lg" : "default"} disabled={verify.isPending}>
            {verify.isPending ? "Checking…" : "Verify"}
          </Button>
        </div>
      </form>
      <div className="mt-3">
        {collected && (
          <Alert variant="success" live="polite" title="Collected: hand over the food">
            {collected.customerName} · {collected.listingTitle} × {collected.quantity}
          </Alert>
        )}
        {verify.isError && (
          <Alert variant="danger" live="assertive" title="Code not accepted">
            {isApiError(verify.error)
              ? verify.error.message
              : "Check your connection and try again."}{" "}
            Nothing has changed.
          </Alert>
        )}
      </div>
    </section>
  );
}
