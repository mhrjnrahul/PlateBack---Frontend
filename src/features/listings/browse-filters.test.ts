import { describe, expect, it } from "vitest";
import { readFilters, toSearchParams, writeFilters } from "./browse-filters";

describe("browse filters", () => {
  it("reads defaults from an empty URL and ignores invalid values", () => {
    const f = readFilters(new URLSearchParams("category=Pizza&radius=7&sort=random&page=-2"));
    expect(f).toMatchObject({
      area: "thamel",
      radiusKm: 5,
      category: "",
      sort: "distance",
      page: 1,
    });
  });

  it("round-trips through the URL, writing only non-defaults", () => {
    const f = readFilters(
      new URLSearchParams("area=patan&category=Bakery&maxPrice=0&time=tonight&q=bread"),
    );
    expect(writeFilters(f).toString()).toBe(
      "area=patan&category=Bakery&maxPrice=0&time=tonight&q=bread",
    );
    expect(writeFilters(readFilters(new URLSearchParams())).toString()).toBe("");
  });

  it("turns filters into API parameters", () => {
    const now = new Date(2026, 9, 10, 15, 0);
    const params = toSearchParams(
      readFilters(new URLSearchParams("area=bhaktapur&time=tomorrow&maxPrice=3")),
      now,
    );
    expect(params).toMatchObject({ lat: 27.6722, lng: 85.428, maxPrice: 3, radiusKm: 5 });
    expect(new Date(params.pickupFrom!).getDate()).toBe(11);
    expect(new Date(params.pickupTo!).getDate()).toBe(12);
  });
});
