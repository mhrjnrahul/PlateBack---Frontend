import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Styled native <select>: the browser's own picker, which is accessible and
 * works well on phones. Same height and states as Input (44 px on mobile,
 * 40 px from md); aria-invalid turns the border red. Focus uses the global
 * outline. Pass `icon` for a leading icon (decorative).
 */
function Select({
  className,
  icon: Icon,
  children,
  ...props
}: ComponentProps<"select"> & { icon?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-md border border-input bg-background pr-9 pl-3 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:text-sm",
          Icon && "pl-9",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { Select };
