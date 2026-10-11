import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "./input";

const SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs";

/**
 * Whole-rupee amount input with a visual "Rs" prefix. The prefix is
 * decorative: the field's label names the amount for screen readers.
 */
export function MoneyInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
      >
        {SYMBOL}
      </span>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        step={5}
        className={cn("pl-10 tabular-nums", className)}
        {...props}
      />
    </div>
  );
}
