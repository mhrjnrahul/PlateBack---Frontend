import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "@/app/router/routes";
import { devUsers } from "@/features/auth/session/dev-users";
import type { SessionUser } from "@/features/auth/session/session-context";
import { SessionProvider } from "@/features/auth/session/SessionProvider";

async function renderAs(user: SessionUser | null, path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <SessionProvider initialUser={user}>
      <RouterProvider router={router} />
    </SessionProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
}

describe("MobileNav", () => {
  it("opens a menu with the role's links and sign-up actions", async () => {
    const user = userEvent.setup();
    await renderAs(null);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = within(screen.getByRole("dialog", { name: "Menu" }));

    for (const name of ["Browse", "How it works", "For businesses", "Sign up", "Log in"]) {
      expect(menu.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("navigates and closes when a link is chosen", async () => {
    const user = userEvent.setup();
    await renderAs(null);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Browse" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Browse listings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    await renderAs(devUsers.customer);
    const button = screen.getByRole("button", { name: "Open menu" });

    await user.click(button);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});

describe("MobileTabBar", () => {
  it("shows the customer's tabs and marks the current one", async () => {
    await renderAs(devUsers.customer, "/me/reservations");
    const tabs = within(screen.getByRole("navigation", { name: "Quick navigation" }));

    expect(tabs.getAllByRole("link").map((link: HTMLElement) => link.textContent)).toEqual([
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
    await renderAs(null);
    expect(screen.queryByRole("navigation", { name: "Quick navigation" })).not.toBeInTheDocument();
  });
});
