import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Label } from "./label";

type FieldProps = {
  label: ReactNode;
  /** The input element; it receives id, aria-invalid and aria-describedby. */
  children: ReactElement<Record<string, unknown>>;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

/**
 * Form field with a visible label, an optional hint and an error message,
 * all linked to the input so screen readers announce them (design doc 3.2).
 */
function Field({ label, children, error, hint, required, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field };
