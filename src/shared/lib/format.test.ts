import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  formatDay,
  formatDistance,
  formatDuration,
  formatRelative,
} from "./format";

describe("format", () => {
  const now = new Date(2026, 9, 10, 15, 0);

  it("names nearby days", () => {
    expect(formatDay(new Date(2026, 9, 10, 20).toISOString(), now)).toBe("Today");
    expect(formatDay(new Date(2026, 9, 11, 9).toISOString(), now)).toBe("Tomorrow");
    expect(formatDay(new Date(2026, 9, 9, 9).toISOString(), now)).toBe("Yesterday");
    expect(formatDay(new Date(2026, 9, 5, 9).toISOString(), now)).toBe("Mon Oct 5");
  });

  it("formats countdowns, durations and distances", () => {
    expect(formatCountdown((2 * 3600 + 14 * 60 + 10) * 1000)).toBe("02:14:10");
    expect(formatCountdown(-5000)).toBe("00:00:00");
    expect(formatDuration((2 * 60 + 14) * 60_000)).toBe("2 h 14 min");
    expect(formatDuration(30_000)).toBe("less than a minute");
    expect(formatDistance(0.84)).toBe("0.8 km");
    expect(formatDistance(0.02)).toBe("< 0.1 km");
  });

  it("formats relative times", () => {
    expect(formatRelative(new Date(2026, 9, 10, 14, 55).toISOString(), now)).toBe("5 min ago");
    expect(formatRelative(new Date(2026, 9, 9, 15).toISOString(), now)).toBe("yesterday");
  });
});
