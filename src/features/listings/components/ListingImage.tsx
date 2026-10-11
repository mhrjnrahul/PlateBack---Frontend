import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ListingCategory } from "@/shared/types/api";
import { CategoryIllustration } from "./CategoryIllustration";

/**
 * Listing photo with an illustrated fallback. The category illustration is
 * always drawn first; the photo fades in on top only once it has loaded, and
 * is dropped if it fails (missing file, bad URL). So there is never a broken
 * image icon or an empty box.
 *
 * Photos next to a title are decorative (empty alt). Pass `alt` only when the
 * image adds information the text does not.
 */
export function ListingImage({
  category,
  imageUrl,
  alt = "",
  className,
}: {
  category: ListingCategory;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
}) {
  // Keyed by URL, so a new URL gets a fresh attempt without an effect.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <CategoryIllustration category={category} className="absolute inset-0" />
      {showImage && (
        <img
          src={imageUrl!}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedUrl(imageUrl!)}
          onError={() => setFailedUrl(imageUrl!)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity",
            loadedUrl === imageUrl ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
