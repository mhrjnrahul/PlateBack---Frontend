import { discountPercent, formatAmount, formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

const sizes = {
  sm: { price: "text-base", meta: "text-sm" },
  md: { price: "text-lg", meta: "text-sm" },
  lg: { price: "text-3xl", meta: "text-sm" },
};

type PriceProps = {
  /** Selling price (the API's `price`); 0 is shown as "Free". */
  price: number;
  /** MRP (the API's `originalPrice`); struck through when higher than the price. */
  mrp: number;
  size?: keyof typeof sizes;
  /** "percent": "63% off" (cards). "amount": "You save Rs 250 (63% off)" (detail). */
  savings?: "percent" | "amount" | "none";
  className?: string;
};

/**
 * The selling price, large and green, with the MRP struck through after it.
 * Savings are computed from the two prices, never hard-coded.
 * Colours: primary 6.47:1, muted 4.83:1, urgency 6.25:1 (all on white).
 */
export function Price({ price, mrp, size = "md", savings = "none", className }: PriceProps) {
  const s = sizes[size];
  const percent = discountPercent(mrp, price);
  const showMrp = mrp > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-bold text-primary tabular-nums", s.price)}>
        {formatMoney(price)}
      </span>
      {showMrp && (
        <span className={cn("text-muted-foreground tabular-nums", s.meta)}>
          MRP <span className="line-through">{formatAmount(mrp)}</span>
        </span>
      )}
      {showMrp && price > 0 && savings === "percent" && (
        <span className={cn("font-semibold text-urgency", s.meta)}>{percent}% off</span>
      )}
      {showMrp && savings === "amount" && (
        <span className={cn("basis-full font-semibold text-urgency", s.meta)}>
          You save {formatAmount(mrp - price)} ({percent}% off)
        </span>
      )}
    </div>
  );
}
