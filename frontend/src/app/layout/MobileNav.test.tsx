import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("MobileNav", () => {
  it("opens a menu with the role's links and sign-up actions", async () => {
    const { user } = await renderApp("/");
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = within(screen.getByRole("dialog", { name: "Menu" }));
    for (const name of ["Browse", "How it works", "For businesses", "Sign up", "Log in"]) {
      expect(menu.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("navigates and closes when a link is chosen", async () => {
    const { user } = await renderApp("/");
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Browse" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Browse listings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the menu button", async () => {
    const { user } = await renderApp("/browse");
    const button = screen.getByRole("button", { name: "Open menu" });
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});

describe("MobileTabBar", () => {
  it("shows the customer's tabs and marks the current one", async () => {
    await renderApp("/me/reservations", { as: "user-maya" });
    const tabs = within(await screen.findByRole("navigation", { name: "Quick navigation" }));
    expect(tabs.getAllByRole("link").map((l: HTMLElement) => l.textContent)).toEqual([
      "Browse",
      "Reservations",
      "Notifications",
    ]);
    expect(tabs.getByRole("link", { name: "Reservations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("is not shown to visitors", async () => {
    await renderApp("/");
    expect(screen.queryByRole("navigation", { name: "Quick navigation" })).not.toBeInTheDocument();
  });
});
