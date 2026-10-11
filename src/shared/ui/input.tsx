import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Text input. 44 px tall on mobile (touch target), 40 px from md up. Text is
 * 16 px on mobile so iOS does not zoom in on focus. Focus uses the global
 * outline; aria-invalid turns the border red.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
