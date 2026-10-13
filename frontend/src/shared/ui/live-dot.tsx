import { cn } from "@/shared/lib/utils";

/**
 * Green dot + "Live", for data that refreshes on its own. The detail is for
 * screen readers. Dot is primary on white, 6.47:1.
 */
function LiveDot({ detail, className }: { detail?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
      Live
      {detail && (
        <>
          {" "}
          <span className="sr-only">({detail})</span>
        </>
      )}
    </span>
  );
}

export { LiveDot };
