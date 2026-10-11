import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

const alertVariants = cva(
  "flex gap-3 rounded-lg border p-4 text-sm [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-border bg-surface text-foreground",
        success: "border-primary/30 bg-primary-tint text-foreground [&_svg]:text-primary",
        warning: "border-highlight/40 bg-highlight-tint text-foreground [&_svg]:text-urgency",
        danger:
          "border-destructive/30 bg-destructive-tint text-foreground [&_svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

type AlertProps = VariantProps<typeof alertVariants> & {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Announce to screen readers: "assertive" for errors, "polite" for results. */
  live?: "assertive" | "polite" | "off";
};

/** A message box. Errors are not shown by colour alone: each variant has an icon and text. */
function Alert({ variant = "info", title, children, className, live = "off" }: AlertProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div
      role={live === "assertive" ? "alert" : live === "polite" ? "status" : undefined}
      className={cn(alertVariants({ variant }), className)}
    >
      <Icon aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-foreground/90">{children}</div>}
      </div>
    </div>
  );
}

export { Alert };
