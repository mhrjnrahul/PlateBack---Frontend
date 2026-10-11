import { describe, expect, it } from "vitest";
import { listingFormSchema } from "./listing-form";

const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
const valid = {
  title: "Mixed pastry box",
  category: "Bakery",
  quantityTotal: 10,
  originalPrice: 12,
  price: 4.5,
  description: "",
  date,
  from: "18:00",
  until: "20:00",
  address: "Thamel Rd 12",
  allergenNotes: "Contains gluten.",
};

function errorsFor(values: object) {
  const result = listingFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
}

describe("listing form schema", () => {
  it("accepts a valid listing", () => {
    expect(errorsFor(valid)).toEqual({});
  });

  it("applies the business rules", () => {
    expect(errorsFor({ ...valid, title: "ab" })).toHaveProperty("title");
    expect(errorsFor({ ...valid, price: 20 })).toMatchObject({
      price: "Price cannot be more than the original price.",
    });
    expect(errorsFor({ ...valid, quantityTotal: 0 })).toHaveProperty("quantityTotal");
    expect(errorsFor({ ...valid, quantityTotal: Number.NaN })).toHaveProperty("quantityTotal");
    expect(errorsFor({ ...valid, allergenNotes: "" })).toHaveProperty("allergenNotes");
  });

  it("checks the pickup window length", () => {
    expect(errorsFor({ ...valid, until: "18:10" })).toMatchObject({
      until: "Pickup must last between 15 minutes and 12 hours.",
    });
    expect(errorsFor({ ...valid, date: "2020-01-01" })).toMatchObject({
      until: "The pickup window must end in the future.",
    });
  });
});
