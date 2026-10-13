import { describe, expect, it } from "vitest";
import { mapDirectionsUrl, mapSearchUrl } from "./maps";
import { initials } from "./people";

describe("helpers", () => {
  it("takes up to two initials", () => {
    expect(initials("Maya Rai")).toBe("MR");
    expect(initials("Platform Admin Team")).toBe("PA");
    expect(initials("  sita  ")).toBe("S");
  });

  it("builds map links from coordinates", () => {
    expect(mapSearchUrl(27.7, 85.3)).toBe(
      "https://www.google.com/maps/search/?api=1&query=27.7,85.3",
    );
    expect(mapDirectionsUrl(27.7, 85.3)).toContain("destination=27.7,85.3");
  });
});
