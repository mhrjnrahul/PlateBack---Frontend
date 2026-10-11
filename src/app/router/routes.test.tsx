import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("routes", () => {
  it.each([
    ["/", /Reserve tonight's leftover food/],
    ["/browse", "Browse listings"],
    ["/listings/listing-pastry", "Mixed pastry box"],
    ["/login", "Log in"],
    ["/register", "Create an account"],
    ["/does-not-exist", "Page not found"],
  ])("%s shows its heading", async (path, heading) => {
    await renderApp(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it("sets the tab title per page", async () => {
    await renderApp("/listings/listing-pastry");
    await waitFor(() => expect(document.title).toBe("Mixed pastry box | PlateBack"));
  });

  it("has exactly one main landmark and one h1 per page", async () => {
    await renderApp("/browse");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("an unknown listing shows the 404 page", async () => {
    await renderApp("/listings/nope");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });
});

describe("route guards (design doc 4.6)", () => {
  it("sends signed-out visitors to log in, then back", async () => {
    const { router } = await renderApp("/me/reservations");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Fme%2Freservations");
  });

  it("lets a customer see their reservations", async () => {
    await renderApp("/me/reservations", { as: "user-maya" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "My reservations" }),
    ).toBeInTheDocument();
  });

  it("shows 403 for another role's page", async () => {
    await renderApp("/admin/organizations", { as: "user-maya" });
    expect(
      await screen.findByRole("heading", { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it("shows 403 for another business's dashboard", async () => {
    await renderApp("/org/org-greenleaf", { as: "user-arjun" });
    expect(
      await screen.findByRole("heading", { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it("opens the dashboard for its own staff and the review page for admins", async () => {
    await renderApp("/org/org-sunrise", { as: "user-arjun" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Sunrise Bakery" }),
    ).toBeInTheDocument();
  });
});
