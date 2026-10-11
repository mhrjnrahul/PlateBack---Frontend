import { cn } from "@/shared/lib/utils";
import type { ListingCategory } from "@/shared/types/api";

/*
 * Flat two-colour drawings used when a listing has no photo. Each category
 * has its own warm background tint and two inks (see --image-* tokens in
 * styles/index.css). Decorative: always hidden from screen readers.
 */

const tint: Record<ListingCategory, string> = {
  Bakery: "bg-image-bakery",
  Meals: "bg-image-meals",
  Groceries: "bg-image-groceries",
  Beverages: "bg-image-beverages",
  Other: "bg-image-other",
};

const key: Record<ListingCategory, string> = {
  Bakery: "bakery",
  Meals: "meals",
  Groceries: "groceries",
  Beverages: "beverages",
  Other: "other",
};

/** Croissant: crescent body with darker folds. */
function Croissant({ ink, accent }: { ink: string; accent: string }) {
  return (
    <g>
      <path
        d="M14 50c4-14 22-26 46-26s42 12 46 26c-6 8-14 10-20 6-6 6-14 9-26 9s-20-3-26-9c-6 4-14 2-20-6z"
        fill={ink}
      />
      <path
        d="M48 27c-3 12-3 26 2 37M72 27c3 12 3 26-2 37"
        stroke={accent}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M32 33c0 9 2 18 7 25M88 33c0 9-2 18-7 25"
        stroke={accent}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Thali: round plate with three small bowls and a mound of rice. */
function Thali({ ink, accent }: { ink: string; accent: string }) {
  return (
    <g>
      <ellipse cx="60" cy="48" rx="46" ry="28" fill={ink} />
      <ellipse cx="60" cy="46" rx="38" ry="22" fill="#fff8f1" />
      <circle cx="40" cy="40" r="9" fill={accent} />
      <circle cx="60" cy="33" r="8" fill={ink} />
      <circle cx="80" cy="40" r="9" fill={accent} />
      <ellipse cx="60" cy="55" rx="15" ry="8" fill="#fff" stroke={ink} strokeWidth="2" />
    </g>
  );
}

/** Grocery bag with greens and a carrot sticking out. */
function GroceryBag({ ink, accent }: { ink: string; accent: string }) {
  return (
    <g>
      <path
        d="M50 20c-4 6-4 14 0 20M58 16c-2 8 0 16 4 22M70 18c2 8 0 15-4 21"
        stroke={ink}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M74 14l8 26-8 2z" fill={accent} />
      <path d="M32 38h56l-6 40H38z" fill={ink} />
      <path d="M44 38v-6a16 16 0 0 1 32 0v6" stroke={ink} strokeWidth="4" fill="none" />
      <rect x="40" y="50" width="40" height="6" rx="3" fill={accent} />
    </g>
  );
}

/** Cup of tea with a handle and two lines of steam. */
function Cup({ ink, accent }: { ink: string; accent: string }) {
  return (
    <g>
      <path
        d="M48 12c-4 6 4 10 0 16M64 10c-4 6 4 10 0 16"
        stroke={accent}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M32 34h48l-5 36a8 8 0 0 1-8 7H45a8 8 0 0 1-8-7z" fill={ink} />
      <path d="M80 42h6a10 10 0 0 1 0 20h-8" stroke={ink} strokeWidth="6" fill="none" />
      <rect x="26" y="77" width="60" height="5" rx="2.5" fill={accent} />
    </g>
  );
}

/** Gift box with a ribbon and bow. */
function Gift({ ink, accent }: { ink: string; accent: string }) {
  return (
    <g>
      <rect x="30" y="38" width="60" height="40" rx="4" fill={ink} />
      <rect x="26" y="28" width="68" height="14" rx="3" fill={ink} />
      <rect x="55" y="28" width="10" height="50" fill={accent} />
      <path
        d="M60 28c-10-14-22-10-18-2 3 5 18 2 18 2zM60 28c10-14 22-10 18-2-3 5-18 2-18 2z"
        fill={accent}
      />
    </g>
  );
}

const drawing: Record<ListingCategory, typeof Croissant> = {
  Bakery: Croissant,
  Meals: Thali,
  Groceries: GroceryBag,
  Beverages: Cup,
  Other: Gift,
};

export function CategoryIllustration({
  category,
  className,
}: {
  category: ListingCategory;
  className?: string;
}) {
  const Drawing = drawing[category];
  const name = key[category];
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center", tint[category], className)}
    >
      <svg viewBox="0 0 120 90" className="h-3/5 max-h-40 w-auto" focusable="false">
        <Drawing ink={`var(--image-${name}-ink)`} accent={`var(--image-${name}-accent)`} />
      </svg>
    </div>
  );
}
