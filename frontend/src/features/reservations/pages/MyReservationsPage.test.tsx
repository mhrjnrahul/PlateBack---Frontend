import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("MyReservationsPage", () => {
  it("shows active reservations with their pickup codes, impact and reliability", async () => {
    await renderApp("/me/reservations", { as: "user-maya" });
    expect(await screen.findByText("K7M2-9QXA")).toBeInTheDocument();
    expect(screen.getByText("R4TW-8HNE")).toBeInTheDocument();
    const impact = within(screen.getByRole("region", { name: "Your impact" }));
    expect(await impact.findByText("6")).toBeInTheDocument();
    expect(screen.getByText("90 / 100")).toBeInTheDocument();
  });

  it("cancels after confirming, and the reservation leaves the active list", async () => {
    const { user } = await renderApp("/me/reservations", { as: "user-maya" });
    const card = (await screen.findByText("K7M2-9QXA")).closest("article")!;
    await user.click(within(card).getByRole("button", { name: "Cancel" }));
    const dialog = within(
      await screen.findByRole("alertdialog", { name: "Cancel this reservation?" }),
    );
    expect(dialog.getByText(/Cancelling before the window opens is free/)).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Cancel reservation" }));

    expect(await screen.findByText("Reservation cancelled.")).toBeInTheDocument();
    expect(screen.queryByText("K7M2-9QXA")).not.toBeInTheDocument();
  });

  it("lists past reservations in the History tab", async () => {
    const { user, router } = await renderApp("/me/reservations", { as: "user-maya" });
    await user.click(await screen.findByRole("tab", { name: "History" }));
    expect(router.state.location.search).toBe("?tab=history");
    expect(await screen.findByText("Bagel bag")).toBeInTheDocument();
    expect(screen.getAllByText("Collected").length).toBeGreaterThanOrEqual(3);
  });
});
