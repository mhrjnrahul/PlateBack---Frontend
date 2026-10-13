import { cn } from "@/shared/lib/utils";

/** PlateBack mark and wordmark. The visible text is the accessible name. */
function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="16" cy="16" r="5" fill="currentColor" />
      </svg>
      PlateBack
    </span>
  );
}

export { Logo };
