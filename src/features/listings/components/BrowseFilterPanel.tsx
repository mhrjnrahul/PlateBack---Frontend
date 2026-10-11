import { useId } from "react";
import { AREAS } from "@/shared/lib/areas";
import { cn } from "@/shared/lib/utils";
import { Select } from "@/shared/ui/select";
import {
  CATEGORIES,
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  TIME_OPTIONS,
  type BrowseFilters,
} from "../browse-filters";

/** A set of radio buttons styled as chips (keyboard: arrow keys move between them). */
function ChipGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                value === option.value
                  ? "border-primary bg-selected text-primary"
                  : "border-input bg-background hover:bg-accent",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** All browse filters. Used in the sidebar (desktop) and the bottom sheet (mobile). */
export function BrowseFilterPanel({
  filters,
  onChange,
}: {
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
}) {
  const id = useId();
  const usingMyLocation = filters.lat !== null && filters.lng !== null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-area`} className="text-sm font-semibold">
            Location
          </label>
          <Select
            id={`${id}-area`}
            value={usingMyLocation ? "me" : filters.area}
            onChange={(e) =>
              e.target.value !== "me" && onChange({ area: e.target.value, lat: null, lng: null })
            }
          >
            {usingMyLocation && <option value="me">My location</option>}
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-radius`} className="text-sm font-semibold">
            Distance
          </label>
          <Select
            id={`${id}-radius`}
            value={filters.radiusKm}
            onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Within {r} km
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ChipGroup
        legend="Category"
        name={`${id}-category`}
        value={filters.category}
        options={[{ value: "", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        onChange={(category) => onChange({ category })}
      />

      <ChipGroup
        legend="Pickup time"
        name={`${id}-time`}
        value={filters.time}
        options={TIME_OPTIONS}
        onChange={(time) => onChange({ time })}
      />

      <div className="space-y-1.5">
        <label htmlFor={`${id}-price`} className="text-sm font-semibold">
          Max price
        </label>
        <Select
          id={`${id}-price`}
          value={filters.maxPrice}
          onChange={(e) => onChange({ maxPrice: e.target.value })}
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
