import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Page title (the page's only h1, in the display face), an optional badge
 * beside it (kept out of the heading text), an optional one-line description
 * and optional actions on the right.
 */
function PageHeader({
  title,
  badge,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {badge}
        </div>
        {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
