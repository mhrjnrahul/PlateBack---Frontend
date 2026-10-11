import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/shared/ui/button";

/** − [n] + control. The buttons are labelled; the value is announced when it changes. */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  hint,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <span id={`${id}-label`} className="text-sm font-semibold">
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
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="flex h-11 w-14 items-center justify-center rounded-md border border-input text-lg font-semibold tabular-nums md:h-10"
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
        {hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
