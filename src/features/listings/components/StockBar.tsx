import { cn } from "@/shared/lib/utils";

/**
 * Remaining stock as text plus a bar. The text carries the information; the
 * bar is decorative (orange when 3 or fewer are left).
 */
export function StockBar({
  available,
  total,
  className,
  showLabel = true,
}: {
  available: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}) {
  const percent = total > 0 ? Math.round((available / total) * 100) : 0;
  const low = available > 0 && available <= 3;
  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <p className={cn("text-sm font-semibold", low && "text-urgency")}>
          {available === 0 ? "Sold out" : `${available} of ${total} left`}
        </p>
      )}
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-surface ring-1 ring-border ring-inset"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            low ? "bg-highlight" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
