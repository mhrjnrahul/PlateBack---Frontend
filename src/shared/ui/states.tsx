import { Inbox, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { isApiError } from "@/shared/api-client/api-error";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

/** Shown when a list has no items. */
function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <Inbox aria-hidden="true" className="size-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      {children && <div className="mt-1 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Message for a failed query, with a retry button. */
function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  const message = isApiError(error) ? error.message : "Please try again.";
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive-tint px-6 py-8 text-center",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-foreground/90">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

export { EmptyState, ErrorState };
