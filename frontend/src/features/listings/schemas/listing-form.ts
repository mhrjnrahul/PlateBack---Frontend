import { z } from "zod";
import type { ListingInput } from "@/shared/types/api";

export const LISTING_CATEGORIES = ["Bakery", "Meals", "Groceries", "Beverages", "Other"] as const;

/**
 * Create-listing form. Mirrors the server rules (design doc 5.4 and 5.6) so
 * most mistakes are caught before submitting; the server stays the authority.
 */
export const listingFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be 3-80 characters.")
      .max(80, "Title must be 3-80 characters."),
    category: z.enum(LISTING_CATEGORIES, { error: "Choose a category." }),
    quantityTotal: z
      .number({ error: "Enter how many portions you have." })
      .int("Use a whole number.")
      .min(1, "At least 1 portion.")
      .max(200, "At most 200 portions."),
    // Whole rupees (MRP and selling price); field names match the API.
    originalPrice: z
      .number({ error: "Enter the MRP." })
      .int("Use whole rupees.")
      .min(0, "Cannot be negative."),
    price: z
      .number({ error: "Enter the selling price (0 to give it away free)." })
      .int("Use whole rupees.")
      .min(0, "Cannot be negative."),
    description: z.string().trim().max(500, "Keep the description under 500 characters."),
    date: z.string().min(1, "Choose the pickup date."),
    from: z.string().min(1, "Choose when pickup starts."),
    until: z.string().min(1, "Choose when pickup ends."),
    address: z.string().trim().min(1, "Enter the pickup address."),
    allergenNotes: z
      .string()
      .trim()
      .min(3, 'Allergen information is required. Write "None known" if there are none.'),
  })
  .superRefine((v, ctx) => {
    if (v.price > v.originalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Selling price must be equal to or lower than MRP.",
      });
    }
    const { start, end } = pickupWindow(v);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    const minutes = (end.getTime() - start.getTime()) / 60_000;
    if (end <= new Date()) {
      ctx.addIssue({
        code: "custom",
        path: ["until"],
        message: "The pickup window must end in the future.",
      });
    } else if (minutes < 15 || minutes > 12 * 60) {
      ctx.addIssue({
        code: "custom",
        path: ["until"],
        message: "Pickup must last between 15 minutes and 12 hours.",
      });
    }
  });

export type ListingFormValues = z.infer<typeof listingFormSchema>;

/** Date and times are entered in local time and sent as UTC (design doc 1.7). */
export function pickupWindow(v: Pick<ListingFormValues, "date" | "from" | "until">) {
  return { start: new Date(`${v.date}T${v.from}`), end: new Date(`${v.date}T${v.until}`) };
}

export function toListingInput(
  v: ListingFormValues,
  location: { latitude: number; longitude: number },
): ListingInput {
  const { start, end } = pickupWindow(v);
  return {
    title: v.title,
    category: v.category,
    description: v.description,
    quantityTotal: v.quantityTotal,
    originalPrice: v.originalPrice,
    price: v.price,
    pickupStart: start.toISOString(),
    pickupEnd: end.toISOString(),
    address: v.address,
    latitude: location.latitude,
    longitude: location.longitude,
    allergenNotes: v.allergenNotes,
  };
}

/** Server field names -> form field names, for mapping 400 validation errors. */
export const serverFieldToFormField: Record<string, keyof ListingFormValues> = {
  title: "title",
  category: "category",
  quantityTotal: "quantityTotal",
  originalPrice: "originalPrice",
  price: "price",
  pickupStart: "from",
  pickupEnd: "until",
  address: "address",
  allergenNotes: "allergenNotes",
};

/** Sensible defaults: today, starting at the next half hour, for two hours. */
export function defaultListingValues(
  address: string,
  now = new Date(),
): Partial<ListingFormValues> {
  const start = new Date(now);
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    title: "",
    description: "",
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    from: time(start),
    // Keep the window on the same day for the single date field
    until: end.getDate() === start.getDate() ? time(end) : "23:59",
    address,
    allergenNotes: "",
  };
}
