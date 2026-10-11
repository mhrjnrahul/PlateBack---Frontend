import { useNow } from "@/shared/hooks/use-now";
import { formatCountdown, formatDuration } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

/**
 * Live countdown to the end (or start) of a pickup window. The ticking digits
 * are hidden from screen readers, which instead get a calm "2 h 14 min" text
 * that does not change every second (design doc 3.2).
 */
export function PickupCountdown({
  start,
  end,
  className,
}: {
  start: string;
  end: string;
  className?: string;
}) {
  const now = useNow(1000);
  const startMs = new Date(start).getTime() - now.getTime();
  const endMs = new Date(end).getTime() - now.getTime();

  if (endMs <= 0)
    return (
      <p className={cn("text-sm font-semibold text-muted-foreground", className)}>
        Pickup window ended
      </p>
    );

  const opens = startMs > 0;
  const label = opens ? "Pickup opens in" : "Window closes in";
  const ms = opens ? startMs : endMs;
  return (
    <p className={cn("text-sm font-semibold text-urgency", className)}>
      {label}{" "}
      <span aria-hidden="true" className="tabular-nums">
        {formatCountdown(ms)}
      </span>
      <span className="sr-only">{formatDuration(ms)}</span>
    </p>
  );
}
