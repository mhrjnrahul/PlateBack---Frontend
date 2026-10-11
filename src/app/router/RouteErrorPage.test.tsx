import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteErrorPage } from "./RouteErrorPage";

function Broken(): never {
  throw new Error("boom");
}

describe("RouteErrorPage", () => {
  // The page logs the error on purpose; keep the test output clean.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a friendly message with a way out when a page crashes", async () => {
    const router = createMemoryRouter([
      { path: "/", Component: Broken, ErrorBoundary: RouteErrorPage },
    ]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "This page broke" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
    expect(document.title).toBe("Error | PlateBack");
  });
});
