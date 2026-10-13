import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp, type DemoUser } from "@/test/render-app";

async function mainNavLinks(as?: DemoUser, path = "/browse") {
  const app = await renderApp(path, { as });
  // Wait until the session is restored (the account button replaces "Log in")
  if (as) await screen.findByRole("button", { name: /Account menu/ });
  const nav = within(screen.getByRole("navigation", { name: "Main" }));
  return { ...app, nav, names: nav.getAllByRole("link").map((l: HTMLElement) => l.textContent) };
}

/** The site header (role "banner"), so footer links don't match. */
const header = () => within(screen.getByRole("banner"));

describe("SiteHeader", () => {
  it("shows visitor links and log in when signed out", async () => {
    const { names } = await mainNavLinks();
    expect(names).toEqual(["Browse", "How it works", "For businesses"]);
    expect(header().getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it.each([
    ["user-maya", ["Browse", "My reservations"]],
    ["user-arjun", ["Dashboard", "Pickup", "New listing", "Browse"]],
    ["user-admin", ["Organizations", "Browse"]],
  ] as const)("shows the links for %s", async (as, expected) => {
    const { names } = await mainNavLinks(as);
    expect(names).toEqual(expected);
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("marks the current page link", async () => {
    const { nav } = await mainNavLinks("user-maya", "/me/reservations");
    expect(nav.getByRole("link", { name: "My reservations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.getByRole("link", { name: "Browse" })).not.toHaveAttribute("aria-current");
  });

  it("shows the unread count on the bell", async () => {
    await mainNavLinks("user-maya");
    expect(
      await header().findByRole("link", { name: "Notifications, 3 unread" }),
    ).toBeInTheDocument();
  });

  it("logs out from the account menu", async () => {
    const { user } = await mainNavLinks("user-arjun");
    await user.click(screen.getByRole("button", { name: "Account menu for Arjun Shrestha" }));
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }));
    expect(await screen.findByText("You are logged out.")).toBeInTheDocument();
    await waitFor(() => expect(header().getByRole("link", { name: "Log in" })).toBeInTheDocument());
  });
});
