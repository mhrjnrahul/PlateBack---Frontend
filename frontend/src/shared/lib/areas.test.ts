import { describe, expect, it } from "vitest";
import { AREAS, DEFAULT_AREA, findArea } from "./areas";

describe("areas", () => {
  it("finds an area by id and ignores unknown or missing ids", () => {
    expect(findArea("patan")?.label).toBe("Patan, Lalitpur");
    expect(findArea("pokhara")).toBeUndefined();
    expect(findArea(null)).toBeUndefined();
  });

  it("starts in Thamel, where most demo businesses are", () => {
    expect(DEFAULT_AREA.id).toBe("thamel");
  });

  it("keeps every area inside the Kathmandu valley, where the search radius makes sense", () => {
    for (const area of AREAS) {
      expect(area.lat).toBeGreaterThan(27.6);
      expect(area.lat).toBeLessThan(27.8);
      expect(area.lng).toBeGreaterThan(85.2);
      expect(area.lng).toBeLessThan(85.5);
    }
  });
});
