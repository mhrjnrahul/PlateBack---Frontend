import {
  Croissant,
  CupSoda,
  Gift,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ListingCategory } from "@/shared/types/api";

const categoryIcons: Record<ListingCategory, LucideIcon> = {
  Bakery: Croissant,
  Meals: UtensilsCrossed,
  Groceries: ShoppingBasket,
  Beverages: CupSoda,
  Other: Gift,
};

/**
 * Listing photo, or a category illustration when there is none. Decorative:
 * the title next to it carries the meaning, so the image has empty alt text.
 */
export function ListingImage({
  category,
  imageUrl,
  className,
}: {
  category: ListingCategory;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={cn("object-cover", className)} loading="lazy" />;
  }
  const Icon = categoryIcons[category];
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center bg-primary-tint text-primary", className)}
    >
      <Icon className="size-1/3 max-h-16 max-w-16" strokeWidth={1.5} />
    </div>
  );
}
