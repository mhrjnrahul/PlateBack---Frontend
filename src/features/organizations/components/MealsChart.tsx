import { useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/utils";
import type { OrganizationStats } from "@/shared/types/api";

const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** A round top for the y axis and its halfway tick. */
function axisTop(max: number) {
  return max <= 4 ? 4 : Math.ceil(max / 4) * 4;
}

/**
 * Meals rescued per day (wireframe 5, note 6). Hover a bar, or focus the
 * chart and use the arrow keys, to read a day's value in the line above it.
 * For assistive tech the plot is a slider over the days, whose value text is
 * the day's count; the same numbers are also in a table.
 */
export function MealsChart({ days }: { days: OrganizationStats["mealsRescuedByDay"] }) {
  const last = days.length - 1;
  const [active, setActive] = useState(last);
  const top = axisTop(Math.max(0, ...days.map((d) => d.count)));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const label = (i: number) => (i === last ? "Today" : dayLabel.format(new Date(days[i]!.date)));
  const current = days[active]!;
  const valueText = `${label(active)}: ${current.count} ${current.count === 1 ? "meal" : "meals"}`;

  function handleKey(event: KeyboardEvent) {
    const next =
      event.key === "ArrowLeft"
        ? active - 1
        : event.key === "ArrowRight"
          ? active + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(Math.min(last, Math.max(0, next)));
  }

  return (
    <figure className="rounded-xl border p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">Meals rescued · last 14 days</span>
        <span className="text-sm text-muted-foreground">{total} in total</span>
      </figcaption>

      <p aria-hidden="true" className="mt-3 text-sm font-semibold tabular-nums">
        {valueText}
      </p>

      <div className="mt-2 flex gap-2">
        {/* y axis */}
        <div
          aria-hidden="true"
          className="flex h-36 flex-col justify-between text-right text-sm text-muted-foreground tabular-nums"
        >
          <span className="-translate-y-1/2">{top}</span>
          <span>{top / 2}</span>
          <span className="translate-y-1/2">0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="slider"
            aria-label="Day"
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={active}
            aria-valuetext={valueText}
            tabIndex={0}
            onKeyDown={handleKey}
            className="relative flex h-36 items-end gap-1 border-b border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {/* gridlines at the halfway and top ticks */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed"
            />
            {days.map((d, i) => (
              <div
                key={d.date}
                aria-hidden="true"
                onMouseEnter={() => setActive(i)}
                className="relative flex h-full flex-1 flex-col justify-end"
              >
                <div
                  className={cn(
                    "rounded-t-md transition-colors",
                    i === active ? "bg-highlight" : "bg-primary/80",
                  )}
                  style={{ height: `${Math.max(2, (d.count / top) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          {/* x labels every third day, counted back from today */}
          <div aria-hidden="true" className="mt-1 flex gap-1 text-sm text-muted-foreground">
            {days.map((d, i) => (
              <span key={d.date} className="relative flex-1">
                {(last - i) % 3 === 0 && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {label(i)}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="h-5" />
        </div>
      </div>

      <table className="sr-only">
        <caption>Meals rescued per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Meals</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d.date}>
              <td>{label(i)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
