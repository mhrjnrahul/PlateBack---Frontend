import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("NotificationsPage", () => {
  it("lists notifications and marks them all read", async () => {
    const { user } = await renderApp("/me/notifications", { as: "user-maya" });
    expect(await screen.findByText("3 unread")).toBeInTheDocument();
    expect(screen.getByText("Reservation confirmed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
  });
});
