import { describe, expect, it } from "vitest";
import { activeFilters, readFilters, toSearchParams, writeFilters } from "./browse-filters";

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

  it("only accepts the rupee price steps", () => {
    expect(readFilters(new URLSearchParams("maxPrice=300")).maxPrice).toBe("300");
    expect(readFilters(new URLSearchParams("maxPrice=3")).maxPrice).toBe("");
  });

  it("turns filters into API parameters", () => {
    const now = new Date(2026, 9, 10, 15, 0);
    const params = toSearchParams(
      readFilters(new URLSearchParams("area=bhaktapur&time=tomorrow&maxPrice=200")),
      now,
    );
    expect(params).toMatchObject({ lat: 27.6722, lng: 85.428, maxPrice: 200, radiusKm: 5 });
    expect(new Date(params.pickupFrom!).getDate()).toBe(11);
    expect(new Date(params.pickupTo!).getDate()).toBe(12);
  });
});

describe("activeFilters", () => {
  it("lists non-default filters as removable chips", () => {
    const f = readFilters(
      new URLSearchParams("category=Meals&maxPrice=0&time=tonight&radius=10&q=momo"),
    );
    expect(activeFilters(f).map((c) => c.label)).toEqual([
      '"momo"',
      "Meals",
      "Tonight",
      "Free only",
      "Within 10 km",
    ]);
    expect(activeFilters(f).find((c) => c.key === "radius")!.clear).toEqual({ radiusKm: 5 });
  });

  it("is empty with the defaults", () => {
    expect(activeFilters(readFilters(new URLSearchParams("area=patan&sort=price")))).toEqual([]);
  });
});
