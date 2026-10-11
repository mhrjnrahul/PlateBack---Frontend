import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { db } from "@/shared/mocks/db";
import { renderApp } from "@/test/render-app";

describe("CreateListingPage", () => {
  it("shows field errors linked to their inputs", async () => {
    const { user } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.click(await screen.findByRole("button", { name: "Publish listing" }));
    const title = screen.getByRole("textbox", { name: /Title/ });
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Title must be 3-80 characters.");
    expect(screen.getByRole("combobox", { name: /Category/ })).toHaveAccessibleDescription(
      "Choose a category.",
    );
  });

  it("publishes a listing and returns to the dashboard (US3)", async () => {
    const { user, router } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.type(await screen.findByRole("textbox", { name: /Title/ }), "Banana bread");
    await user.selectOptions(screen.getByRole("combobox", { name: /Category/ }), "Bakery");
    await user.type(screen.getByRole("spinbutton", { name: /Quantity/ }), "5");
    await user.type(screen.getByRole("spinbutton", { name: /Original price/ }), "6");
    await user.type(screen.getByRole("spinbutton", { name: /Price now/ }), "2");
    await user.type(
      screen.getByRole("textbox", { name: /Allergens/ }),
      "Contains gluten and eggs.",
    );
    // The live preview uses the customer card
    expect(screen.getByRole("heading", { name: "Banana bread" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(
      await screen.findByText("Listing published. It's now visible in search."),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/org-sunrise"));
    expect(db.listings.some((l) => l.title === "Banana bread" && l.status === "Active")).toBe(true);
  });
});
