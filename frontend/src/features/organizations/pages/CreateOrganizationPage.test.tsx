import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/shared/mocks/db";
import { renderApp } from "@/test/render-app";

/*
 * Week 5: registering a business (flow C) was 48% covered and had no test,
 * although it is the only way a new business joins.
 */

/** Pretends the browser shared (or refused) a location. */
function mockGeolocation(result: { lat: number; lng: number } | "denied") {
  const getCurrentPosition = vi.fn((ok: PositionCallback, fail: PositionErrorCallback) =>
    result === "denied"
      ? fail({ code: 1 } as GeolocationPositionError)
      : ok({ coords: { latitude: result.lat, longitude: result.lng } } as GeolocationPosition),
  );
  vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
}

describe("CreateOrganizationPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("explains every missing field before sending anything", async () => {
    const { user } = await renderApp("/org/new", { as: "user-maya" });
    await user.click(await screen.findByRole("button", { name: "Submit for verification" }));

    expect(screen.getByRole("textbox", { name: /Business name/ })).toHaveAccessibleDescription(
      "Enter the business name.",
    );
    expect(screen.getByRole("combobox", { name: /Type of business/ })).toHaveAccessibleDescription(
      "Choose the type of business.",
    );
    expect(screen.getByRole("combobox", { name: /Area/ })).toHaveAccessibleDescription(
      /Choose the area, or use your current location\./,
    );
  });

  it("rejects a phone number that cannot be dialled but allows leaving it empty", async () => {
    const { user } = await renderApp("/org/new", { as: "user-maya" });
    const phone = await screen.findByRole("textbox", { name: /Phone/ });
    await user.type(phone, "call me");
    await user.tab();
    expect(phone).toHaveAccessibleDescription(/Enter a valid phone number, or leave it empty\./);
    await user.clear(phone);
    await user.tab();
    expect(phone).not.toHaveAttribute("aria-invalid", "true");
  });

  it("submits a business, which starts pending, and opens its dashboard", async () => {
    const { user, router } = await renderApp("/org/new", { as: "user-maya" });
    await user.type(await screen.findByRole("textbox", { name: /Business name/ }), "Maya's Momo");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Type of business/ }),
      "Restaurant",
    );
    await user.type(screen.getByRole("textbox", { name: /Address/ }), "Jhochhen Tole, Kathmandu");
    await user.selectOptions(screen.getByRole("combobox", { name: /Area/ }), "thamel");
    await user.click(screen.getByRole("button", { name: "Submit for verification" }));

    expect(await screen.findByText("Business submitted for verification.")).toBeInTheDocument();
    const created = db.organizations.find((o) => o.name === "Maya's Momo");
    expect(created?.status).toBe("Pending");
    await waitFor(() => expect(router.state.location.pathname).toBe(`/org/${created?.id}`));
  });

  it("can use the browser's location instead of an area", async () => {
    mockGeolocation({ lat: 27.7, lng: 85.33 });
    const { user } = await renderApp("/org/new", { as: "user-maya" });
    await user.click(await screen.findByRole("button", { name: "Use my current location" }));
    expect(screen.getByRole("combobox", { name: /Area/ })).toHaveValue("me");
    expect(screen.getByRole("option", { name: "My current location" })).toBeInTheDocument();
  });

  it("says so when location is refused, and the areas still work", async () => {
    mockGeolocation("denied");
    const { user } = await renderApp("/org/new", { as: "user-maya" });
    await user.click(await screen.findByRole("button", { name: "Use my current location" }));
    expect(
      await screen.findByText("Could not get your location. Choose an area instead."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "My current location" })).not.toBeInTheDocument();
  });

  it("sends people who already run a business to its dashboard", async () => {
    const { router } = await renderApp("/org/new", { as: "user-arjun" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/org-sunrise"));
  });
});
