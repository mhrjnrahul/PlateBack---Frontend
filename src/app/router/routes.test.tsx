import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "@/features/auth/session/SessionProvider";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <SessionProvider initialUser={null}>
      <RouterProvider router={router} />
    </SessionProvider>,
  );
}

describe("routes", () => {
  it.each([
    ["/", "Good food shouldn't go to waste"],
    ["/browse", "Browse listings"],
    ["/listings/abc", "Listing detail"],
    ["/me/reservations", "My reservations"],
    ["/me/notifications", "Notifications"],
    ["/org/1", "Business dashboard"],
    ["/org/1/listings/new", "New listing"],
    ["/admin/organizations", "Organizations"],
    ["/login", "Log in"],
    ["/register", "Create an account"],
    ["/does-not-exist", "Page not found"],
  ])("%s shows its heading and sets the tab title", async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(document.title).toBe(`${heading} | PlateBack`);
  });

  it("has exactly one main landmark and one h1 per page", async () => {
    renderAt("/browse");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
