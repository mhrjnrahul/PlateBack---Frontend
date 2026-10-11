import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

/**
 * Small status label. Every text/background pair meets 4.5:1:
 * success 5.59, warning 5.37, danger 4.76, neutral 14.2.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        success: "border-transparent bg-primary-tint text-primary",
        warning: "border-transparent bg-highlight-tint text-urgency",
        danger: "border-transparent bg-destructive-tint text-destructive",
        neutral: "border-border bg-surface text-foreground",
        outline: "border-border bg-background text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
