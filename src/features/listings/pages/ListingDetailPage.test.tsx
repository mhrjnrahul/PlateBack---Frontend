import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/shared/mocks/node";
import { apiUrl, problem } from "@/shared/mocks/utils";
import { renderApp } from "@/test/render-app";

describe("ListingDetailPage", () => {
  it("shows details, allergens and asks visitors to log in to reserve", async () => {
    await renderApp("/listings/listing-pastry");
    expect(screen.getByRole("heading", { name: "Allergens" })).toBeInTheDocument();
    expect(
      screen.getByText("Contains gluten, milk and eggs; may contain nuts."),
    ).toBeInTheDocument();
    expect(screen.getByText("3 of 10 left")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in to reserve" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Flistings%2Flisting-pastry",
    );
  });

  it("reserves a quantity and shows the pickup code (US1)", async () => {
    const { user } = await renderApp("/listings/listing-thali", { as: "user-bikash" });
    await user.click(await screen.findByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Reserve · $6.00" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Reserved!" }));
    expect(dialog.getByText(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/)).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Keep browsing" }));
    // Stock refreshed from the server: 7 - 2
    expect(await screen.findByText("5 of 10 left")).toBeInTheDocument();
  });

  it("explains a conflict when someone else got the last unit (US2)", async () => {
    server.use(
      http.post(apiUrl("/listings/:id/reservations"), () =>
        problem(409, "SOLD_OUT", "No longer available", "Only 0 units remain for this listing."),
      ),
    );
    const { user } = await renderApp("/listings/listing-momo", { as: "user-bikash" });
    await user.click(await screen.findByRole("button", { name: /^Reserve/ }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not reserve");
    expect(alert).toHaveTextContent("Only 0 units remain for this listing.");
  });

  it("disables reserving when sold out", async () => {
    await renderApp("/listings/listing-juice", { as: "user-bikash" });
    expect(await screen.findByRole("button", { name: "Sold out" })).toBeDisabled();
  });
});
