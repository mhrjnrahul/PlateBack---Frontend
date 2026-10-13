import { ImagePlus } from "lucide-react";
import { useId } from "react";
import { IMAGE_TYPES } from "@/shared/lib/images";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";

/**
 * Optional listing photo: pick, preview, replace or remove. The file input is
 * visually hidden inside its label, so the label is what people see and click.
 */
export function PhotoField({
  previewUrl,
  preparing,
  error,
  onSelect,
  onRemove,
}: {
  previewUrl: string | null;
  preparing: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const input = (
    <input
      id={id}
      type="file"
      accept={IMAGE_TYPES.join(",")}
      className="sr-only"
      aria-describedby={error ? `${id}-error` : `${id}-hint`}
      aria-invalid={error ? true : undefined}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // so choosing the same file again still fires
        if (file) onSelect(file);
      }}
    />
  );

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Chosen for this listing"
            className="aspect-[4/3] w-full max-w-sm rounded-lg border object-cover"
          />
          <div className="flex flex-wrap gap-2">
            <label
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
              )}
            >
              {input}
              Replace photo
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              Remove photo
            </Button>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex aspect-[4/3] w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-primary",
            "has-[:focus-visible]:border-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
            error && "border-destructive",
          )}
        >
          {input}
          <ImagePlus aria-hidden="true" className="size-8 text-muted-foreground" />
          <span className="font-semibold text-primary">
            {preparing ? "Preparing photo…" : "Add a photo"}
          </span>
        </label>
      )}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          JPEG, PNG or WebP, up to 10 MB. Without a photo, customers see a drawing for the category.
        </p>
      )}
    </div>
  );
}
