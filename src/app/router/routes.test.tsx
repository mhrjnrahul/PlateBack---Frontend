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
    ["/org/1", "Business dashboard"],
    ["/login", "Log in"],
    ["/does-not-exist", "Page not found"],
  ])("%s shows its page heading", async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });
});
