import { DEFAULT_AREA, findArea } from "@/shared/lib/areas";
import type { ListingCategory, ListingSearchParams, ListingSort } from "@/shared/types/api";

export const CATEGORIES: ListingCategory[] = ["Bakery", "Meals", "Groceries", "Beverages", "Other"];
export const RADIUS_OPTIONS = [1, 2, 5, 10, 25];
export const PRICE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "0", label: "Free only" },
  { value: "100", label: "Up to Rs 100" },
  { value: "200", label: "Up to Rs 200" },
  { value: "300", label: "Up to Rs 300" },
];
export const TIME_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "now", label: "Open now" },
  { value: "tonight", label: "Tonight" },
  { value: "tomorrow", label: "Tomorrow" },
] as const;
export const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "distance", label: "Nearest first" },
  { value: "pickup", label: "Ending soonest" },
  { value: "price", label: "Lowest price" },
];

export type PickupTime = "" | "now" | "tonight" | "tomorrow";

/** Browse filters as stored in the URL (design doc 3.3, note 2). */
export type BrowseFilters = {
  area: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  category: ListingCategory | "";
  maxPrice: string;
  time: PickupTime;
  q: string;
  sort: ListingSort;
  page: number;
};

export function readFilters(params: URLSearchParams): BrowseFilters {
  const num = (key: string) =>
    params.has(key) && !Number.isNaN(Number(params.get(key))) ? Number(params.get(key)) : null;
  const category = params.get("category") as ListingCategory | null;
  const time = params.get("time") as PickupTime | null;
  const sort = params.get("sort") as ListingSort | null;
  return {
    area: findArea(params.get("area"))?.id ?? DEFAULT_AREA.id,
    lat: num("lat"),
    lng: num("lng"),
    radiusKm: RADIUS_OPTIONS.includes(num("radius") ?? 0) ? num("radius")! : 5,
    category: category && CATEGORIES.includes(category) ? category : "",
    maxPrice: PRICE_OPTIONS.some((o) => o.value === params.get("maxPrice"))
      ? params.get("maxPrice")!
      : "",
    time: time && ["now", "tonight", "tomorrow"].includes(time) ? time : "",
    q: params.get("q") ?? "",
    sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : "distance",
    page: Math.max(1, num("page") ?? 1),
  };
}

/** Writes only non-default values, so URLs stay short. */
export function writeFilters(f: BrowseFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.lat !== null && f.lng !== null) {
    p.set("lat", String(f.lat));
    p.set("lng", String(f.lng));
  } else if (f.area !== DEFAULT_AREA.id) p.set("area", f.area);
  if (f.radiusKm !== 5) p.set("radius", String(f.radiusKm));
  if (f.category) p.set("category", f.category);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.time) p.set("time", f.time);
  if (f.q) p.set("q", f.q);
  if (f.sort !== "distance") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  return p;
}

export type ActiveFilter = { key: string; label: string; clear: Partial<BrowseFilters> };

/** Filters that differ from the defaults, as removable chips (location and sort excluded). */
export function activeFilters(f: BrowseFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  if (f.q) chips.push({ key: "q", label: `"${f.q}"`, clear: { q: "" } });
  if (f.category) chips.push({ key: "category", label: f.category, clear: { category: "" } });
  if (f.time) {
    const label = TIME_OPTIONS.find((o) => o.value === f.time)!.label;
    chips.push({ key: "time", label, clear: { time: "" } });
  }
  if (f.maxPrice) {
    const label = PRICE_OPTIONS.find((o) => o.value === f.maxPrice)!.label;
    chips.push({ key: "maxPrice", label, clear: { maxPrice: "" } });
  }
  if (f.radiusKm !== 5) {
    chips.push({ key: "radius", label: `Within ${f.radiusKm} km`, clear: { radiusKm: 5 } });
  }
  return chips;
}

export function locationLabel(f: BrowseFilters) {
  return f.lat !== null && f.lng !== null
    ? "your location"
    : (findArea(f.area) ?? DEFAULT_AREA).label;
}

/**
 * API parameters for the filters. `now` is passed in (rounded to the minute
 * by the caller) so the query key stays stable between renders.
 */
export function toSearchParams(f: BrowseFilters, now: Date, pageSize = 12): ListingSearchParams {
  const area = findArea(f.area) ?? DEFAULT_AREA;
  const startOfDay = (offsetDays: number) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
  };
  const window =
    f.time === "now"
      ? { pickupFrom: now.toISOString(), pickupTo: new Date(now.getTime() + 60_000).toISOString() }
      : f.time === "tonight"
        ? { pickupFrom: now.toISOString(), pickupTo: startOfDay(1) }
        : f.time === "tomorrow"
          ? { pickupFrom: startOfDay(1), pickupTo: startOfDay(2) }
          : {};
  return {
    lat: f.lat ?? area.lat,
    lng: f.lng ?? area.lng,
    radiusKm: f.radiusKm,
    category: f.category || undefined,
    maxPrice: f.maxPrice === "" ? undefined : Number(f.maxPrice),
    q: f.q.trim() || undefined,
    sort: f.sort,
    page: f.page,
    pageSize,
    ...window,
  };
}
