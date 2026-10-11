import { fireEvent, screen, within, waitFor } from "@testing-library/react";
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

  it("rejects a selling price above the MRP", async () => {
    const { user } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.type(await screen.findByRole("spinbutton", { name: /MRP/ }), "200");
    await user.type(screen.getByRole("spinbutton", { name: /Selling price/ }), "250");
    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(screen.getByRole("spinbutton", { name: /Selling price/ })).toHaveAccessibleDescription(
      /Selling price must be equal to or lower than MRP\./,
    );
  });

  it("publishes a listing and returns to the dashboard (US3)", async () => {
    const { user, router } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.type(await screen.findByRole("textbox", { name: /Title/ }), "Banana bread");
    await user.selectOptions(screen.getByRole("combobox", { name: /Category/ }), "Bakery");
    await user.type(screen.getByRole("spinbutton", { name: /Quantity/ }), "5");
    await user.type(screen.getByRole("spinbutton", { name: /MRP/ }), "300");
    await user.type(screen.getByRole("spinbutton", { name: /Selling price/ }), "120");
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

  it("shows the discount customers will see while pricing", async () => {
    const { user } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.type(await screen.findByRole("spinbutton", { name: /MRP/ }), "400");
    await user.type(screen.getByRole("spinbutton", { name: /Selling price/ }), "150");
    expect(screen.getByText("Customers see 62% off.")).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Pricing" })).getByText(/62% off/),
    ).toBeInTheDocument();
  });

  it("uploads an optional photo and shows it in the preview", async () => {
    const { user, router } = await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    await user.type(await screen.findByRole("textbox", { name: /Title/ }), "Banana bread");
    await user.selectOptions(screen.getByRole("combobox", { name: /Category/ }), "Bakery");
    await user.type(screen.getByRole("spinbutton", { name: /Quantity/ }), "5");
    await user.type(screen.getByRole("spinbutton", { name: /MRP/ }), "300");
    await user.type(screen.getByRole("spinbutton", { name: /Selling price/ }), "120");
    await user.type(screen.getByRole("textbox", { name: /Allergens/ }), "Contains gluten.");

    const photo = new File(["fake jpeg bytes"], "bread.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Add a photo"), photo);
    expect(await screen.findByRole("img", { name: "Chosen for this listing" })).toBeInTheDocument();
    expect(screen.getByLabelText("Replace photo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/org-sunrise"));
    const listing = db.listings.find((l) => l.title === "Banana bread");
    expect(listing?.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("explains why a file cannot be used as a photo", async () => {
    await renderApp("/org/org-sunrise/listings/new", { as: "user-arjun" });
    const input = await screen.findByLabelText("Add a photo");
    const notAPhoto = new File(["hello"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [notAPhoto] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Use a JPEG, PNG or WebP photo.");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
