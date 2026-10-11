import { useId, useState } from "react";
import { isApiError } from "@/shared/api-client/api-error";
import { formatDateTime } from "@/shared/lib/format";
import type { OrganizationReviewItem } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "@/shared/ui/toaster";
import { useReviewDecision, type ReviewDecision } from "../api/admin-api";

const statusVariant = {
  Pending: "warning",
  Verified: "success",
  Rejected: "danger",
  Suspended: "danger",
} as const;

/**
 * Review one business (wireframe 7, note 3). Rejecting or suspending needs a
 * reason; it is sent to the owner and kept in the audit log.
 */
export function ReviewPanel({ org, onDone }: { org: OrganizationReviewItem; onDone: () => void }) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const decide = useReviewDecision();

  function submit(decision: ReviewDecision) {
    if (decision !== "verify" && !reason.trim()) {
      setReasonError(`A reason is required to ${decision}. It is sent to the owner.`);
      document.getElementById(`${id}-reason`)?.focus();
      return;
    }
    setReasonError(null);
    decide.mutate(
      { id: org.id, decision, reason: decision === "verify" ? undefined : reason.trim() },
      {
        onSuccess: () => {
          const verb = { verify: "verified", reject: "rejected", suspend: "suspended" }[decision];
          toast.success(`${org.name} ${verb}. The owner has been notified.`);
          setReason("");
          onDone();
        },
      },
    );
  }

  const details = [
    ["Owner", `${org.ownerName} (${org.ownerEmail})`],
    ["Address", org.address],
    ["Type", org.type],
    ["Phone", org.phone ?? "Not given"],
    ["Submitted", formatDateTime(org.createdAt)],
    ...(org.verifiedAt ? [["Verified", formatDateTime(org.verifiedAt)]] : []),
    ...(org.rejectionReason ? [["Reason", org.rejectionReason]] : []),
  ];

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="space-y-5 rounded-xl border-2 border-primary/30 bg-card p-5"
    >
      <div className="space-y-2">
        <h2 id={`${id}-title`} className="text-xl font-semibold">
          Review: {org.name}
        </h2>
        <Badge variant={statusVariant[org.status]}>{org.status}</Badge>
      </div>
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
        {details.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {isApiError(decide.error) && (
        <Alert variant="danger" live="assertive">
          {decide.error.message}
        </Alert>
      )}

      {org.status !== "Rejected" && (
        <div className="space-y-1.5">
          <label htmlFor={`${id}-reason`} className="text-sm font-semibold">
            Reason {org.status === "Verified" ? "(required to suspend)" : "(required to reject)"}
          </label>
          <Textarea
            id={`${id}-reason`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={reasonError ? `${id}-reason-error` : undefined}
          />
          {reasonError && (
            <p id={`${id}-reason-error`} className="text-sm font-medium text-destructive">
              {reasonError}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {org.status !== "Verified" && (
          <Button onClick={() => submit("verify")} disabled={decide.isPending}>
            {org.status === "Pending" ? "Verify" : "Verify again"}
          </Button>
        )}
        {org.status === "Pending" && (
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive-tint"
            onClick={() => submit("reject")}
            disabled={decide.isPending}
          >
            Reject
          </Button>
        )}
        {org.status === "Verified" && (
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive-tint"
            onClick={() => submit("suspend")}
            disabled={decide.isPending}
          >
            Suspend
          </Button>
        )}
      </div>
    </section>
  );
}
