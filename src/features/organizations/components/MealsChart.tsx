import type { OrganizationStats } from "@/shared/types/api";

const dayLabel = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

/**
 * Simple bar chart of meals rescued per day (wireframe 5, note 6). The bars
 * are decorative; screen readers get the same numbers as a table.
 */
export function MealsChart({ days }: { days: OrganizationStats["mealsRescuedByDay"] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return (
    <figure className="rounded-xl border p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">Meals rescued · last 14 days</span>
        <span className="text-sm text-muted-foreground">{total} in total</span>
      </figcaption>
      <div aria-hidden="true" className="mt-4 flex h-36 items-end gap-1.5">
        {days.map((d, i) => (
          <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
            <div
              title={`${dayLabel.format(new Date(d.date))}: ${d.count}`}
              className={
                i === days.length - 1 ? "rounded-t bg-highlight" : "rounded-t bg-primary/80"
              }
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{dayLabel.format(new Date(days[0]!.date))}</span>
        <span>Today</span>
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
          {days.map((d) => (
            <tr key={d.date}>
              <td>{dayLabel.format(new Date(d.date))}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
