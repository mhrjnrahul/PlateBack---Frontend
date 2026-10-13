import { describe, expect, it } from "vitest";
import { discountPercent, formatAmount, formatMoney } from "./money";

describe("money", () => {
  it("formats rupees with Indian grouping and no decimals for whole numbers", () => {
    expect(formatMoney(450)).toBe("Rs 450");
    expect(formatMoney(1250)).toBe("Rs 1,250");
    expect(formatMoney(125000)).toBe("Rs 1,25,000");
    expect(formatMoney(99.5)).toBe("Rs 99.50");
  });

  it("calls zero Free, except where an amount is required", () => {
    expect(formatMoney(0)).toBe("Free");
    expect(formatAmount(0)).toBe("Rs 0");
  });

  it("floors the discount and never goes negative", () => {
    expect(discountPercent(400, 150)).toBe(62);
    expect(discountPercent(800, 240)).toBe(70);
    expect(discountPercent(300, 0)).toBe(100);
    expect(discountPercent(200, 250)).toBe(0);
    expect(discountPercent(0, 0)).toBe(0);
  });
});
