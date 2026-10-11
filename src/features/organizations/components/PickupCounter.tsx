import { useId, useRef, useState, type FormEvent } from "react";
import { isApiError } from "@/shared/api-client/api-error";
import type { OrganizationReservation } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useVerifyPickup } from "../api/organizations-api";

/**
 * Staff type the customer's code; the server checks it belongs to this
 * organization and marks it Collected (flow D). Focus stays in the field so
 * the next customer can be served straight away.
 */
export function PickupCounter({ orgId }: { orgId: string }) {
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
      aria-labelledby={`${id}-title`}
      className="rounded-xl border-2 border-primary/30 bg-card p-5"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        Pickup counter
      </h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <label htmlFor={`${id}-code`} className="text-sm font-semibold">
          Customer's pickup code
        </label>
        <div className="flex gap-2">
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
            className="font-mono text-lg tracking-wider uppercase placeholder:tracking-normal placeholder:normal-case"
          />
          <Button type="submit" disabled={verify.isPending}>
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
            {isApiError(verify.error) ? verify.error.message : "Please try again."} Nothing has
            changed.
          </Alert>
        )}
      </div>
    </section>
  );
}
