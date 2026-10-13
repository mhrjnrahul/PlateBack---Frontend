import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/** − [n] + control. The buttons are labelled; the value is announced when it changes. */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  hint,
  compact = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
  /** Label kept for screen readers only, no hint (mobile reserve bar). */
  compact?: boolean;
}) {
  const id = useId();
  return (
    <div className={compact ? undefined : "space-y-1.5"}>
      <span id={`${id}-label`} className={compact ? "sr-only" : "text-sm font-semibold"}>
        Quantity
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() => onChange(value - 1)}
            disabled={disabled || value <= 1}
          >
            <Minus aria-hidden="true" />
          </Button>
          <output
            aria-labelledby={`${id}-label`}
            aria-live="polite"
            aria-describedby={hint && !compact ? `${id}-hint` : undefined}
            className={cn(
              "flex h-11 items-center justify-center rounded-md border border-input text-lg font-semibold tabular-nums md:h-10",
              compact ? "w-10" : "w-14",
            )}
          >
            {value}
          </output>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase quantity"
            onClick={() => onChange(value + 1)}
            disabled={disabled || value >= max}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        {hint && !compact && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
