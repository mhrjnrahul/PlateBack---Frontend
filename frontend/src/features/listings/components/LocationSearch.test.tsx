import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "@/test/render-app";

/* Week 5: the landing page's main action was 41% covered; location had no test. */

function mockGeolocation(result: { lat: number; lng: number } | "denied" | "missing") {
  if (result === "missing") {
    vi.stubGlobal("navigator", {}); // no geolocation property at all
    return;
  }
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) =>
        result === "denied"
          ? fail({ code: 1 } as GeolocationPositionError)
          : ok({ coords: { latitude: result.lat, longitude: result.lng } } as GeolocationPosition),
    },
  });
}

describe("LocationSearch (landing page)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("searches the chosen area", async () => {
    const { user, router } = await renderApp("/");
    await user.selectOptions(screen.getByRole("combobox", { name: "Where are you?" }), "patan");
    await user.click(screen.getByRole("button", { name: "Find food near me" }));
    await waitFor(() => expect(router.state.location.search).toBe("?area=patan"));
  });

  it("searches around the browser's location, rounded to about 10 m", async () => {
    mockGeolocation({ lat: 27.712345678, lng: 85.318765432 });
    const { user, router } = await renderApp("/");
    await user.click(screen.getByRole("button", { name: /Use my current location/ }));
    await waitFor(() => expect(router.state.location.search).toBe("?lat=27.7123&lng=85.3188"));
  });

  it("explains a refused location and stays on the page", async () => {
    mockGeolocation("denied");
    const { user, router } = await renderApp("/");
    await user.click(screen.getByRole("button", { name: /Use my current location/ }));
    expect(
      await screen.findByText("Could not get your location. Choose an area instead."),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("explains a browser without location support", async () => {
    mockGeolocation("missing");
    const { user } = await renderApp("/");
    await user.click(screen.getByRole("button", { name: /Use my current location/ }));
    expect(
      await screen.findByText("Location is not available in this browser."),
    ).toBeInTheDocument();
  });
});
