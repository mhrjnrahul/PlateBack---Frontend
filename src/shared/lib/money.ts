/*
 * Money display. Amounts are whole rupees in the API (field names price and
 * originalPrice stay as they are); the symbol comes from VITE_CURRENCY_SYMBOL.
 */

const SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs";

// en-IN groups like the rest of South Asia: 1,250 and 1,25,000.
const wholeNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const withPaisa = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 450 -> "Rs 450", 1250 -> "Rs 1,250", 0 -> "Free". */
export function formatMoney(amount: number) {
  if (amount === 0) return "Free";
  return formatAmount(amount);
}

/** Like formatMoney but never says "Free" (for MRP and savings): 0 -> "Rs 0". */
export function formatAmount(amount: number) {
  const number = Number.isInteger(amount) ? wholeNumber.format(amount) : withPaisa.format(amount);
  return `${SYMBOL} ${number}`;
}

/** Percentage saved against the MRP, rounded down: (400, 150) -> 62. */
export function discountPercent(mrp: number, price: number) {
  return mrp > 0 && price < mrp ? Math.floor(((mrp - price) / mrp) * 100) : 0;
}
