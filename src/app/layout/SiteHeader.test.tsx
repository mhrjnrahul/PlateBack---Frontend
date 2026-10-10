import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "@/app/router/routes";
import { devUsers } from "@/features/auth/session/dev-users";
import type { SessionUser } from "@/features/auth/session/session-context";
import { SessionProvider } from "@/features/auth/session/SessionProvider";
import { Toaster } from "@/shared/ui/toaster";

async function renderAs(user: SessionUser | null, path = "/browse") {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <SessionProvider initialUser={user}>
      <RouterProvider router={router} />
      <Toaster />
    </SessionProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
  return within(screen.getByRole("navigation", { name: "Main" }));
}

/** The site header (role "banner"), so footer links don't match. */
function header() {
  return within(screen.getByRole("banner"));
}

function linkNames(nav: ReturnType<typeof within>) {
  return nav.getAllByRole("link").map((link: HTMLElement) => link.textContent);
}

describe("SiteHeader", () => {
  it("shows visitor links and the log in button when signed out", async () => {
    const nav = await renderAs(null);
    expect(linkNames(nav)).toEqual(["Browse", "How it works", "For businesses"]);
    expect(header().getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it.each([
    ["customer", ["Browse", "My reservations"]],
    ["business", ["Dashboard", "New listing", "Browse"]],
    ["admin", ["Organizations", "Browse"]],
  ] as const)("shows %s links", async (role, expected) => {
    const nav = await renderAs(devUsers[role]);
    expect(linkNames(nav)).toEqual(expected);
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("marks the current page link", async () => {
    const nav = await renderAs(devUsers.customer, "/me/reservations");
    expect(nav.getByRole("link", { name: "My reservations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.getByRole("link", { name: "Browse" })).not.toHaveAttribute("aria-current");
  });

  it("logs out from the account menu", async () => {
    const user = userEvent.setup();
    await renderAs(devUsers.business);

    await user.click(screen.getByRole("button", { name: "Account menu for Arjun Shrestha" }));
    expect(await screen.findByRole("menuitem", { name: "Business dashboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));

    expect(await screen.findByText("You are logged out.")).toBeInTheDocument();
    expect(header().getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });
});
