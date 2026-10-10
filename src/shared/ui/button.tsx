import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";
import { Slot } from "radix-ui";

/**
 * Button styles (design document 3.2).
 * Focus uses the global :focus-visible outline from styles/index.css.
 * Default and icon sizes are 44 px on mobile (touch target) and 40 px from md up.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-90",
        outline: "border border-primary bg-background text-primary hover:bg-primary-tint",
        secondary: "bg-primary-tint text-primary hover:bg-primary-tint/70",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4 md:h-10",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        icon: "size-11 md:size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
